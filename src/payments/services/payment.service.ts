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
import { StripeService } from './stripe.service';

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
    private stripeService: StripeService,
  ) {}

  /**
   * Record a payment with platform fee
   */
  async recordPayment(
    invoiceId: string,
    stripePaymentIntentId: string,
    stripeAccountId: string,
    amount: number,
    platformFee: number,
    platformFeeRate: number,
    status: PaymentStatus,
    metadata?: Record<string, any>,
  ): Promise<Payment> {
    // Check if payment already exists (idempotency)
    const existingPayment = await this.paymentsRepository.findOne({
      where: { stripePaymentIntentId },
    });

    if (existingPayment) {
      return existingPayment;
    }

    const payment = this.paymentsRepository.create({
      invoiceId,
      stripePaymentIntentId,
      stripeAccountId,
      amount,
      platformFee,
      platformFeeRate,
      status,
      metadata,
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
    metadata?: Record<string, any>,
  ): Promise<Payment> {
    // Get payment intent from Stripe
    const paymentIntent = await this.stripeService.getPaymentIntent(paymentIntentId);

    // Extract application fee (platform fee)
    const applicationFeeAmount = paymentIntent.application_fee_amount
      ? paymentIntent.application_fee_amount / 100 // Convert from cents
      : 0;

    const amount = paymentIntent.amount / 100; // Convert from cents
    const platformFeeRate = metadata?.platformFeeRate
      ? parseFloat(metadata.platformFeeRate)
      : 0;

    // Find or create payment record
    let payment = await this.paymentsRepository.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!payment) {
      const invoiceId = paymentIntent.metadata?.invoiceId;
      if (!invoiceId) {
        throw new BadRequestException('Invoice ID not found in payment intent metadata');
      }

      // Extract connected account ID
      let connectedAccountId = '';
      if (typeof paymentIntent.on_behalf_of === 'string') {
        connectedAccountId = paymentIntent.on_behalf_of;
      } else if (paymentIntent.on_behalf_of && typeof paymentIntent.on_behalf_of === 'object' && 'id' in paymentIntent.on_behalf_of) {
        connectedAccountId = paymentIntent.on_behalf_of.id;
      } else if (paymentIntent.transfer_data?.destination) {
        if (typeof paymentIntent.transfer_data.destination === 'string') {
          connectedAccountId = paymentIntent.transfer_data.destination;
        } else if (paymentIntent.transfer_data.destination && typeof paymentIntent.transfer_data.destination === 'object' && 'id' in paymentIntent.transfer_data.destination) {
          connectedAccountId = paymentIntent.transfer_data.destination.id;
        }
      }

      payment = await this.recordPayment(
        invoiceId,
        paymentIntentId,
        connectedAccountId,
        amount,
        applicationFeeAmount,
        platformFeeRate,
        PaymentStatus.SUCCEEDED,
        {
          ...paymentIntent.metadata,
          chargeId: paymentIntent.latest_charge as string,
          ...metadata,
        },
      );
    } else {
      payment.status = PaymentStatus.SUCCEEDED;
      payment.amount = amount;
      payment.platformFee = applicationFeeAmount;
      payment.stripeChargeId = paymentIntent.latest_charge as string;
      if (metadata) {
        payment.metadata = { ...payment.metadata, ...metadata };
      }
      await this.paymentsRepository.save(payment);
    }

    // Update invoice amounts and status
    await this.calculateInvoiceAmounts(payment.invoiceId);

    return payment;
  }

  /**
   * Handle payment failed event
   */
  async handlePaymentFailed(
    paymentIntentId: string,
    metadata?: Record<string, any>,
  ): Promise<Payment> {
    let payment = await this.paymentsRepository.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!payment) {
      // Try to get payment intent to extract invoice ID
      const paymentIntent = await this.stripeService.getPaymentIntent(paymentIntentId);
      const invoiceId = paymentIntent.metadata?.invoiceId;
      if (!invoiceId) {
        throw new BadRequestException('Invoice ID not found in payment intent metadata');
      }

      payment = this.paymentsRepository.create({
        invoiceId,
        stripePaymentIntentId: paymentIntentId,
        status: PaymentStatus.FAILED,
        amount: paymentIntent.amount / 100,
        platformFee: 0,
        platformFeeRate: 0,
        metadata: {
          ...paymentIntent.metadata,
          ...metadata,
        },
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

    // Process refund via Stripe
    const refund = await this.stripeService.processRefund(
      payment.stripePaymentIntentId,
      amount,
      reason,
    );

    // Update payment record
    const refundAmount = refund.amount / 100; // Convert from cents
    payment.refunded = true;
    payment.refundAmount = refundAmount;
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
   */
  async getConnectedAccountForInvoice(invoice: Invoice): Promise<string> {
    // If invoice belongs to an agency, use agency admin's account
    if (invoice.agencyId) {
      const agency = await this.agenciesRepository.findOne({
        where: { id: invoice.agencyId },
        relations: ['createdBy'],
      });

      if (!agency) {
        throw new NotFoundException('Agency not found');
      }

      if (!agency.stripeAccountId) {
        throw new BadRequestException('Agency Stripe account not set up. Please complete onboarding.');
      }

      return agency.stripeAccountId;
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

    if (!user.stripeAccountId) {
      throw new BadRequestException('User Stripe account not set up. Please complete onboarding.');
    }

    return user.stripeAccountId;
  }
}

