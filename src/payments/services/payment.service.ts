import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { PaymentStatus } from '../enums/payment-status.enum';
import { Invoice, InvoiceStatus } from '../../invoices/entities/invoice.entity';
import { User } from '../../users/entities/user.entity';
import { Agency } from '../../agencies/entities/agency.entity';
import { PaymentProviderFactory } from './payment-provider.factory';
import { PaymentProviderType } from '../enums/payment-provider.enum';
import { PaymentProvider } from '../interfaces/payment-provider.interface';
import { TimelineService } from '../../timeline/services/timeline.service';
import { TimelineEventType } from '../../timeline/enums/timeline-event-type.enum';
import { RelatedEntityType } from '../../timeline/enums/related-entity-type.enum';
import { formatPaymentReceivedEvent } from '../../timeline/utils/event-formatter.util';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Agency)
    private agenciesRepository: Repository<Agency>,
    private providerFactory: PaymentProviderFactory,
    private timelineService: TimelineService,
  ) {}

  /**
   * Record a payment with platform fee
   * Supports both new generic fields and legacy Stripe fields for backward compatibility
   */
  async recordPayment(
    invoiceId: string,
    providerPaymentId: string,
    providerAccountId: string,
    amount: number,
    platformFee: number,
    platformFeeRate: number,
    status: PaymentStatus,
    paymentProvider: PaymentProviderType = PaymentProviderType.STRIPE,
    providerChargeId?: string,
    metadata?: Record<string, any>,
  ): Promise<Payment> {
    // Check if payment already exists (idempotency) - check both generic and Stripe fields
    const existingPayment = await this.paymentsRepository.findOne({
      where: [
        { providerPaymentId },
        { stripePaymentIntentId: providerPaymentId }, // Backward compatibility
      ],
    });

    if (existingPayment) {
      return existingPayment;
    }

    const payment = this.paymentsRepository.create({
      invoiceId,
      paymentProvider,
      providerPaymentId,
      providerAccountId,
      providerChargeId,
      amount,
      platformFee,
      platformFeeRate,
      status,
      metadata,
      // For backward compatibility, also set Stripe fields if provider is Stripe
      ...(paymentProvider === PaymentProviderType.STRIPE && {
        stripePaymentIntentId: providerPaymentId,
        stripeAccountId: providerAccountId,
        stripeChargeId: providerChargeId,
      }),
    });

    const savedPayment = await this.paymentsRepository.save(payment);

    // Update invoice amounts
    await this.calculateInvoiceAmounts(invoiceId);

    return savedPayment;
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    metadata?: Record<string, any>,
  ): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    payment.status = status;
    if (metadata) {
      payment.metadata = { ...payment.metadata, ...metadata };
    }

    const updatedPayment = await this.paymentsRepository.save(payment);

    // Update invoice amounts
    await this.calculateInvoiceAmounts(payment.invoiceId);

    return updatedPayment;
  }

  /**
   * Handle payment succeeded event
   */
  async handlePaymentSucceeded(
    paymentIntentId: string,
    paymentProvider: PaymentProviderType = PaymentProviderType.STRIPE,
    metadata?: Record<string, any>,
  ): Promise<Payment> {
    // Get provider and payment intent
    const provider = this.providerFactory.getProvider(paymentProvider);
    const paymentIntent = await provider.getPaymentIntent(paymentIntentId);

    // Extract application fee (platform fee)
    const applicationFeeAmount = paymentIntent.applicationFeeAmount || 0;
    const amount = paymentIntent.amount;
    const platformFeeRate = metadata?.platformFeeRate
      ? parseFloat(metadata.platformFeeRate)
      : 0;

    // Find or create payment record - check both generic and Stripe fields
    let payment = await this.paymentsRepository.findOne({
      where: [
        { providerPaymentId: paymentIntentId },
        { stripePaymentIntentId: paymentIntentId }, // Backward compatibility
      ],
    });

    if (!payment) {
      const invoiceId = paymentIntent.metadata?.invoiceId;
      if (!invoiceId) {
        throw new BadRequestException('Invoice ID not found in payment intent metadata');
      }

      // Extract connected account ID from metadata (provider-agnostic)
      const connectedAccountId = metadata?.connectedAccountId || paymentIntent.metadata?.connectedAccountId || '';

      payment = await this.recordPayment(
        invoiceId,
        paymentIntentId,
        connectedAccountId,
        amount,
        applicationFeeAmount,
        platformFeeRate,
        PaymentStatus.SUCCEEDED,
        paymentProvider,
        paymentIntent.chargeId,
        {
          ...paymentIntent.metadata,
          chargeId: paymentIntent.chargeId,
          ...metadata,
        },
      );
    } else {
      payment.status = PaymentStatus.SUCCEEDED;
      payment.amount = amount;
      payment.platformFee = applicationFeeAmount;
      
      // Update provider-specific fields
      if (!payment.paymentProvider) {
        payment.paymentProvider = paymentProvider;
      }
      if (!payment.providerPaymentId) {
        payment.providerPaymentId = paymentIntentId;
      }
      if (paymentIntent.chargeId && !payment.providerChargeId) {
        payment.providerChargeId = paymentIntent.chargeId;
      }
      
      // Backward compatibility: update Stripe fields if provider is Stripe
      if (paymentProvider === PaymentProviderType.STRIPE) {
        payment.stripeChargeId = paymentIntent.chargeId || payment.stripeChargeId;
      }
      
      if (metadata) {
        payment.metadata = { ...payment.metadata, ...metadata };
      }
      await this.paymentsRepository.save(payment);
    }

    // Update invoice amounts and status
    await this.calculateInvoiceAmounts(payment.invoiceId);

    // Create timeline event
    const invoice = await this.invoicesRepository.findOne({
      where: { id: payment.invoiceId },
      relations: ['client'],
    });

    if (invoice) {
      const { title, description } = formatPaymentReceivedEvent(payment, invoice);
      await this.timelineService.createEvent(
        invoice.clientId,
        invoice.userId,
        TimelineEventType.PAYMENT_RECEIVED,
        title,
        description,
        {
          paymentId: payment.id,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: Number(payment.amount),
          paymentProvider: payment.paymentProvider || paymentProvider,
        },
        RelatedEntityType.PAYMENT,
        payment.id,
      );
    }

    return payment;
  }

  /**
   * Handle payment failed event
   */
  async handlePaymentFailed(
    paymentIntentId: string,
    paymentProvider: PaymentProviderType = PaymentProviderType.STRIPE,
    metadata?: Record<string, any>,
  ): Promise<Payment> {
    // Find payment - check both generic and Stripe fields
    let payment = await this.paymentsRepository.findOne({
      where: [
        { providerPaymentId: paymentIntentId },
        { stripePaymentIntentId: paymentIntentId }, // Backward compatibility
      ],
    });

    if (!payment) {
      // Try to get payment intent to extract invoice ID
      const provider = this.providerFactory.getProvider(paymentProvider);
      const paymentIntent = await provider.getPaymentIntent(paymentIntentId);
      const invoiceId = paymentIntent.metadata?.invoiceId;
      if (!invoiceId) {
        throw new BadRequestException('Invoice ID not found in payment intent metadata');
      }

      payment = this.paymentsRepository.create({
        invoiceId,
        paymentProvider,
        providerPaymentId: paymentIntentId,
        status: PaymentStatus.FAILED,
        amount: paymentIntent.amount,
        platformFee: 0,
        platformFeeRate: 0,
        metadata: {
          ...paymentIntent.metadata,
          ...metadata,
        },
        // Backward compatibility: set Stripe fields if provider is Stripe
        ...(paymentProvider === PaymentProviderType.STRIPE && {
          stripePaymentIntentId: paymentIntentId,
        }),
      });
    } else {
      payment.status = PaymentStatus.FAILED;
      if (metadata) {
        payment.metadata = { ...payment.metadata, ...metadata };
      }
    }

    return await this.paymentsRepository.save(payment);
  }

  /**
   * Process a refund
   */
  async processRefund(
    paymentId: string,
    amount?: number,
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer',
  ): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new BadRequestException('Only succeeded payments can be refunded');
    }

    if (payment.refunded) {
      throw new BadRequestException('Payment has already been refunded');
    }

    // Get provider for this payment
    const paymentProvider = payment.paymentProvider || PaymentProviderType.STRIPE;
    const provider = this.providerFactory.getProvider(paymentProvider);
    
    // Get payment intent ID (generic or Stripe fallback)
    const paymentIntentId = payment.getProviderPaymentId();
    if (!paymentIntentId) {
      throw new BadRequestException('Payment intent ID not found');
    }

    // Process refund via provider
    const refund = await provider.processRefund(
      paymentIntentId,
      amount,
      reason,
    );

    // Update payment record
    payment.refunded = true;
    payment.refundAmount = refund.amount;
    payment.status = PaymentStatus.REFUNDED;

    await this.paymentsRepository.save(payment);

    // Update invoice amounts
    await this.calculateInvoiceAmounts(payment.invoiceId);

    return payment;
  }

  /**
   * Get payments for an invoice
   */
  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    return this.paymentsRepository.find({
      where: { invoiceId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Calculate and update invoice amounts (amountPaid, amountDue)
   */
  async calculateInvoiceAmounts(invoiceId: string): Promise<void> {
    const invoice = await this.invoicesRepository.findOne({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Sum all succeeded payments minus refunds
    const payments = await this.paymentsRepository.find({
      where: {
        invoiceId,
        status: PaymentStatus.SUCCEEDED,
      },
    });

    const totalPaid = payments.reduce((sum, payment) => {
      return sum + payment.amount - payment.refundAmount;
    }, 0);

    invoice.amountPaid = totalPaid;
    invoice.amountDue = invoice.total - totalPaid;

    // Update invoice status
    if (invoice.amountPaid >= invoice.total) {
      invoice.status = InvoiceStatus.PAID;
      invoice.paidAt = new Date();
    } else if (invoice.status === InvoiceStatus.PAID && invoice.amountPaid < invoice.total) {
      // If partially refunded, revert to SENT
      invoice.status = InvoiceStatus.SENT;
      // paidAt is nullable, so we can set it to null
      (invoice as any).paidAt = null;
    }

    await this.invoicesRepository.save(invoice);
  }

  /**
   * Get the connected account for an invoice (user or agency admin)
   * Returns provider-agnostic account ID
   */
  async getConnectedAccountForInvoice(
    invoice: Invoice,
    provider: PaymentProviderType = PaymentProviderType.STRIPE,
  ): Promise<string> {
    // If invoice belongs to an agency, use agency admin's account
    if (invoice.agencyId) {
      const agency = await this.agenciesRepository.findOne({
        where: { id: invoice.agencyId },
        relations: ['createdBy'],
      });

      if (!agency) {
        throw new NotFoundException('Agency not found');
      }

      const accountId = agency.getPaymentAccountId(provider);
      if (!accountId) {
        throw new BadRequestException(
          `Agency payment account not set up for ${provider}. Please complete onboarding.`,
        );
      }

      return accountId;
    }

    // Otherwise, use user's account
    if (!invoice.userId) {
      throw new BadRequestException('Invoice must belong to a user or agency');
    }

    const user = await this.usersRepository.findOne({
      where: { id: invoice.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const accountId = user.getPaymentAccountId(provider);
    if (!accountId) {
      throw new BadRequestException(
        `User payment account not set up for ${provider}. Please complete onboarding.`,
      );
    }

    return accountId;
  }

  /**
   * Get the provider for a payment (with fallback to Stripe for backward compatibility)
   */
  getProviderForPayment(payment: Payment): PaymentProvider {
    const providerType = payment.paymentProvider || PaymentProviderType.STRIPE;
    return this.providerFactory.getProvider(providerType);
  }
}

