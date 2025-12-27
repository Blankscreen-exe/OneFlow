import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceAccessService } from './invoice-access.service';
import { EmailService } from '../../email/email.service';
import { InvoiceStatus } from '../entities/invoice.entity';
import { TimelineService } from '../../timeline/services/timeline.service';
import { TimelineEventType } from '../../timeline/enums/timeline-event-type.enum';
import { RelatedEntityType } from '../../timeline/enums/related-entity-type.enum';
import { formatInvoiceSentEvent } from '../../timeline/utils/event-formatter.util';

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

      // Generate email content
      const subject = `Invoice ${invoice.invoiceNumber} from ${invoice.user?.email || 'Service Provider'}`;
      const html = this.generateInvoiceEmailTemplate(
        invoice,
        invoiceLink,
        items,
      );
      const text = this.generateInvoiceEmailText(invoice, invoiceLink);

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

      this.logger.log(
        `Invoice ${invoice.id} sent via email to ${recipientEmail}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send invoice ${invoice.id} via email:`, error);
      throw error;
    }
  }

  /**
   * Generates HTML email template for invoice
   */
  private generateInvoiceEmailTemplate(
    invoice: Invoice,
    invoiceLink: string,
    items?: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>,
  ): string {
    const itemsHtml =
      items && items.length > 0
        ? `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Description</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Quantity</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Unit Price</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) => `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">${item.description}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${item.quantity}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${item.unitPrice.toFixed(2)}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${item.total.toFixed(2)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
      ${invoice.taxAmount > 0 ? `<p><strong>Tax:</strong> $${Number(invoice.taxAmount).toFixed(2)}</p>` : ''}
      <p style="font-size: 18px; font-weight: bold;"><strong>Total:</strong> $${Number(invoice.total).toFixed(2)}</p>
    `
        : '';

    const dueDateHtml = invoice.dueDate
      ? `<p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>`
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .button:hover { background-color: #0056b3; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Invoice ${invoice.invoiceNumber}</h1>
          <p>Dear ${invoice.client?.name || 'Client'},</p>
          <p>Please find your invoice details below.</p>
          ${itemsHtml}
          ${dueDateHtml}
          <p>To view and pay this invoice, please click the button below:</p>
          <a href="${invoiceLink}" class="button">View & Pay Invoice</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${invoiceLink}</p>
          <p>You can also create an account to view your invoice history and manage payments.</p>
          <p>Thank you for your business.</p>
          <p>Best regards,<br>${invoice.user?.email || 'Service Provider'}</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generates plain text email for invoice
   */
  private generateInvoiceEmailText(invoice: Invoice, invoiceLink: string): string {
    return `
Invoice ${invoice.invoiceNumber}

Dear ${invoice.client?.name || 'Client'},

Please find your invoice details below.

Total: $${Number(invoice.total).toFixed(2)}
${invoice.dueDate ? `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}` : ''}

To view and pay this invoice, please visit:
${invoiceLink}

You can also create an account to view your invoice history and manage payments.

Thank you for your business.

Best regards,
${invoice.user?.email || 'Service Provider'}
    `.trim();
  }
}

