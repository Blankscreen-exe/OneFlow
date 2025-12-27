import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository, In } from 'typeorm';
  import { Proposal, ProposalStatus } from './entities/proposal.entity';
  import { ProposalItem } from './entities/proposal-item.entity';
  import { ProposalContactMethod } from './entities/proposal-contact-method.entity';
  import { Client } from '../clients/entities/client.entity';
  import { ClientContact } from '../client-contacts/entities/client-contact.entity';
  import { CreateProposalDto } from './dto/create-proposal.dto';
  import { UpdateProposalDto } from './dto/update-proposal.dto';
  import { ProposalQueryDto } from './dto/proposal-query.dto';
import { ProposalSendingService } from './services/proposal-sending.service';
import { ProposalAcceptanceService } from './services/proposal-acceptance.service';
import { TimelineService } from '../timeline/services/timeline.service';
import { TimelineEventType } from '../timeline/enums/timeline-event-type.enum';
import { RelatedEntityType } from '../timeline/enums/related-entity-type.enum';
import {
  formatProposalCreatedEvent,
  formatProposalSentEvent,
} from '../timeline/utils/event-formatter.util';
  
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
  export class ProposalsService {
    constructor(
      @InjectRepository(Proposal)
      private proposalsRepository: Repository<Proposal>,
      @InjectRepository(ProposalItem)
      private proposalItemsRepository: Repository<ProposalItem>,
      @InjectRepository(ProposalContactMethod)
      private proposalContactMethodsRepository: Repository<ProposalContactMethod>,
      @InjectRepository(Client)
      private clientsRepository: Repository<Client>,
      @InjectRepository(ClientContact)
      private clientContactsRepository: Repository<ClientContact>,
      private proposalSendingService: ProposalSendingService,
      private proposalAcceptanceService: ProposalAcceptanceService,
      private timelineService: TimelineService,
    ) {}
  
    /**
     * Validates that the client exists and belongs to the user
     */
    private async validateClient(
      clientId: string,
      userId: string,
    ): Promise<void> {
      const client = await this.clientsRepository.findOne({
        where: { id: clientId, userId },
      });
      if (!client) {
        throw new BadRequestException(
          'Client not found or does not belong to you',
        );
      }
    }
  
    /**
     * Calculates line item total
     */
    private calculateItemTotal(quantity: number, unitPrice: number): number {
      return Number((quantity * unitPrice).toFixed(2));
    }
  
    /**
     * Recalculates all totals for a proposal based on its items
     */
    async recalculateTotals(proposalId: string): Promise<Proposal> {
      const proposal = await this.proposalsRepository.findOne({
        where: { id: proposalId },
        relations: ['items'],
      });
  
      if (!proposal) {
        throw new NotFoundException('Proposal not found');
      }
  
      // Calculate subtotal from all items
      const subtotal = proposal.items.reduce(
        (sum, item) => sum + Number(item.total),
        0,
      );
  
      // Calculate tax amount
      const taxAmount = Number(
        ((subtotal * proposal.taxRate) / 100).toFixed(2),
      );
  
      // Calculate total
      const total = Number((subtotal + taxAmount).toFixed(2));
  
      // Update the proposal
      proposal.subtotal = subtotal;
      proposal.taxAmount = taxAmount;
      proposal.total = total;
  
      return this.proposalsRepository.save(proposal);
    }
  
    /**
     * Validates that a status transition is allowed
     */
    private validateStatusTransition(
      currentStatus: ProposalStatus,
      newStatus: ProposalStatus,
    ): void {
      const allowedTransitions: Record<ProposalStatus, ProposalStatus[]> = {
        [ProposalStatus.DRAFT]: [ProposalStatus.SENT],
        [ProposalStatus.SENT]: [ProposalStatus.ACCEPTED, ProposalStatus.REJECTED],
        [ProposalStatus.ACCEPTED]: [],
        [ProposalStatus.REJECTED]: [],
      };
  
      if (!allowedTransitions[currentStatus].includes(newStatus)) {
        throw new BadRequestException(
          `Cannot transition from ${currentStatus} to ${newStatus}`,
        );
      }
    }
  
    /**
     * Creates a new proposal with optional items
     */
    async create(
      userId: string,
      createProposalDto: CreateProposalDto,
    ): Promise<Proposal> {
      // Validate client belongs to user
      await this.validateClient(createProposalDto.clientId, userId);
  
      // Create proposal
      const proposal = this.proposalsRepository.create({
        userId,
        clientId: createProposalDto.clientId,
        title: createProposalDto.title,
        validUntil: createProposalDto.validUntil
          ? new Date(createProposalDto.validUntil)
          : undefined,
        taxRate: createProposalDto.taxRate ?? 0,
        notes: createProposalDto.notes,
        status: ProposalStatus.DRAFT,
      });
  
      // Save the proposal first to get its ID
      const savedProposal = await this.proposalsRepository.save(proposal);
  
      // If items are provided, create them
      if (createProposalDto.items && createProposalDto.items.length > 0) {
        const items = createProposalDto.items.map((itemDto, index) => {
          const quantity = itemDto.quantity ?? 1;
          const total = this.calculateItemTotal(quantity, itemDto.unitPrice);
  
          return this.proposalItemsRepository.create({
            proposalId: savedProposal.id,
            description: itemDto.description,
            quantity,
            unitPrice: itemDto.unitPrice,
            total,
            sortOrder: itemDto.sortOrder ?? index,
          });
        });
  
        await this.proposalItemsRepository.save(items);
      }
  
      // Recalculate totals
      const finalProposal = await this.recalculateTotals(savedProposal.id);

      // Create timeline event
      const { title, description } = formatProposalCreatedEvent(finalProposal);
      await this.timelineService.createEvent(
        finalProposal.clientId,
        userId,
        TimelineEventType.PROPOSAL_CREATED,
        title,
        description,
        {
          proposalId: finalProposal.id,
          proposalTitle: finalProposal.title,
          totalAmount: Number(finalProposal.total),
        },
        RelatedEntityType.PROPOSAL,
        finalProposal.id,
      );

      return finalProposal;
    }
  
    /**
     * Finds all proposals for a user with pagination and filters
     */
    async findAll(
      userId: string,
      query: ProposalQueryDto,
    ): Promise<PaginatedResult<Proposal>> {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const sortBy = query.sortBy ?? 'createdAt';
      const sortOrder = query.sortOrder ?? 'DESC';
      const skip = (page - 1) * limit;
  
      const queryBuilder = this.proposalsRepository
        .createQueryBuilder('proposal')
        .leftJoinAndSelect('proposal.items', 'items')
        .leftJoinAndSelect('proposal.client', 'client')
        .where('proposal.userId = :userId', { userId });
  
      // Apply status filter
      if (query.status) {
        queryBuilder.andWhere('proposal.status = :status', {
          status: query.status,
        });
      }
  
      // Apply client filter
      if (query.clientId) {
        queryBuilder.andWhere('proposal.clientId = :clientId', {
          clientId: query.clientId,
        });
      }
  
      // Apply sorting
      queryBuilder.orderBy(`proposal.${sortBy}`, sortOrder);
  
      // Get total count
      const total = await queryBuilder.getCount();
  
      // Apply pagination
      queryBuilder.skip(skip).take(limit);
  
      const data = await queryBuilder.getMany();
  
      const totalPages = Math.ceil(total / limit);
  
      return {
        data,
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
     * Finds a single proposal by ID
     */
    async findOne(id: string, userId: string): Promise<Proposal> {
      const proposal = await this.proposalsRepository.findOne({
        where: { id, userId },
        relations: ['items', 'client'],
      });
  
      if (!proposal) {
        throw new NotFoundException('Proposal not found');
      }
  
      return proposal;
    }
  
    /**
     * Updates a proposal (only if it's in draft status)
     */
    async update(
      id: string,
      userId: string,
      updateProposalDto: UpdateProposalDto,
    ): Promise<Proposal> {
      const proposal = await this.findOne(id, userId);
  
      // Check if proposal can be edited
      if (proposal.status !== ProposalStatus.DRAFT) {
        throw new ForbiddenException(
          'Cannot edit a proposal that is not in draft status',
        );
      }
  
      // If status is being changed, validate the transition
      if (updateProposalDto.status && updateProposalDto.status !== proposal.status) {
        this.validateStatusTransition(proposal.status, updateProposalDto.status);
  
        // Set timestamp based on new status
        if (updateProposalDto.status === ProposalStatus.SENT) {
          proposal.sentAt = new Date();
        } else if (updateProposalDto.status === ProposalStatus.ACCEPTED) {
          proposal.acceptedAt = new Date();
        } else if (updateProposalDto.status === ProposalStatus.REJECTED) {
          proposal.rejectedAt = new Date();
        }
      }
  
      // If clientId is being changed, validate it
      if (updateProposalDto.clientId && updateProposalDto.clientId !== proposal.clientId) {
        await this.validateClient(updateProposalDto.clientId, userId);
      }
  
      // Update fields
      if (updateProposalDto.title !== undefined) {
        proposal.title = updateProposalDto.title;
      }
      if (updateProposalDto.clientId !== undefined) {
        proposal.clientId = updateProposalDto.clientId;
      }
      if (updateProposalDto.validUntil !== undefined) {
        proposal.validUntil = new Date(updateProposalDto.validUntil);
      }
      if (updateProposalDto.taxRate !== undefined) {
        proposal.taxRate = updateProposalDto.taxRate;
      }
      if (updateProposalDto.notes !== undefined) {
        proposal.notes = updateProposalDto.notes;
      }
      if (updateProposalDto.status !== undefined) {
        proposal.status = updateProposalDto.status;
      }
  
      await this.proposalsRepository.save(proposal);
  
      // Recalculate totals if tax rate changed
      if (updateProposalDto.taxRate !== undefined) {
        return this.recalculateTotals(id);
      }
  
      return this.findOne(id, userId);
    }
  
    /**
     * Deletes a proposal (only if it's in draft status)
     */
    async remove(id: string, userId: string): Promise<void> {
      const proposal = await this.findOne(id, userId);
  
      if (proposal.status !== ProposalStatus.DRAFT) {
        throw new ForbiddenException(
          'Cannot delete a proposal that is not in draft status',
        );
      }
  
      await this.proposalsRepository.remove(proposal);
    }
  
    /**
     * Sends a proposal (changes status from draft to sent)
     */
    async send(
      id: string,
      userId: string,
      contactIds: string[] = [],
    ): Promise<Proposal> {
      const proposal = await this.findOne(id, userId);

      // Ensure proposal has acceptance token
      await this.proposalAcceptanceService.ensureAcceptanceToken(proposal);

      // Send via contact methods if provided
      if (contactIds.length > 0) {
        const result = await this.proposalSendingService.sendViaContacts(
          id,
          contactIds,
        );

        if (result.failed > 0 && result.success === 0) {
          // All methods failed
          throw new BadRequestException(
            `Failed to send proposal: ${result.errors.join('; ')}`,
          );
        }

        // Log partial failures
        if (result.failed > 0) {
          // Some methods failed but at least one succeeded
          // Proposal is still considered sent
        }
      }

      // Update proposal status and sentAt timestamp
      proposal.status = ProposalStatus.SENT;
      proposal.sentAt = new Date();
      await this.proposalsRepository.save(proposal);

      const updatedProposal = await this.findOne(id, userId);

      // Create timeline event
      const { title, description } = formatProposalSentEvent(updatedProposal);
      await this.timelineService.createEvent(
        updatedProposal.clientId,
        userId,
        TimelineEventType.PROPOSAL_SENT,
        title,
        description,
        {
          proposalId: updatedProposal.id,
          proposalTitle: updatedProposal.title,
          totalAmount: Number(updatedProposal.total),
        },
        RelatedEntityType.PROPOSAL,
        updatedProposal.id,
      );

      return updatedProposal;
    }

    /**
     * Gets sending status for a proposal
     */
    async getSendingStatus(proposalId: string): Promise<ProposalContactMethod[]> {
      return this.proposalContactMethodsRepository.find({
        where: { proposalId },
        relations: ['contact'],
      });
    }
  
    /**
     * Accepts a proposal
     */
    async accept(id: string, userId: string): Promise<Proposal> {
      const proposal = await this.findOne(id, userId);
  
      if (proposal.status !== ProposalStatus.SENT) {
        throw new BadRequestException('Only sent proposals can be accepted');
      }
  
      proposal.status = ProposalStatus.ACCEPTED;
      proposal.acceptedAt = new Date();
  
      return this.proposalsRepository.save(proposal);
    }
  
    /**
     * Rejects a proposal
     */
    async reject(id: string, userId: string): Promise<Proposal> {
      const proposal = await this.findOne(id, userId);
  
      if (proposal.status !== ProposalStatus.SENT) {
        throw new BadRequestException('Only sent proposals can be rejected');
      }
  
      proposal.status = ProposalStatus.REJECTED;
      proposal.rejectedAt = new Date();
  
      return this.proposalsRepository.save(proposal);
    }
  }