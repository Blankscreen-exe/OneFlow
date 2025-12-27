import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { PaymentService } from './payment.service';
import { PaymentStatus } from '../enums/payment-status.enum';
import { User } from '../../users/entities/user.entity';
import { Agency } from '../../agencies/entities/agency.entity';
import { StripeOnboardingStatus } from '../enums/stripe-onboarding-status.enum';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);
  private readonly processedEvents = new Set<string>(); // In-memory idempotency (use Redis in production)

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Agency)
    private agenciesRepository: Repository<Agency>,
    private stripeService: StripeService,
    private paymentService: PaymentService,
  ) {}

  /**
   * Handle webhook event with idempotency
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    // Idempotency check
    if (this.processedEvents.has(event.id)) {
      this.logger.log(`Event ${event.id} already processed, skipping`);
      return;
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event as Stripe.PaymentIntentSucceededEvent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event as Stripe.PaymentIntentPaymentFailedEvent);
          break;
        case 'charge.refunded':
          await this.handleChargeRefunded(event as Stripe.ChargeRefundedEvent);
          break;
        case 'account.updated':
          await this.handleAccountUpdated(event as Stripe.AccountUpdatedEvent);
          break;
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      // Mark as processed
      this.processedEvents.add(event.id);
    } catch (error) {
      this.logger.error(`Error processing webhook event ${event.id}`, error);
      // Don't mark as processed if there was an error (allows retry)
      throw error;
    }
  }

  /**
   * Handle payment intent succeeded event
   */
  private async handlePaymentIntentSucceeded(
    event: Stripe.PaymentIntentSucceededEvent,
  ): Promise<void> {
    const paymentIntent = event.data.object;
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);

    await this.paymentService.handlePaymentSucceeded(paymentIntent.id, {
      eventId: event.id,
      eventType: event.type,
    });
  }

  /**
   * Handle payment intent failed event
   */
  private async handlePaymentIntentFailed(
    event: Stripe.PaymentIntentPaymentFailedEvent,
  ): Promise<void> {
    const paymentIntent = event.data.object;
    this.logger.log(`Payment failed: ${paymentIntent.id}`);

    await this.paymentService.handlePaymentFailed(paymentIntent.id, {
      eventId: event.id,
      eventType: event.type,
      failureCode: paymentIntent.last_payment_error?.code,
      failureMessage: paymentIntent.last_payment_error?.message,
    });
  }

  /**
   * Handle charge refunded event
   */
  private async handleChargeRefunded(
    event: Stripe.ChargeRefundedEvent,
  ): Promise<void> {
    const charge = event.data.object;
    this.logger.log(`Charge refunded: ${charge.id}`);

    // Find payment by charge ID
    const payment = await this.paymentService['paymentsRepository'].findOne({
      where: { stripeChargeId: charge.id },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for charge: ${charge.id}`);
      return;
    }

    // Update payment status
    const refundAmount = charge.amount_refunded / 100; // Convert from cents
    payment.refunded = true;
    payment.refundAmount = refundAmount;
    payment.status = PaymentStatus.REFUNDED;

    await this.paymentService['paymentsRepository'].save(payment);

    // Update invoice amounts
    await this.paymentService.calculateInvoiceAmounts(payment.invoiceId);
  }

  /**
   * Handle account updated event (for onboarding status)
   */
  private async handleAccountUpdated(
    event: Stripe.AccountUpdatedEvent,
  ): Promise<void> {
    const account = event.data.object;
    this.logger.log(`Account updated: ${account.id}`);

    // Update user account status
    const user = await this.usersRepository.findOne({
      where: { stripeAccountId: account.id },
    });

    if (user) {
      const status = await this.stripeService.handleAccountUpdateWebhook(event);
      user.stripeOnboardingStatus = status;
      if (status === StripeOnboardingStatus.ACTIVE && !user.stripeOnboardingCompletedAt) {
        user.stripeOnboardingCompletedAt = new Date();
      }
      await this.usersRepository.save(user);
      return;
    }

    // Update agency account status
    const agency = await this.agenciesRepository.findOne({
      where: { stripeAccountId: account.id },
    });

    if (agency) {
      const status = await this.stripeService.handleAccountUpdateWebhook(event);
      agency.stripeOnboardingStatus = status;
      if (status === StripeOnboardingStatus.ACTIVE && !agency.stripeOnboardingCompletedAt) {
        agency.stripeOnboardingCompletedAt = new Date();
      }
      await this.agenciesRepository.save(agency);
    }
  }
}

