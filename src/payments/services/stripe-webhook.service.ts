import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { PaymentService } from './payment.service';
import { PaymentProviderFactory } from './payment-provider.factory';
import { PaymentProviderType } from '../enums/payment-provider.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { User } from '../../users/entities/user.entity';
import { Agency } from '../../agencies/entities/agency.entity';
import { StripeOnboardingStatus } from '../enums/stripe-onboarding-status.enum';
import { PaymentOnboardingStatus } from '../enums/payment-onboarding-status.enum';

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
    private providerFactory: PaymentProviderFactory,
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

    await this.paymentService.handlePaymentSucceeded(
      paymentIntent.id,
      PaymentProviderType.STRIPE,
      {
        eventId: event.id,
        eventType: event.type,
      },
    );
  }

  /**
   * Handle payment intent failed event
   */
  private async handlePaymentIntentFailed(
    event: Stripe.PaymentIntentPaymentFailedEvent,
  ): Promise<void> {
    const paymentIntent = event.data.object;
    this.logger.log(`Payment failed: ${paymentIntent.id}`);

    await this.paymentService.handlePaymentFailed(
      paymentIntent.id,
      PaymentProviderType.STRIPE,
      {
        eventId: event.id,
        eventType: event.type,
        failureCode: paymentIntent.last_payment_error?.code,
        failureMessage: paymentIntent.last_payment_error?.message,
      },
    );
  }

  /**
   * Handle charge refunded event
   */
  private async handleChargeRefunded(
    event: Stripe.ChargeRefundedEvent,
  ): Promise<void> {
    const charge = event.data.object;
    this.logger.log(`Charge refunded: ${charge.id}`);

    // Find payment by charge ID - check both generic and Stripe fields
    const payment = await this.paymentService['paymentsRepository'].findOne({
      where: [
        { providerChargeId: charge.id },
        { stripeChargeId: charge.id }, // Backward compatibility
      ],
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
    
    // Update provider charge ID if not set
    if (!payment.providerChargeId) {
      payment.providerChargeId = charge.id;
    }
    if (!payment.stripeChargeId && payment.paymentProvider === PaymentProviderType.STRIPE) {
      payment.stripeChargeId = charge.id;
    }

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

    // Update user account status - check both generic and Stripe fields
    const user = await this.usersRepository.findOne({
      where: [
        { paymentProviderAccountId: account.id },
        { stripeAccountId: account.id }, // Backward compatibility
      ],
    });

    if (user) {
      const status = await this.stripeService.handleAccountUpdateWebhook(event);
      
      // Update both generic and Stripe fields for migration period
      user.paymentOnboardingStatus = status;
      user.stripeOnboardingStatus = status === PaymentOnboardingStatus.COMPLETED
        ? StripeOnboardingStatus.ACTIVE
        : status === PaymentOnboardingStatus.PENDING
        ? StripeOnboardingStatus.PENDING
        : StripeOnboardingStatus.NOT_STARTED;
      
      if (status === PaymentOnboardingStatus.COMPLETED) {
        if (!user.paymentOnboardingCompletedAt) {
          user.paymentOnboardingCompletedAt = new Date();
        }
        if (!user.stripeOnboardingCompletedAt) {
          user.stripeOnboardingCompletedAt = new Date();
        }
      }
      
      // Ensure paymentProviderAccountId is set if not already
      if (!user.paymentProviderAccountId && user.stripeAccountId === account.id) {
        user.paymentProviderAccountId = account.id;
      }
      
      await this.usersRepository.save(user);
      return;
    }

    // Update agency account status - check both generic and Stripe fields
    const agency = await this.agenciesRepository.findOne({
      where: [
        { paymentProviderAccountId: account.id },
        { stripeAccountId: account.id }, // Backward compatibility
      ],
    });

    if (agency) {
      const status = await this.stripeService.handleAccountUpdateWebhook(event);
      
      // Update both generic and Stripe fields for migration period
      agency.paymentOnboardingStatus = status;
      agency.stripeOnboardingStatus = status === PaymentOnboardingStatus.COMPLETED
        ? StripeOnboardingStatus.ACTIVE
        : status === PaymentOnboardingStatus.PENDING
        ? StripeOnboardingStatus.PENDING
        : StripeOnboardingStatus.NOT_STARTED;
      
      if (status === PaymentOnboardingStatus.COMPLETED) {
        if (!agency.paymentOnboardingCompletedAt) {
          agency.paymentOnboardingCompletedAt = new Date();
        }
        if (!agency.stripeOnboardingCompletedAt) {
          agency.stripeOnboardingCompletedAt = new Date();
        }
      }
      
      // Ensure paymentProviderAccountId is set if not already
      if (!agency.paymentProviderAccountId && agency.stripeAccountId === account.id) {
        agency.paymentProviderAccountId = account.id;
      }
      
      await this.agenciesRepository.save(agency);
    }
  }
}

