import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { InvoiceItem } from '../entities/invoice-item.entity';
import { Proposal, ProposalStatus } from '../../proposals/entities/proposal.entity';
import { ProposalItem } from '../../proposals/entities/proposal-item.entity';
import { InvoiceNumberService } from './invoice-number.service';
import { InvoiceSendingService } from './invoice-sending.service';
import { InvoiceAccessService } from './invoice-access.service';
import { TimelineService } from '../../timeline/services/timeline.service';
import { TimelineEventType } from '../../timeline/enums/timeline-event-type.enum';
import { RelatedEntityType } from '../../timeline/enums/related-entity-type.enum';
import {
  formatInvoiceCreatedEvent,
  formatInvoiceSentEvent,
} from '../../timeline/utils/event-formatter.util';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemsRepository: Repository<InvoiceItem>,
    @InjectRepository(Proposal)
    private proposalsRepository: Repository<Proposal>,
    @InjectRepository(ProposalItem)
    private proposalItemsRepository: Repository<ProposalItem>,
    private invoiceNumberService: InvoiceNumberService,
    private invoiceSendingService: InvoiceSendingService,
    private invoiceAccessService: InvoiceAccessService,
    private configService: ConfigService,
    private timelineService: TimelineService,
  ) {}

  /**
   * Validates that a status transition is allowed
   */
  private validateStatusTransition(
    currentStatus: InvoiceStatus,
    newStatus: InvoiceStatus,
  ): void {
    const allowedTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
      [InvoiceStatus.DRAFT]: [InvoiceStatus.SENT],
      [InvoiceStatus.SENT]: [InvoiceStatus.PAID],
      [InvoiceStatus.PAID]: [],
    };

    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  /**
   * Validates that the invoice belongs to the user
   */
  private async validateOwnership(
    invoiceId: string,
    userId: string,
  ): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findOne({
      where: { id: invoiceId, userId },
      relations: ['items', 'client', 'proposal'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found or access denied');
    }

    return invoice;
  }

  /**
   * Calculates due date based on configuration
   */
  private calculateDueDate(): Date {
    const dueDays = this.configService.get<number>('invoice.dueDays') || 30;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);
    return dueDate;
  }

  /**
   * Creates an invoice from an accepted proposal
   */
  async createFromProposal(
    proposalId: string,
    userId: string,
  ): Promise<Invoice> {
    // Validate proposal exists and belongs to user
    const proposal = await this.proposalsRepository.findOne({
      where: { id: proposalId, userId },
      relations: ['items', 'client'],
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found or access denied');
    }

    // Validate proposal status is ACCEPTED
    if (proposal.status !== ProposalStatus.ACCEPTED) {
      throw new BadRequestException(
        'Invoice can only be created from accepted proposals',
      );
    }

    // Check if invoice already exists for this proposal (1:1 relationship)
    const existingInvoice = await this.invoicesRepository.findOne({
      where: { proposalId },
    });

    if (existingInvoice) {
      throw new BadRequestException(
        'An invoice already exists for this proposal',
      );
    }

    // Generate invoice number
    const invoiceNumber = await this.invoiceNumberService.generateNextInvoiceNumber(
      userId,
    );

    // Calculate due date
    const dueDate = this.calculateDueDate();

    // Create invoice
    const invoice = this.invoicesRepository.create({
      userId,
      clientId: proposal.clientId,
      proposalId: proposal.id,
      invoiceNumber,
      status: InvoiceStatus.DRAFT,
      subtotal: proposal.subtotal,
      taxRate: proposal.taxRate,
      taxAmount: proposal.taxAmount,
      total: proposal.total,
      notes: proposal.notes,
      dueDate,
    });

    const savedInvoice = await this.invoicesRepository.save(invoice);

    // Copy proposal items to invoice items
    if (proposal.items && proposal.items.length > 0) {
      const invoiceItems = proposal.items.map((proposalItem) => {
        return this.invoiceItemsRepository.create({
          invoiceId: savedInvoice.id,
          description: proposalItem.description,
          quantity: proposalItem.quantity,
          unitPrice: proposalItem.unitPrice,
          total: proposalItem.total,
          sortOrder: proposalItem.sortOrder,
        });
      });

      await this.invoiceItemsRepository.save(invoiceItems);
    }

    const finalInvoice = await this.findOne(savedInvoice.id, userId);

    // Create timeline event
    const { title, description } = formatInvoiceCreatedEvent(finalInvoice);
    await this.timelineService.createEvent(
      finalInvoice.clientId,
      userId,
      TimelineEventType.INVOICE_CREATED,
      title,
      description,
      {
        invoiceId: finalInvoice.id,
        invoiceNumber: finalInvoice.invoiceNumber,
        totalAmount: Number(finalInvoice.total),
        proposalId: finalInvoice.proposalId,
      },
      RelatedEntityType.INVOICE,
      finalInvoice.id,
    );

    return finalInvoice;
  }

  /**
   * Finds all invoices for a user with pagination and filters
   */
  async findAll(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      status?: InvoiceStatus;
      clientId?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
  ): Promise<PaginatedResult<Invoice>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: FindOptionsWhere<Invoice> = {
      userId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.clientId) {
      where.clientId = query.clientId;
    }

    if (query.dateFrom || query.dateTo) {
      const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
      const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;

      if (dateFrom && dateTo) {
        where.createdAt = Between(dateFrom, dateTo);
      } else if (dateFrom) {
        where.createdAt = Between(dateFrom, new Date());
      } else if (dateTo) {
        where.createdAt = Between(new Date(0), dateTo);
      }
    }

    // Get total count
    const total = await this.invoicesRepository.count({ where });

    // Get invoices
    const invoices = await this.invoicesRepository.find({
      where,
      relations: ['items', 'client', 'proposal'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: invoices,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Finds a single invoice by ID with ownership validation
   */
  async findOne(id: string, userId: string): Promise<Invoice> {
    return this.validateOwnership(id, userId);
  }

  /**
   * Updates an invoice (only if DRAFT status)
   */
  async update(
    id: string,
    userId: string,
    updateDto: {
      notes?: string;
      dueDate?: string;
    },
  ): Promise<Invoice> {
    const invoice = await this.validateOwnership(id, userId);

    // Only allow updates if invoice is in DRAFT status
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        'Invoice cannot be edited after it has been sent',
      );
    }

    // Update allowed fields
    if (updateDto.notes !== undefined) {
      invoice.notes = updateDto.notes;
    }

    if (updateDto.dueDate !== undefined) {
      invoice.dueDate = new Date(updateDto.dueDate);
    }

    return this.invoicesRepository.save(invoice);
  }

  /**
   * Sends an invoice (updates status to SENT and optionally sends email)
   */
  async send(
    id: string,
    userId: string,
    recipientEmail?: string,
  ): Promise<Invoice> {
    const invoice = await this.validateOwnership(id, userId);

    // Validate status transition
    this.validateStatusTransition(invoice.status, InvoiceStatus.SENT);

    // Update status to SENT
    invoice.status = InvoiceStatus.SENT;
    invoice.sentAt = new Date();
    await this.invoicesRepository.save(invoice);

    // Optionally send email if recipient email is provided
    if (recipientEmail) {
      try {
        await this.invoiceSendingService.sendInvoice(invoice, recipientEmail);
      } catch (error) {
        // Log error but don't fail the operation
        console.error('Failed to send invoice email:', error);
      }
    } else {
      // Create timeline event if invoice was just marked as sent without email
      const updatedInvoice = await this.findOne(id, userId);
      const { title, description } = formatInvoiceSentEvent(updatedInvoice);
      await this.timelineService.createEvent(
        updatedInvoice.clientId,
        userId,
        TimelineEventType.INVOICE_SENT,
        title,
        description,
        {
          invoiceId: updatedInvoice.id,
          invoiceNumber: updatedInvoice.invoiceNumber,
          totalAmount: Number(updatedInvoice.total),
        },
        RelatedEntityType.INVOICE,
        updatedInvoice.id,
      );
    }

    return this.findOne(id, userId);
  }
}

