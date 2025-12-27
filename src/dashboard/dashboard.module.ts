import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Payment } from '../payments/entities/payment.entity';
import { TimelineEvent } from '../timeline/entities/timeline-event.entity';
import { Proposal } from '../proposals/entities/proposal.entity';
import { Client } from '../clients/entities/client.entity';
import { User } from '../users/entities/user.entity';
import { AgencyMembership } from '../agencies/entities/agency-membership.entity';
import { DashboardService } from './services/dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      Payment,
      TimelineEvent,
      Proposal,
      Client,
      User,
      AgencyMembership,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

