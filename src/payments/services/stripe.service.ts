import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { StripeOnboardingStatus } from '../enums/stripe-onboarding-status.enum';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
    });
  }

  /**
   * Create a Stripe Connect Express account for a user or agency
   */
  async createConnectedAccount(
    type: 'express',
    email?: string,
  ): Promise<Stripe.Account> {
    try {
      const account = await this.stripe.accounts.create({
        type: 'express',
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      return account;
    } catch (error) {
      this.logger.error('Failed to create connected account', error);
      throw new BadRequestException('Failed to create Stripe account');
    }
  }

  /**
   * Create an onboarding link for a Stripe Connect account
   */
  async createOnboardingLink(
    accountId: string,
    returnUrl?: string,
  ): Promise<string> {
    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: returnUrl || `${this.configService.get<string>('frontend.url')}/stripe/onboarding/refresh`,
        return_url: returnUrl || `${this.configService.get<string>('frontend.url')}/stripe/onboarding/return`,
        type: 'account_onboarding',
      });
      return accountLink.url;
    } catch (error) {
      this.logger.error('Failed to create onboarding link', error);
      throw new BadRequestException('Failed to create onboarding link');
    }
  }

  /**
   * Get the status of a Stripe Connect account
   */
  async getAccountStatus(accountId: string): Promise<StripeOnboardingStatus> {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);
      
      if (!account.details_submitted) {
        return StripeOnboardingStatus.PENDING;
      }
      
      if (account.charges_enabled && account.payouts_enabled) {
        return StripeOnboardingStatus.ACTIVE;
      }
      
      if (account.charges_enabled || account.payouts_enabled) {
        return StripeOnboardingStatus.RESTRICTED;
      }
      
      return StripeOnboardingStatus.PENDING;
    } catch (error) {
      this.logger.error('Failed to get account status', error);
      throw new BadRequestException('Failed to retrieve account status');
    }
  }

  /**
   * Create a payment link with application fee for a connected account
   * Note: Payment Links don't directly support application fees, so we use Payment Intents instead
   * For MVP, we'll create a checkout session which supports application fees
   */
  async createPaymentLink(
    invoice: Invoice,
    connectedAccountId: string,
    platformFeeRate: number,
    returnUrl?: string,
  ): Promise<string> {
    try {
      // Calculate application fee amount
      const applicationFeeAmount = Math.round(
        invoice.total * (platformFeeRate / 100) * 100, // Convert to cents
      );

      // Create a checkout session with application fee
      // This is the recommended approach for Stripe Connect with application fees
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Invoice ${invoice.invoiceNumber}`,
                description: invoice.notes || `Invoice for ${invoice.client.name || 'Client'}`,
              },
              unit_amount: Math.round(invoice.total * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        payment_intent_data: {
          application_fee_amount: applicationFeeAmount,
          on_behalf_of: connectedAccountId,
          transfer_data: {
            destination: connectedAccountId,
          },
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
          },
        },
        success_url: returnUrl || `${this.configService.get<string>('frontend.url')}/invoices/${invoice.id}/payment-success`,
        cancel_url: returnUrl || `${this.configService.get<string>('frontend.url')}/invoices/${invoice.id}`,
      });

      return session.url || '';
    } catch (error) {
      this.logger.error('Failed to create payment link', error);
      throw new BadRequestException('Failed to create payment link');
    }
  }

  /**
   * Create a payment intent with application fee for a connected account
   */
  async createPaymentIntent(
    invoice: Invoice,
    connectedAccountId: string,
    platformFeeRate: number,
    amount: number,
    metadata?: Record<string, string>,
  ): Promise<Stripe.PaymentIntent> {
    try {
      // Calculate application fee amount
      const applicationFeeAmount = Math.round(
        amount * (platformFeeRate / 100) * 100, // Convert to cents
      );

      // Create payment intent on the platform account with application fee
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        application_fee_amount: applicationFeeAmount,
        on_behalf_of: connectedAccountId,
        transfer_data: {
          destination: connectedAccountId,
        },
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          ...metadata,
        },
      });

      return paymentIntent;
    } catch (error) {
      this.logger.error('Failed to create payment intent', error);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required');
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  /**
   * Process a refund
   */
  async processRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer',
  ): Promise<Stripe.Refund> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Convert to cents
      }

      if (reason) {
        refundParams.reason = reason;
      }

      const refund = await this.stripe.refunds.create(refundParams);
      return refund;
    } catch (error) {
      this.logger.error('Failed to process refund', error);
      throw new BadRequestException('Failed to process refund');
    }
  }

  /**
   * Get payment intent details
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error('Failed to get payment intent', error);
      throw new BadRequestException('Failed to retrieve payment intent');
    }
  }

  /**
   * Handle account update webhook event
   */
  async handleAccountUpdateWebhook(
    event: Stripe.AccountUpdatedEvent,
  ): Promise<StripeOnboardingStatus> {
    const account = event.data.object;
    
    if (!account.details_submitted) {
      return StripeOnboardingStatus.PENDING;
    }
    
    if (account.charges_enabled && account.payouts_enabled) {
      return StripeOnboardingStatus.ACTIVE;
    }
    
    if (account.charges_enabled || account.payouts_enabled) {
      return StripeOnboardingStatus.RESTRICTED;
    }
    
    return StripeOnboardingStatus.PENDING;
  }
}

