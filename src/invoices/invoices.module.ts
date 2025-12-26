import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceAccessService } from './services/invoice-access.service';
import { InvoiceSendingService } from './services/invoice-sending.service';
import { InvoicesController } from './invoices.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice]),
    EmailModule.forRoot(),
  ],
  controllers: [InvoicesController],
  providers: [InvoiceAccessService, InvoiceSendingService],
  exports: [InvoiceAccessService, InvoiceSendingService],
})
export class InvoicesModule {}

