import { ApiProperty } from '@nestjs/swagger';
import { TimelineEventType } from '../../timeline/enums/timeline-event-type.enum';
import { RelatedEntityType } from '../../timeline/enums/related-entity-type.enum';
import { InvoiceStatus } from '../../invoices/entities/invoice.entity';
import { PaymentStatus } from '../../payments/enums/payment-status.enum';

export class DashboardStatisticsDto {
  @ApiProperty({ description: 'Number of outstanding invoices', example: 5 })
  outstandingInvoicesCount: number;

  @ApiProperty({ description: 'Number of paid invoices', example: 12 })
  paidInvoicesCount: number;

  @ApiProperty({ description: 'Number of draft invoices', example: 3 })
  draftInvoicesCount: number;

  @ApiProperty({ description: 'Total number of invoices', example: 20 })
  totalInvoicesCount: number;

  @ApiProperty({ description: 'Total revenue from succeeded payments', example: 15000.50 })
  totalRevenue: number;

  @ApiProperty({ description: 'Pending revenue from outstanding invoices', example: 5000.00 })
  pendingRevenue: number;

  @ApiProperty({ description: 'Total number of clients', example: 25 })
  totalClients: number;

  @ApiProperty({ description: 'Total number of proposals', example: 30 })
  totalProposals: number;

  @ApiProperty({ description: 'Number of active (sent) proposals', example: 8 })
  activeProposals: number;
}

export class OutstandingInvoiceDto {
  @ApiProperty({ description: 'Invoice ID' })
  id: string;

  @ApiProperty({ description: 'Invoice number', example: 'INV-2025-001' })
  invoiceNumber: string;

  @ApiProperty({ description: 'Client name', example: 'John Doe' })
  clientName: string;

  @ApiProperty({ description: 'Client ID' })
  clientId: string;

  @ApiProperty({ description: 'Invoice total amount', example: 1000.00 })
  total: number;

  @ApiProperty({ description: 'Amount due', example: 1000.00 })
  amountDue: number;

  @ApiProperty({ description: 'Due date', nullable: true })
  dueDate: Date | null;

  @ApiProperty({ description: 'When invoice was sent', nullable: true })
  sentAt: Date | null;

  @ApiProperty({ description: 'When invoice was created' })
  createdAt: Date;
}

export class RecentActivityDto {
  @ApiProperty({ description: 'Event ID' })
  id: string;

  @ApiProperty({ enum: TimelineEventType, description: 'Event type' })
  type: TimelineEventType;

  @ApiProperty({ description: 'Event title' })
  title: string;

  @ApiProperty({ description: 'Event description', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Client ID' })
  clientId: string;

  @ApiProperty({ description: 'Client name' })
  clientName: string;

  @ApiProperty({ description: 'When event was created' })
  createdAt: Date;

  @ApiProperty({ enum: RelatedEntityType, description: 'Related entity type', nullable: true })
  relatedEntityType: RelatedEntityType | null;

  @ApiProperty({ description: 'Related entity ID', nullable: true })
  relatedEntityId: string | null;
}

export class RecentInvoiceDto {
  @ApiProperty({ description: 'Invoice ID' })
  id: string;

  @ApiProperty({ description: 'Invoice number', example: 'INV-2025-001' })
  invoiceNumber: string;

  @ApiProperty({ description: 'Client name' })
  clientName: string;

  @ApiProperty({ enum: InvoiceStatus, description: 'Invoice status' })
  status: InvoiceStatus;

  @ApiProperty({ description: 'Invoice total', example: 1000.00 })
  total: number;

  @ApiProperty({ description: 'Amount due', example: 1000.00 })
  amountDue: number;

  @ApiProperty({ description: 'When invoice was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When invoice was sent', nullable: true })
  sentAt: Date | null;
}

export class RecentPaymentDto {
  @ApiProperty({ description: 'Payment ID' })
  id: string;

  @ApiProperty({ description: 'Invoice ID' })
  invoiceId: string;

  @ApiProperty({ description: 'Invoice number', example: 'INV-2025-001' })
  invoiceNumber: string;

  @ApiProperty({ description: 'Client name' })
  clientName: string;

  @ApiProperty({ description: 'Payment amount', example: 1000.00 })
  amount: number;

  @ApiProperty({ description: 'Platform fee', example: 100.00 })
  platformFee: number;

  @ApiProperty({ enum: PaymentStatus, description: 'Payment status' })
  status: PaymentStatus;

  @ApiProperty({ description: 'When payment was created' })
  createdAt: Date;
}

export class DashboardResponseDto {
  @ApiProperty({ type: DashboardStatisticsDto, description: 'Dashboard statistics' })
  statistics: DashboardStatisticsDto;

  @ApiProperty({ type: [OutstandingInvoiceDto], description: 'Outstanding invoices' })
  outstandingInvoices: OutstandingInvoiceDto[];

  @ApiProperty({ type: [RecentActivityDto], description: 'Recent activity across all clients' })
  recentActivity: RecentActivityDto[];

  @ApiProperty({ type: [RecentInvoiceDto], description: 'Recent invoices' })
  recentInvoices: RecentInvoiceDto[];

  @ApiProperty({ type: [RecentPaymentDto], description: 'Recent payments' })
  recentPayments: RecentPaymentDto[];
}

