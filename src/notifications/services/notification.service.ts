import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { RelatedEntityType } from '../../timeline/enums/related-entity-type.enum';
import { EmailService } from '../../email/email.service';
import { getPaymentConfirmationEmailTemplate } from '../../email/templates/payment-confirmation.template';
import { getOverdueInvoiceReminderTemplate } from '../../email/templates/overdue-invoice-reminder.template';
import { User } from '../../users/entities/user.entity';
import { Agency } from '../../agencies/entities/agency.entity';
import { Client } from '../../clients/entities/client.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Proposal } from '../../proposals/entities/proposal.entity';
import { ConfigService } from '@nestjs/config';

export interface EmailPreferences {
  paymentConfirmationEnabled?: boolean;
  invoiceRemindersEnabled?: boolean;
  overdueReminderDays?: number[];
}

export interface NotificationQueryFilters {
  page?: number;
  limit?: number;
  type?: NotificationType;
  dateFrom?: string;
  dateTo?: string;
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: string;
  recipientEmail?: string;
}

export interface PaginatedNotifications {
  data: Notification[];
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
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Agency)
    private agenciesRepository: Repository<Agency>,
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  /**
   * Get default email preferences
   */
  private getDefaultEmailPreferences(): EmailPreferences {
    return {
      paymentConfirmationEnabled: true,
      invoiceRemindersEnabled: true,
      overdueReminderDays: [7],
    };
  }

  /**
   * Get email preferences for user or agency
   */
  async getEmailPreferences(
    userId?: string,
    agencyId?: string,
  ): Promise<EmailPreferences> {
    if (agencyId) {
      const agency = await this.agenciesRepository.findOne({
        where: { id: agencyId },
      });
      if (agency?.emailPreferences) {
        return { ...this.getDefaultEmailPreferences(), ...agency.emailPreferences };
      }
    }

    if (userId) {
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (user?.emailPreferences) {
        return { ...this.getDefaultEmailPreferences(), ...user.emailPreferences };
      }
    }

    return this.getDefaultEmailPreferences();
  }

  /**
   * Check if payment confirmation is enabled
   */
  async isPaymentConfirmationEnabled(
    clientId: string,
    userId?: string,
    agencyId?: string,
  ): Promise<boolean> {
    // Check client preferences first
    const client = await this.clientsRepository.findOne({ where: { id: clientId } });
    if (client?.emailPreferences?.paymentConfirmationEnabled === false) {
      return false;
    }

    // Check user/agency preferences
    const preferences = await this.getEmailPreferences(userId, agencyId);
    return preferences.paymentConfirmationEnabled !== false;
  }

  /**
   * Check if invoice reminders are enabled
   */
  async isInvoiceRemindersEnabled(
    userId?: string,
    agencyId?: string,
  ): Promise<boolean> {
    const preferences = await this.getEmailPreferences(userId, agencyId);
    return preferences.invoiceRemindersEnabled !== false;
  }

  /**
   * Get overdue reminder days for user/agency
   */
  async getOverdueReminderDays(
    userId?: string,
    agencyId?: string,
  ): Promise<number[]> {
    const preferences = await this.getEmailPreferences(userId, agencyId);
    return preferences.overdueReminderDays || [7];
  }

  /**
   * Track proposal sent notification
   */
  async sendProposalNotification(
    proposal: Proposal,
    recipientEmail: string,
    userId?: string,
    agencyId?: string,
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      type: NotificationType.PROPOSAL_SENT,
      recipientEmail,
      relatedEntityType: RelatedEntityType.PROPOSAL,
      relatedEntityId: proposal.id,
      userId,
      agencyId,
      metadata: {
        proposalId: proposal.id,
        proposalTitle: proposal.title,
        proposalNumber: proposal.id,
      },
    });

    return this.notificationsRepository.save(notification);
  }

  /**
   * Track invoice sent notification
   */
  async sendInvoiceNotification(
    invoice: Invoice,
    recipientEmail: string,
    userId?: string,
    agencyId?: string,
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      type: NotificationType.INVOICE_SENT,
      recipientEmail,
      relatedEntityType: RelatedEntityType.INVOICE,
      relatedEntityId: invoice.id,
      userId,
      agencyId,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: Number(invoice.total),
      },
    });

    return this.notificationsRepository.save(notification);
  }

  /**
   * Send and track payment confirmation email
   */
  async sendPaymentConfirmation(
    payment: Payment,
    invoice: Invoice,
    recipientEmail: string,
    userId?: string,
    agencyId?: string,
  ): Promise<Notification | null> {
    // Check if payment confirmation is enabled
    const isEnabled = await this.isPaymentConfirmationEnabled(
      invoice.clientId,
      userId,
      agencyId,
    );

    if (!isEnabled) {
      this.logger.log(
        `Payment confirmation disabled for client ${invoice.clientId}, skipping email`,
      );
      return null;
    }

    // Get service provider info
    const serviceProvider = invoice.user
      ? invoice.user
      : userId
        ? await this.usersRepository.findOne({ where: { id: userId } })
        : null;

    const serviceProviderEmail =
      serviceProvider?.email || this.configService.get<string>('email.from') || 'noreply@oneflow.com';
    const serviceProviderName = serviceProvider
      ? `${serviceProvider.firstName || ''} ${serviceProvider.lastName || ''}`.trim() || serviceProvider.email
      : undefined;

    // Generate email template
    const { subject, html, text } = getPaymentConfirmationEmailTemplate(
      Number(payment.amount),
      invoice.invoiceNumber,
      Number(invoice.total),
      payment.createdAt,
      serviceProviderEmail,
      serviceProviderName,
      payment.paymentMethod || undefined,
    );

    // Send email
    await this.emailService.sendEmail(recipientEmail, subject, html, text);

    // Track notification
    const notification = this.notificationsRepository.create({
      type: NotificationType.PAYMENT_CONFIRMATION,
      recipientEmail,
      relatedEntityType: RelatedEntityType.PAYMENT,
      relatedEntityId: payment.id,
      userId,
      agencyId,
      metadata: {
        paymentId: payment.id,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: Number(payment.amount),
      },
    });

    return this.notificationsRepository.save(notification);
  }

  /**
   * Send and track overdue reminder email
   */
  async sendOverdueReminder(
    invoice: Invoice,
    recipientEmail: string,
    daysOverdue: number,
    userId?: string,
    agencyId?: string,
  ): Promise<Notification | null> {
    // Check if invoice reminders are enabled
    const isEnabled = await this.isInvoiceRemindersEnabled(userId, agencyId);

    if (!isEnabled) {
      this.logger.log(
        `Invoice reminders disabled for user ${userId || agencyId}, skipping reminder`,
      );
      return null;
    }

    // Check if reminder already sent for this specific reminder day
    const reminderDays = await this.getOverdueReminderDays(userId, agencyId);
    if (!reminderDays.includes(daysOverdue)) {
      this.logger.log(
        `Days overdue (${daysOverdue}) not in reminder schedule, skipping`,
      );
      return null;
    }

    const hasSent = await this.hasSentOverdueReminder(
      invoice.id,
      daysOverdue,
      recipientEmail,
    );

    if (hasSent) {
      this.logger.log(
        `Overdue reminder already sent for invoice ${invoice.id} at ${daysOverdue} days`,
      );
      return null;
    }

    // Get service provider info
    const serviceProvider = invoice.user
      ? invoice.user
      : userId
        ? await this.usersRepository.findOne({ where: { id: userId } })
        : null;

    const serviceProviderEmail =
      serviceProvider?.email || this.configService.get<string>('email.from') || 'noreply@oneflow.com';
    const serviceProviderName = serviceProvider
      ? `${serviceProvider.firstName || ''} ${serviceProvider.lastName || ''}`.trim() || serviceProvider.email
      : undefined;

    // Build payment link
    const frontendUrl =
      this.configService.get<string>('frontend.url') || 'http://localhost:3000';
    const paymentLink = invoice.stripePaymentLinkId
      ? invoice.stripePaymentLinkId
      : `${frontendUrl}/invoices?sp_id=${invoice.userId}&token=${invoice.accessToken || ''}`;

    // Generate email template
    const { subject, html, text } = getOverdueInvoiceReminderTemplate(
      invoice.invoiceNumber,
      Number(invoice.total),
      Number(invoice.amountDue),
      invoice.dueDate || invoice.createdAt,
      daysOverdue,
      paymentLink,
      serviceProviderEmail,
      serviceProviderName,
      invoice.client?.name || undefined,
    );

    // Send email
    await this.emailService.sendEmail(recipientEmail, subject, html, text);

    // Track notification
    const notification = this.notificationsRepository.create({
      type: NotificationType.OVERDUE_REMINDER,
      recipientEmail,
      relatedEntityType: RelatedEntityType.INVOICE,
      relatedEntityId: invoice.id,
      userId,
      agencyId,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        daysOverdue,
        amountDue: Number(invoice.amountDue),
      },
    });

    return this.notificationsRepository.save(notification);
  }

  /**
   * Check if notification already sent
   */
  async hasSentNotification(
    type: NotificationType,
    relatedEntityId: string,
    recipientEmail: string,
    withinDays?: number,
  ): Promise<boolean> {
    const queryBuilder = this.notificationsRepository
      .createQueryBuilder('notification')
      .where('notification.type = :type', { type })
      .andWhere('notification.relatedEntityId = :relatedEntityId', {
        relatedEntityId,
      })
      .andWhere('notification.recipientEmail = :recipientEmail', {
        recipientEmail,
      });

    if (withinDays) {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - withinDays);
      queryBuilder.andWhere('notification.sentAt >= :dateThreshold', {
        dateThreshold,
      });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  /**
   * Check if overdue reminder already sent for specific reminder day
   */
  async hasSentOverdueReminder(
    invoiceId: string,
    reminderDays: number,
    recipientEmail: string,
  ): Promise<boolean> {
    const notification = await this.notificationsRepository.findOne({
      where: {
        type: NotificationType.OVERDUE_REMINDER,
        relatedEntityId: invoiceId,
        recipientEmail,
      },
      order: { sentAt: 'DESC' },
    });

    if (!notification) {
      return false;
    }

    // Check if metadata contains the same reminder days
    const metadataDaysOverdue = notification.metadata?.daysOverdue;
    return metadataDaysOverdue === reminderDays;
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(
    userId?: string,
    agencyId?: string,
    filters?: NotificationQueryFilters,
  ): Promise<PaginatedNotifications> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.notificationsRepository.createQueryBuilder(
      'notification',
    );

    // Filter by user or agency
    if (agencyId) {
      queryBuilder.where('notification.agencyId = :agencyId', { agencyId });
    } else if (userId) {
      queryBuilder.where('notification.userId = :userId', { userId });
    } else {
      // Return empty if no user/agency provided
      return {
        data: [],
        meta: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    // Apply filters
    if (filters?.type) {
      queryBuilder.andWhere('notification.type = :type', { type: filters.type });
    }

    if (filters?.relatedEntityType) {
      queryBuilder.andWhere('notification.relatedEntityType = :relatedEntityType', {
        relatedEntityType: filters.relatedEntityType,
      });
    }

    if (filters?.relatedEntityId) {
      queryBuilder.andWhere('notification.relatedEntityId = :relatedEntityId', {
        relatedEntityId: filters.relatedEntityId,
      });
    }

    if (filters?.recipientEmail) {
      queryBuilder.andWhere('notification.recipientEmail = :recipientEmail', {
        recipientEmail: filters.recipientEmail,
      });
    }

    if (filters?.dateFrom && filters?.dateTo) {
      queryBuilder.andWhere('notification.sentAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: new Date(filters.dateFrom),
        dateTo: new Date(filters.dateTo),
      });
    } else if (filters?.dateFrom) {
      queryBuilder.andWhere('notification.sentAt >= :dateFrom', {
        dateFrom: new Date(filters.dateFrom),
      });
    } else if (filters?.dateTo) {
      queryBuilder.andWhere('notification.sentAt <= :dateTo', {
        dateTo: new Date(filters.dateTo),
      });
    }

    // Order by sentAt descending
    queryBuilder.orderBy('notification.sentAt', 'DESC');

    // Get paginated results
    const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

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
   * Update email preferences
   */
  async updateEmailPreferences(
    preferences: Partial<EmailPreferences>,
    userId?: string,
    agencyId?: string,
  ): Promise<EmailPreferences> {
    if (agencyId) {
      const agency = await this.agenciesRepository.findOne({
        where: { id: agencyId },
      });
      if (!agency) {
        throw new Error('Agency not found');
      }

      const currentPreferences = agency.emailPreferences || {};
      const updatedPreferences = {
        ...this.getDefaultEmailPreferences(),
        ...currentPreferences,
        ...preferences,
      };

      await this.agenciesRepository.update(agencyId, {
        emailPreferences: updatedPreferences,
      });

      return updatedPreferences;
    }

    if (userId) {
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const currentPreferences = user.emailPreferences || {};
      const updatedPreferences = {
        ...this.getDefaultEmailPreferences(),
        ...currentPreferences,
        ...preferences,
      };

      await this.usersRepository.update(userId, {
        emailPreferences: updatedPreferences,
      });

      return updatedPreferences;
    }

    throw new Error('Either userId or agencyId must be provided');
  }
}

