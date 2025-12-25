import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proposal } from './entities/proposal.entity';
import { ProposalItem } from './entities/proposal-item.entity';
import { Client } from '../clients/entities/client.entity';
import { ProposalsService } from './proposals.service';
import { ProposalItemsService } from './proposal-items.service';
import { ProposalsController } from './proposals.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Proposal, ProposalItem, Client]),
  ],
  controllers: [ProposalsController],
  providers: [ProposalsService, ProposalItemsService],
  exports: [ProposalsService],
})
export class ProposalsModule {}