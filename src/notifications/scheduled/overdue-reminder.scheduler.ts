import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Invoice, InvoiceStatus } from '../../invoices/entities/invoice.entity';
import { User } from '../../users/entities/user.entity';
import { Agency } from '../../agencies/entities/agency.entity';
import { NotificationService } from '../services/notification.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OverdueReminderScheduler {
  private readonly logger = new Logger(OverdueReminderScheduler.name);

  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Agency)
    private agenciesRepository: Repository<Agency>,
    private notificationService: NotificationService,
    private configService: ConfigService,
  ) {}

  /**
   * Run daily at configured time (default: 9 AM)
   * Process overdue invoices and send reminders based on user/agency preferences
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleOverdueReminders() {
    this.logger.log('Starting overdue invoice reminder job...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all users and agencies to process their invoices
      const users = await this.usersRepository.find({
        where: {},
        select: ['id', 'agencyId', 'emailPreferences'],
      });

      const agencies = await this.agenciesRepository.find({
        select: ['id', 'emailPreferences'],
      });

      let processedCount = 0;
      let reminderCount = 0;

      // Process individual users (not in agencies)
      for (const user of users) {
        if (user.agencyId) {
          continue; // Skip users in agencies, they'll be processed with agency
        }

        const reminderDays = await this.notificationService.getOverdueReminderDays(
          user.id,
        );

        for (const reminderDay of reminderDays) {
          const thresholdDate = new Date(today);
          thresholdDate.setDate(thresholdDate.getDate() - reminderDay);

          // Find invoices that are overdue by exactly this many days
          const overdueInvoices = await this.invoicesRepository.find({
            where: {
              userId: user.id,
              status: InvoiceStatus.SENT,
              dueDate: LessThan(thresholdDate),
            },
            relations: ['client', 'user'],
          });

          for (const invoice of overdueInvoices) {
            // Calculate days overdue
            const dueDate = invoice.dueDate
              ? new Date(invoice.dueDate)
              : invoice.createdAt;
            const daysOverdue = Math.floor(
              (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
            );

            // Only send reminder if it matches the reminder day exactly
            if (daysOverdue === reminderDay && Number(invoice.amountDue) > 0) {
              const clientEmail = invoice.client?.email;
              if (!clientEmail) {
                this.logger.warn(
                  `Invoice ${invoice.id} has no client email, skipping reminder`,
                );
                continue;
              }

              try {
                await this.notificationService.sendOverdueReminder(
                  invoice,
                  clientEmail,
                  daysOverdue,
                  user.id,
                );
                reminderCount++;
                this.logger.log(
                  `Sent overdue reminder for invoice ${invoice.invoiceNumber} (${daysOverdue} days overdue)`,
                );
              } catch (error) {
                this.logger.error(
                  `Failed to send reminder for invoice ${invoice.id}:`,
                  error,
                );
              }
            }
          }

          processedCount += overdueInvoices.length;
        }
      }

      // Process agencies
      for (const agency of agencies) {
        const reminderDays = await this.notificationService.getOverdueReminderDays(
          undefined,
          agency.id,
        );

        for (const reminderDay of reminderDays) {
          const thresholdDate = new Date(today);
          thresholdDate.setDate(thresholdDate.getDate() - reminderDay);

          // Find invoices for this agency
          const overdueInvoices = await this.invoicesRepository.find({
            where: {
              agencyId: agency.id,
              status: InvoiceStatus.SENT,
              dueDate: LessThan(thresholdDate),
            },
            relations: ['client', 'user'],
          });

          for (const invoice of overdueInvoices) {
            // Calculate days overdue
            const dueDate = invoice.dueDate
              ? new Date(invoice.dueDate)
              : invoice.createdAt;
            const daysOverdue = Math.floor(
              (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
            );

            // Only send reminder if it matches the reminder day exactly
            if (daysOverdue === reminderDay && Number(invoice.amountDue) > 0) {
              const clientEmail = invoice.client?.email;
              if (!clientEmail) {
                this.logger.warn(
                  `Invoice ${invoice.id} has no client email, skipping reminder`,
                );
                continue;
              }

              try {
                await this.notificationService.sendOverdueReminder(
                  invoice,
                  clientEmail,
                  daysOverdue,
                  invoice.userId,
                  agency.id,
                );
                reminderCount++;
                this.logger.log(
                  `Sent overdue reminder for invoice ${invoice.invoiceNumber} (${daysOverdue} days overdue)`,
                );
              } catch (error) {
                this.logger.error(
                  `Failed to send reminder for invoice ${invoice.id}:`,
                  error,
                );
              }
            }
          }

          processedCount += overdueInvoices.length;
        }
      }

      this.logger.log(
        `Overdue reminder job completed. Processed ${processedCount} invoices, sent ${reminderCount} reminders.`,
      );
    } catch (error) {
      this.logger.error('Error in overdue reminder job:', error);
      // Don't throw - we want the job to continue running even if there's an error
    }
  }
}

