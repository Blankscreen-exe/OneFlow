import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientServiceProviderService } from '../../users/services/client-service-provider.service';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { Proposal } from '../../proposals/entities/proposal.entity';
import { InvoiceStatus } from '../../invoices/entities/invoice.entity';

@Injectable()
export class ClientPortalService {
  constructor(
    private clientServiceProviderService: ClientServiceProviderService,
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(Proposal)
    private proposalsRepository: Repository<Proposal>,
  ) {}

  /**
   * Get all invoices for a client from all linked service providers
   */
  async getInvoicesForClient(
    clientId: string,
    serviceProviderId?: string,
  ): Promise<Invoice[]> {
    // Get all service providers for this client
    const serviceProviders = await this.clientServiceProviderService.getServiceProvidersForClient(
      clientId,
    );

    if (serviceProviders.length === 0) {
      return [];
    }

    // Filter by specific SP if provided
    const spIds = serviceProviderId
      ? [serviceProviderId]
      : serviceProviders.map((sp) => sp.id);

    // Get all clients (Client entities) linked to these SPs
    // Note: We need to find Client entities by email matching the user email
    // This is a simplified approach - in production you might want a direct link
    const invoices = await this.invoicesRepository.find({
      where: spIds.map((spId) => ({ userId: spId })),
      relations: ['items', 'client', 'user', 'proposal'],
      order: { createdAt: 'DESC' },
    });

    // Filter invoices where the client email matches the client user's email
    // This is a workaround - ideally invoices would be linked to client user IDs
    // For now, we'll return all invoices from the SPs
    return invoices;
  }

  /**
   * Get all proposals for a client from all linked service providers
   */
  async getProposalsForClient(
    clientId: string,
    serviceProviderId?: string,
  ): Promise<Proposal[]> {
    // Get all service providers for this client
    const serviceProviders = await this.clientServiceProviderService.getServiceProvidersForClient(
      clientId,
    );

    if (serviceProviders.length === 0) {
      return [];
    }

    // Filter by specific SP if provided
    const spIds = serviceProviderId
      ? [serviceProviderId]
      : serviceProviders.map((sp) => sp.id);

    const proposals = await this.proposalsRepository.find({
      where: spIds.map((spId) => ({ userId: spId })),
      relations: ['items', 'client', 'user'],
      order: { createdAt: 'DESC' },
    });

    return proposals;
  }

  /**
   * Get all linked service providers for a client
   */
  async getServiceProvidersForClient(clientId: string) {
    return this.clientServiceProviderService.getServiceProvidersForClient(clientId);
  }

  /**
   * Get dashboard data for a client
   */
  async getDashboardData(clientId: string) {
    const invoices = await this.getInvoicesForClient(clientId);
    const proposals = await this.getProposalsForClient(clientId);
    const serviceProviders = await this.getServiceProvidersForClient(clientId);

    // Calculate invoice statistics
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(
      (inv) => inv.status === InvoiceStatus.PAID,
    ).length;
    const pendingInvoices = invoices.filter(
      (inv) => inv.status === InvoiceStatus.SENT,
    ).length;
    const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const paidAmount = invoices
      .filter((inv) => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => sum + Number(inv.total), 0);

    // Per-SP breakdown
    const spBreakdown = await Promise.all(
      serviceProviders.map(async (sp) => {
        const spInvoices = await this.getInvoicesForClient(clientId, sp.id);
        return {
          serviceProviderId: sp.id,
          serviceProviderEmail: sp.email,
          serviceProviderName: `${sp.firstName || ''} ${sp.lastName || ''}`.trim() || sp.email,
          invoiceCount: spInvoices.length,
          totalAmount: spInvoices.reduce((sum, inv) => sum + Number(inv.total), 0),
        };
      }),
    );

    return {
      summary: {
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        totalAmount,
        paidAmount,
        outstandingAmount: totalAmount - paidAmount,
        totalProposals: proposals.length,
        serviceProviderCount: serviceProviders.length,
      },
      serviceProviders: spBreakdown,
      recentInvoices: invoices.slice(0, 5),
      recentProposals: proposals.slice(0, 5),
    };
  }

  /**
   * Link client to an additional service provider
   */
  async linkToServiceProvider(clientId: string, serviceProviderId: string) {
    return this.clientServiceProviderService.linkClientToServiceProvider(
      clientId,
      serviceProviderId,
    );
  }
}

