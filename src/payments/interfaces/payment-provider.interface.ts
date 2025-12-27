import { Invoice } from '../../invoices/entities/invoice.entity';
import { PaymentProviderType } from '../enums/payment-provider.enum';
import { PaymentOnboardingStatus } from '../enums/payment-onboarding-status.enum';

/**
 * Generic connected account information
 */
export interface ConnectedAccount {
  id: string;
  provider: PaymentProviderType;
  email?: string;
}

/**
 * Generic payment intent information
 */
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  metadata?: Record<string, any>;
  chargeId?: string;
  applicationFeeAmount?: number;
}

/**
 * Generic refund information
 */
export interface Refund {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
}

/**
 * Generic payment event from webhook
 */
export interface PaymentEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

/**
 * Payment Provider Interface
 * All payment providers must implement this interface
 */
export interface PaymentProvider {
  /**
   * Get the provider type
   */
  getProviderType(): PaymentProviderType;

  /**
   * Create a connected account for a user or agency
   */
  createConnectedAccount(email?: string): Promise<ConnectedAccount>;

  /**
   * Create an onboarding link for a connected account
   */
  createOnboardingLink(
    accountId: string,
    returnUrl?: string,
  ): Promise<string>;

  /**
   * Get the status of a connected account
   */
  getAccountStatus(accountId: string): Promise<PaymentOnboardingStatus>;

  /**
   * Create a payment link for an invoice
   */
  createPaymentLink(
    invoice: Invoice,
    connectedAccountId: string,
    platformFeeRate: number,
    returnUrl?: string,
  ): Promise<string>;

  /**
   * Create a payment intent for an invoice
   */
  createPaymentIntent(
    invoice: Invoice,
    connectedAccountId: string,
    platformFeeRate: number,
    amount: number,
    metadata?: Record<string, string>,
  ): Promise<PaymentIntent>;

  /**
   * Process a refund
   */
  processRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer',
  ): Promise<Refund>;

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
  ): PaymentEvent;

  /**
   * Get payment intent details
   */
  getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent>;
}

