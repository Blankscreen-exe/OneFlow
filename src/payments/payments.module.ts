import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { Agency } from '../agencies/entities/agency.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { PaymentsController } from './payments.controller';
import { StripeService } from './services/stripe.service';
import { StripeConnectService } from './services/stripe-connect.service';
import { PaymentService } from './services/payment.service';
import { StripeWebhookService } from './services/stripe-webhook.service';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, User, Agency, Invoice]),
    InvoicesModule,
  ],
  controllers: [PaymentsController],
  providers: [
    StripeService,
    StripeConnectService,
    PaymentService,
    StripeWebhookService,
  ],
  exports: [StripeService, PaymentService],
})
export class PaymentsModule {}



