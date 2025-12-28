import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proposal } from './entities/proposal.entity';
import { ProposalItem } from './entities/proposal-item.entity';
import { ProposalContactMethod } from './entities/proposal-contact-method.entity';
import { Client } from '../clients/entities/client.entity';
import { ClientContact } from '../client-contacts/entities/client-contact.entity';
import { EmailModule } from '../email/email.module';
import { AIModule } from '../ai/ai.module';
import { TimelineModule } from '../timeline/timeline.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProposalsService } from './proposals.service';
import { ProposalItemsService } from './proposal-items.service';
import { ProposalSendingService } from './services/proposal-sending.service';
import { ProposalEmailService } from './services/proposal-email.service';
import { ProposalPlatformService } from './services/proposal-platform.service';
import { ProposalAcceptanceService } from './services/proposal-acceptance.service';
import { AIProposalService } from './services/ai-proposal.service';
import { ProposalsController } from './proposals.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Proposal,
      ProposalItem,
      ProposalContactMethod,
      Client,
      ClientContact,
    ]),
    EmailModule.forRoot(),
    AIModule.forRoot(),
    TimelineModule,
    NotificationsModule,
  ],
  controllers: [ProposalsController],
  providers: [
    ProposalsService,
    ProposalItemsService,
    ProposalSendingService,
    ProposalEmailService,
    ProposalPlatformService,
    ProposalAcceptanceService,
    AIProposalService,
  ],
  exports: [ProposalsService],
})
export class ProposalsModule {}