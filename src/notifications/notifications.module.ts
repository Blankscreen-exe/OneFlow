import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { Agency } from '../agencies/entities/agency.entity';
import { Client } from '../clients/entities/client.entity';
import { NotificationService } from './services/notification.service';
import { NotificationsController } from './notifications.controller';
import { OverdueReminderScheduler } from './scheduled/overdue-reminder.scheduler';
import { EmailModule } from '../email/email.module';
import { Invoice } from '../invoices/entities/invoice.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User, Agency, Client, Invoice]),
    EmailModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationService, OverdueReminderScheduler],
  exports: [NotificationService],
})
export class NotificationsModule {}

