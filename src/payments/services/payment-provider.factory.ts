import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentProvider } from '../interfaces/payment-provider.interface';
import { PaymentProviderType } from '../enums/payment-provider.enum';
import { StripeService } from './stripe.service';

@Injectable()
export class PaymentProviderFactory {
  constructor(private readonly stripeService: StripeService) {}

  /**
   * Get a payment provider by type
   */
  getProvider(type: PaymentProviderType): PaymentProvider {
    switch (type) {
      case PaymentProviderType.STRIPE:
        return this.stripeService;
      // Future providers can be added here:
      // case PaymentProviderType.PAYPAL:
      //   return this.paypalService;
      default:
        throw new BadRequestException(`Unsupported payment provider: ${type}`);
    }
  }

  /**
   * Get the default payment provider
   */
  getDefaultProvider(): PaymentProvider {
    return this.getProvider(PaymentProviderType.STRIPE);
  }
}

