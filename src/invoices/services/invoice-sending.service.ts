import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceAccessService } from './invoice-access.service';
import { EmailService } from '../../email/email.service';
import { InvoiceStatus } from '../entities/invoice.entity';
import { getInvoiceSentEmailTemplate } from '../../email/templates/invoice-sent.template';
import { TimelineService } from '../../timeline/services/timeline.service';
import { TimelineEventType } from '../../timeline/enums/timeline-event-type.enum';
import { RelatedEntityType } from '../../timeline/enums/related-entity-type.enum';
import { formatInvoiceSentEvent } from '../../timeline/utils/event-formatter.util';
import { NotificationService } from '../../notifications/services/notification.service';

@Injectable()
export class InvoiceSendingService {
  private readonly logger = new Logger(InvoiceSendingService.name);

  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    private invoiceAccessService: InvoiceAccessService,
    private emailService: EmailService,
    private configService: ConfigService,
    private timelineService: TimelineService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Sends an invoice via email
   * Generates access token if not exists and includes sp_id in link
   */
  async sendInvoice(invoice: Invoice, recipientEmail: string): Promise<void> {
    try {
      // Ensure invoice has access token
      const token = await this.invoiceAccessService.ensureAccessToken(invoice);

      // Build invoice link with sp_id
      const frontendUrl =
        this.configService.get<string>('frontend.url') ||
        'http://localhost:3000';
      const invoiceLink = `${frontendUrl}/invoices?sp_id=${invoice.userId}&token=${token}`;

      // Get invoice items for email template
      const items = invoice.items?.map((item: any) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      }));

      // Generate email content using template
      const { subject, html, text } = getInvoiceSentEmailTemplate(
        invoice.invoiceNumber,
        invoice.client?.name || 'Client',
        invoiceLink,
        Number(invoice.total),
        Number(invoice.amountDue),
        invoice.dueDate || undefined,
        items,
        Number(invoice.taxAmount) || undefined,
        invoice.user?.email || undefined,
      );

      // Send email
      await this.emailService.sendEmail(recipientEmail, subject, html, text);

      // Update invoice status and sentAt
      invoice.status = InvoiceStatus.SENT;
      invoice.sentAt = new Date();
      await this.invoicesRepository.save(invoice);

      // Create timeline event
      const { title, description } = formatInvoiceSentEvent(invoice);
      await this.timelineService.createEvent(
        invoice.clientId,
        invoice.userId,
        TimelineEventType.INVOICE_SENT,
        title,
        description,
        {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: Number(invoice.total),
          recipientEmail,
        },
        RelatedEntityType.INVOICE,
        invoice.id,
      );

      // Track notification
      await this.notificationService.sendInvoiceNotification(
        invoice,
        recipientEmail,
        invoice.userId,
        invoice.agencyId,
      );

      this.logger.log(
        `Invoice ${invoice.id} sent via email to ${recipientEmail}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send invoice ${invoice.id} via email:`, error);
      throw error;
    }
  }

}

