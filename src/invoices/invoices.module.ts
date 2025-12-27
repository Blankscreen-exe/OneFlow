import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { Proposal } from '../proposals/entities/proposal.entity';
import { ProposalItem } from '../proposals/entities/proposal-item.entity';
import { InvoiceAccessService } from './services/invoice-access.service';
import { InvoiceSendingService } from './services/invoice-sending.service';
import { InvoiceNumberService } from './services/invoice-number.service';
import { InvoicesService } from './services/invoices.service';
import { InvoicesController } from './invoices.controller';
import { EmailModule } from '../email/email.module';
import { TimelineModule } from '../timeline/timeline.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      InvoiceItem,
      Proposal,
      ProposalItem,
    ]),
    EmailModule.forRoot(),
    TimelineModule,
  ],
  controllers: [InvoicesController],
  providers: [
    InvoiceAccessService,
    InvoiceSendingService,
    InvoiceNumberService,
    InvoicesService,
  ],
  exports: [
    InvoiceAccessService,
    InvoiceSendingService,
    InvoicesService,
  ],
})
export class InvoicesModule {}

