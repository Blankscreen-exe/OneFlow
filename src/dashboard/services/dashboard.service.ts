import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../../invoices/entities/invoice.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { PaymentStatus } from '../../payments/enums/payment-status.enum';
import { TimelineEvent } from '../../timeline/entities/timeline-event.entity';
import { Proposal, ProposalStatus } from '../../proposals/entities/proposal.entity';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';
import { AgencyMembership } from '../../agencies/entities/agency-membership.entity';
import {
  DashboardResponseDto,
  DashboardStatisticsDto,
  OutstandingInvoiceDto,
  RecentActivityDto,
  RecentInvoiceDto,
  RecentPaymentDto,
} from '../dto/dashboard-response.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(TimelineEvent)
    private timelineEventsRepository: Repository<TimelineEvent>,
    @InjectRepository(Proposal)
    private proposalsRepository: Repository<Proposal>,
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(AgencyMembership)
    private agencyMembershipRepository: Repository<AgencyMembership>,
  ) {}

  /**
   * Get dashboard data for a user or agency
   */
  async getDashboardData(userId: string, agencyId?: string): Promise<DashboardResponseDto> {
    // Determine if we're aggregating for an agency or individual user
    const isAgencyContext = !!agencyId;
    const userIds = isAgencyContext
      ? await this.getAgencyMemberIds(agencyId)
      : [userId];

    // Get all data in parallel for better performance
    const [
      statistics,
      outstandingInvoices,
      recentActivity,
      recentInvoices,
      recentPayments,
    ] = await Promise.all([
      this.getInvoiceStatistics(userIds, agencyId),
      this.getOutstandingInvoices(userIds, agencyId, 10),
      this.getRecentActivity(userIds, agencyId, 10),
      this.getRecentInvoices(userIds, agencyId, 5),
      this.getRecentPayments(userIds, agencyId, 5),
    ]);

    return {
      statistics,
      outstandingInvoices,
      recentActivity,
      recentInvoices,
      recentPayments,
    };
  }

  /**
   * Get agency member user IDs
   */
  private async getAgencyMemberIds(agencyId: string): Promise<string[]> {
    const memberships = await this.agencyMembershipRepository.find({
      where: { agencyId },
      select: ['userId'],
    });
    return memberships.map((m) => m.userId);
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStatistics(
    userIds: string[],
    agencyId?: string,
  ): Promise<DashboardStatisticsDto> {
    // Build where clause for invoices
    const invoiceWhere = agencyId
      ? { agencyId }
      : { userId: userIds.length === 1 ? userIds[0] : undefined };

    // If multiple user IDs, use IN clause
    const invoiceQueryBuilder = this.invoicesRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.client', 'client');

    if (agencyId) {
      invoiceQueryBuilder.where('invoice.agencyId = :agencyId', { agencyId });
    } else if (userIds.length === 1) {
      invoiceQueryBuilder.where('invoice.userId = :userId', { userId: userIds[0] });
    } else {
      invoiceQueryBuilder.where('invoice.userId IN (:...userIds)', { userIds });
    }

    // Get all invoices for counting
    const allInvoices = await invoiceQueryBuilder.getMany();

    // Calculate statistics
    const outstandingInvoices = allInvoices.filter(
      (inv) => inv.status === InvoiceStatus.SENT && Number(inv.amountDue) > 0,
    );
    const paidInvoices = allInvoices.filter(
      (inv) => inv.status === InvoiceStatus.PAID || Number(inv.amountPaid) >= Number(inv.total),
    );
    const draftInvoices = allInvoices.filter((inv) => inv.status === InvoiceStatus.DRAFT);

    // Calculate pending revenue (sum of outstanding invoice amounts)
    const pendingRevenue = outstandingInvoices.reduce(
      (sum, inv) => sum + Number(inv.amountDue),
      0,
    );

    // Get total revenue from payments
    const totalRevenue = await this.getTotalRevenue(userIds, agencyId);

    // Get client count
    const clientWhere = agencyId
      ? { agencyId }
      : { userId: userIds.length === 1 ? userIds[0] : undefined };

    const clientQueryBuilder = this.clientsRepository.createQueryBuilder('client');
    if (agencyId) {
      clientQueryBuilder.where('client.agencyId = :agencyId', { agencyId });
    } else if (userIds.length === 1) {
      clientQueryBuilder.where('client.userId = :userId', { userId: userIds[0] });
    } else {
      clientQueryBuilder.where('client.userId IN (:...userIds)', { userIds });
    }
    const totalClients = await clientQueryBuilder.getCount();

    // Get proposal statistics
    const proposalQueryBuilder = this.proposalsRepository.createQueryBuilder('proposal');
    if (agencyId) {
      // For agencies, we need to get proposals from all members
      // Since proposals don't have agencyId, we filter by userId
      proposalQueryBuilder.where('proposal.userId IN (:...userIds)', { userIds });
    } else if (userIds.length === 1) {
      proposalQueryBuilder.where('proposal.userId = :userId', { userId: userIds[0] });
    } else {
      proposalQueryBuilder.where('proposal.userId IN (:...userIds)', { userIds });
    }
    const allProposals = await proposalQueryBuilder.getMany();
    const activeProposals = allProposals.filter((p) => p.status === ProposalStatus.SENT);

    return {
      outstandingInvoicesCount: outstandingInvoices.length,
      paidInvoicesCount: paidInvoices.length,
      draftInvoicesCount: draftInvoices.length,
      totalInvoicesCount: allInvoices.length,
      totalRevenue,
      pendingRevenue,
      totalClients,
      totalProposals: allProposals.length,
      activeProposals: activeProposals.length,
    };
  }

  /**
   * Get total revenue from succeeded payments
   */
  private async getTotalRevenue(userIds: string[], agencyId?: string): Promise<number> {
    const paymentQueryBuilder = this.paymentsRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.invoice', 'invoice')
      .where('payment.status = :status', { status: PaymentStatus.SUCCEEDED });

    if (agencyId) {
      paymentQueryBuilder.andWhere('invoice.agencyId = :agencyId', { agencyId });
    } else if (userIds.length === 1) {
      paymentQueryBuilder.andWhere('invoice.userId = :userId', { userId: userIds[0] });
    } else {
      paymentQueryBuilder.andWhere('invoice.userId IN (:...userIds)', { userIds });
    }

    const payments = await paymentQueryBuilder.getMany();
    return payments.reduce(
      (sum, payment) => sum + Number(payment.amount) - Number(payment.refundAmount || 0),
      0,
    );
  }

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(
    userIds: string[],
    agencyId?: string,
  ): Promise<{ totalRevenue: number; pendingRevenue: number }> {
    const totalRevenue = await this.getTotalRevenue(userIds, agencyId);

    // Get pending revenue from outstanding invoices
    const invoiceQueryBuilder = this.invoicesRepository
      .createQueryBuilder('invoice')
      .where('invoice.status = :status', { status: InvoiceStatus.SENT })
      .andWhere('invoice.amountDue > 0');

    if (agencyId) {
      invoiceQueryBuilder.andWhere('invoice.agencyId = :agencyId', { agencyId });
    } else if (userIds.length === 1) {
      invoiceQueryBuilder.andWhere('invoice.userId = :userId', { userId: userIds[0] });
    } else {
      invoiceQueryBuilder.andWhere('invoice.userId IN (:...userIds)', { userIds });
    }

    const outstandingInvoices = await invoiceQueryBuilder.getMany();
    const pendingRevenue = outstandingInvoices.reduce(
      (sum, inv) => sum + Number(inv.amountDue),
      0,
    );

    return { totalRevenue, pendingRevenue };
  }

  /**
   * Get outstanding invoices
   */
  async getOutstandingInvoices(
    userIds: string[],
    agencyId: string | undefined,
    limit: number = 10,
  ): Promise<OutstandingInvoiceDto[]> {
    const queryBuilder = this.invoicesRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.client', 'client')
      .where('invoice.status = :status', { status: InvoiceStatus.SENT })
      .andWhere('invoice.amountDue > 0')
      .orderBy('invoice.dueDate', 'ASC')
      .addOrderBy('invoice.createdAt', 'DESC')
      .limit(limit);

    if (agencyId) {
      queryBuilder.andWhere('invoice.agencyId = :agencyId', { agencyId });
    } else if (userIds.length === 1) {
      queryBuilder.andWhere('invoice.userId = :userId', { userId: userIds[0] });
    } else {
      queryBuilder.andWhere('invoice.userId IN (:...userIds)', { userIds });
    }

    const invoices = await queryBuilder.getMany();

    return invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.client?.name || 'Unknown Client',
      clientId: invoice.clientId,
      total: Number(invoice.total),
      amountDue: Number(invoice.amountDue),
      dueDate: invoice.dueDate,
      sentAt: invoice.sentAt,
      createdAt: invoice.createdAt,
    }));
  }

  /**
   * Get recent activity across all clients
   */
  async getRecentActivity(
    userIds: string[],
    agencyId: string | undefined,
    limit: number = 10,
  ): Promise<RecentActivityDto[]> {
    // First, get all client IDs for this user/agency
    const clientQueryBuilder = this.clientsRepository.createQueryBuilder('client');
    if (agencyId) {
      clientQueryBuilder.where('client.agencyId = :agencyId', { agencyId });
    } else if (userIds.length === 1) {
      clientQueryBuilder.where('client.userId = :userId', { userId: userIds[0] });
    } else {
      clientQueryBuilder.where('client.userId IN (:...userIds)', { userIds });
    }
    const clients = await clientQueryBuilder.select(['client.id']).getMany();
    const clientIds = clients.map((c) => c.id);

    if (clientIds.length === 0) {
      return [];
    }

    // Get recent timeline events for these clients
    const events = await this.timelineEventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.client', 'client')
      .where('event.clientId IN (:...clientIds)', { clientIds })
      .orderBy('event.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    return events.map((event) => ({
      id: event.id,
      type: event.type,
      title: event.title,
      description: event.description,
      clientId: event.clientId,
      clientName: event.client?.name || 'Unknown Client',
      createdAt: event.createdAt,
      relatedEntityType: event.relatedEntityType,
      relatedEntityId: event.relatedEntityId,
    }));
  }

  /**
   * Get recent invoices
   */
  async getRecentInvoices(
    userIds: string[],
    agencyId: string | undefined,
    limit: number = 5,
  ): Promise<RecentInvoiceDto[]> {
    const queryBuilder = this.invoicesRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.client', 'client')
      .orderBy('invoice.createdAt', 'DESC')
      .limit(limit);

    if (agencyId) {
      queryBuilder.where('invoice.agencyId = :agencyId', { agencyId });
    } else if (userIds.length === 1) {
      queryBuilder.where('invoice.userId = :userId', { userId: userIds[0] });
    } else {
      queryBuilder.where('invoice.userId IN (:...userIds)', { userIds });
    }

    const invoices = await queryBuilder.getMany();

    return invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.client?.name || 'Unknown Client',
      status: invoice.status,
      total: Number(invoice.total),
      amountDue: Number(invoice.amountDue),
      createdAt: invoice.createdAt,
      sentAt: invoice.sentAt,
    }));
  }

  /**
   * Get recent payments
   */
  async getRecentPayments(
    userIds: string[],
    agencyId: string | undefined,
    limit: number = 5,
  ): Promise<RecentPaymentDto[]> {
    const queryBuilder = this.paymentsRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.invoice', 'invoice')
      .leftJoinAndSelect('invoice.client', 'client')
      .where('payment.status = :status', { status: PaymentStatus.SUCCEEDED })
      .orderBy('payment.createdAt', 'DESC')
      .limit(limit);

    if (agencyId) {
      queryBuilder.andWhere('invoice.agencyId = :agencyId', { agencyId });
    } else if (userIds.length === 1) {
      queryBuilder.andWhere('invoice.userId = :userId', { userId: userIds[0] });
    } else {
      queryBuilder.andWhere('invoice.userId IN (:...userIds)', { userIds });
    }

    const payments = await queryBuilder.getMany();

    return payments.map((payment) => ({
      id: payment.id,
      invoiceId: payment.invoiceId,
      invoiceNumber: payment.invoice?.invoiceNumber || 'N/A',
      clientName: payment.invoice?.client?.name || 'Unknown Client',
      amount: Number(payment.amount),
      platformFee: Number(payment.platformFee || 0),
      status: payment.status,
      createdAt: payment.createdAt,
    }));
  }
}

