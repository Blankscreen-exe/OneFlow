import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proposal } from './entities/proposal.entity';
import { ProposalItem } from './entities/proposal-item.entity';
import { ProposalContactMethod } from './entities/proposal-contact-method.entity';
import { Client } from '../clients/entities/client.entity';
import { ClientContact } from '../client-contacts/entities/client-contact.entity';
import { ProposalsService } from './proposals.service';
import { ProposalItemsService } from './proposal-items.service';
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
  ],
  controllers: [ProposalsController],
  providers: [ProposalsService, ProposalItemsService],
  exports: [ProposalsService],
})
export class ProposalsModule {}