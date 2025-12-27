import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Agency } from '../../agencies/entities/agency.entity';
import { PaymentProviderFactory } from './payment-provider.factory';
import { PaymentProviderType } from '../enums/payment-provider.enum';
import { PaymentOnboardingStatus } from '../enums/payment-onboarding-status.enum';
import { StripeOnboardingStatus } from '../enums/stripe-onboarding-status.enum';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeConnectService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Agency)
    private agenciesRepository: Repository<Agency>,
    private providerFactory: PaymentProviderFactory,
    private configService: ConfigService,
  ) {}

  /**
   * Initiate onboarding for a user (optional)
   */
  async initiateOnboarding(
    userId: string,
    returnUrl?: string,
    provider: PaymentProviderType = PaymentProviderType.STRIPE,
  ): Promise<{ onboardingUrl: string | null; status: PaymentOnboardingStatus }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const paymentProvider = this.providerFactory.getProvider(provider);

    // Get account ID (generic or Stripe fallback)
    const accountId = user.getPaymentAccountId(provider);

    // If account already exists and is active, return existing link or status
    if (accountId) {
      const status = await paymentProvider.getAccountStatus(accountId);
      if (status === PaymentOnboardingStatus.COMPLETED) {
        return {
          onboardingUrl: null,
          status,
        };
      }
      
      // If pending, create a new onboarding link
      if (status === PaymentOnboardingStatus.PENDING) {
        const onboardingUrl = await paymentProvider.createOnboardingLink(
          accountId,
          returnUrl,
        );
        
        // Update both generic and Stripe fields for migration period
        const updateData: any = {
          paymentOnboardingLink: onboardingUrl,
        };
        if (provider === PaymentProviderType.STRIPE) {
          updateData.stripeOnboardingLink = onboardingUrl;
        }
        
        await this.usersRepository.update(userId, updateData);
        return { onboardingUrl, status };
      }
    }

    // Create new connected account
    const account = await paymentProvider.createConnectedAccount(user.email);
    const onboardingUrl = await paymentProvider.createOnboardingLink(
      account.id,
      returnUrl,
    );

    // Update both generic and Stripe fields for migration period
    const updateData: any = {
      defaultPaymentProvider: provider,
      paymentProviderAccountId: account.id,
      paymentOnboardingStatus: PaymentOnboardingStatus.PENDING,
      paymentOnboardingLink: onboardingUrl,
    };
    
    if (provider === PaymentProviderType.STRIPE) {
      updateData.stripeAccountId = account.id;
      updateData.stripeOnboardingStatus = StripeOnboardingStatus.PENDING;
      updateData.stripeOnboardingLink = onboardingUrl;
    }

    await this.usersRepository.update(userId, updateData);

    return {
      onboardingUrl,
      status: PaymentOnboardingStatus.PENDING,
    };
  }

  /**
   * Initiate onboarding for an agency (admin only)
   */
  async initiateAgencyOnboarding(
    agencyId: string,
    userId: string,
    returnUrl?: string,
    provider: PaymentProviderType = PaymentProviderType.STRIPE,
  ): Promise<{ onboardingUrl: string | null; status: PaymentOnboardingStatus }> {
    const agency = await this.agenciesRepository.findOne({
      where: { id: agencyId, createdById: userId },
    });
    if (!agency) {
      throw new NotFoundException('Agency not found or you are not the admin');
    }

    // Get admin user
    const admin = await this.usersRepository.findOne({
      where: { id: agency.createdById },
    });
    if (!admin) {
      throw new NotFoundException('Agency admin not found');
    }

    const paymentProvider = this.providerFactory.getProvider(provider);

    // Get account ID (generic or Stripe fallback)
    const accountId = agency.getPaymentAccountId(provider);

    // If account already exists and is active, return existing link or status
    if (accountId) {
      const status = await paymentProvider.getAccountStatus(accountId);
      if (status === PaymentOnboardingStatus.COMPLETED) {
        return {
          onboardingUrl: null,
          status,
        };
      }
      
      // If pending, create a new onboarding link
      if (status === PaymentOnboardingStatus.PENDING) {
        const onboardingUrl = await paymentProvider.createOnboardingLink(
          accountId,
          returnUrl,
        );
        
        // Update both generic and Stripe fields for migration period
        const updateData: any = {
          paymentOnboardingLink: onboardingUrl,
        };
        if (provider === PaymentProviderType.STRIPE) {
          updateData.stripeOnboardingLink = onboardingUrl;
        }
        
        await this.agenciesRepository.update(agencyId, updateData);
        return { onboardingUrl, status };
      }
    }

    // Create new connected account using admin's email
    const account = await paymentProvider.createConnectedAccount(admin.email);
    const onboardingUrl = await paymentProvider.createOnboardingLink(
      account.id,
      returnUrl,
    );

    // Update both generic and Stripe fields for migration period
    const updateData: any = {
      defaultPaymentProvider: provider,
      paymentProviderAccountId: account.id,
      paymentOnboardingStatus: PaymentOnboardingStatus.PENDING,
      paymentOnboardingLink: onboardingUrl,
    };
    
    if (provider === PaymentProviderType.STRIPE) {
      updateData.stripeAccountId = account.id;
      updateData.stripeOnboardingStatus = StripeOnboardingStatus.PENDING;
      updateData.stripeOnboardingLink = onboardingUrl;
    }

    await this.agenciesRepository.update(agencyId, updateData);

    return {
      onboardingUrl,
      status: PaymentOnboardingStatus.PENDING,
    };
  }

  /**
   * Check and update user onboarding status
   */
  async checkOnboardingStatus(
    userId: string,
    provider: PaymentProviderType = PaymentProviderType.STRIPE,
  ): Promise<PaymentOnboardingStatus> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const accountId = user.getPaymentAccountId(provider);
    if (!accountId) {
      return PaymentOnboardingStatus.NOT_STARTED;
    }

    const paymentProvider = this.providerFactory.getProvider(provider);
    const status = await paymentProvider.getAccountStatus(accountId);
    
    // Update user status if changed (both generic and Stripe fields for migration period)
    const updateData: any = {
      paymentOnboardingStatus: status,
    };
    
    if (status === PaymentOnboardingStatus.COMPLETED) {
      updateData.paymentOnboardingCompletedAt = new Date();
    }
    
    if (provider === PaymentProviderType.STRIPE) {
      // Map generic status to Stripe status for backward compatibility
      const stripeStatus = status === PaymentOnboardingStatus.COMPLETED
        ? StripeOnboardingStatus.ACTIVE
        : status === PaymentOnboardingStatus.PENDING
        ? StripeOnboardingStatus.PENDING
        : StripeOnboardingStatus.NOT_STARTED;
      
      updateData.stripeOnboardingStatus = stripeStatus;
      if (status === PaymentOnboardingStatus.COMPLETED) {
        updateData.stripeOnboardingCompletedAt = new Date();
      }
    }
    
    if (user.paymentOnboardingStatus !== status) {
      await this.usersRepository.update(userId, updateData);
    }

    return status;
  }

  /**
   * Check and update agency onboarding status
   */
  async checkAgencyOnboardingStatus(
    agencyId: string,
    userId: string,
    provider: PaymentProviderType = PaymentProviderType.STRIPE,
  ): Promise<PaymentOnboardingStatus> {
    const agency = await this.agenciesRepository.findOne({
      where: { id: agencyId, createdById: userId },
    });
    if (!agency) {
      throw new NotFoundException('Agency not found or you are not the admin');
    }

    const accountId = agency.getPaymentAccountId(provider);
    if (!accountId) {
      return PaymentOnboardingStatus.NOT_STARTED;
    }

    const paymentProvider = this.providerFactory.getProvider(provider);
    const status = await paymentProvider.getAccountStatus(accountId);
    
    // Update agency status if changed (both generic and Stripe fields for migration period)
    const updateData: any = {
      paymentOnboardingStatus: status,
    };
    
    if (status === PaymentOnboardingStatus.COMPLETED) {
      updateData.paymentOnboardingCompletedAt = new Date();
    }
    
    if (provider === PaymentProviderType.STRIPE) {
      // Map generic status to Stripe status for backward compatibility
      const stripeStatus = status === PaymentOnboardingStatus.COMPLETED
        ? StripeOnboardingStatus.ACTIVE
        : status === PaymentOnboardingStatus.PENDING
        ? StripeOnboardingStatus.PENDING
        : StripeOnboardingStatus.NOT_STARTED;
      
      updateData.stripeOnboardingStatus = stripeStatus;
      if (status === PaymentOnboardingStatus.COMPLETED) {
        updateData.stripeOnboardingCompletedAt = new Date();
      }
    }
    
    if (agency.paymentOnboardingStatus !== status) {
      await this.agenciesRepository.update(agencyId, updateData);
    }

    return status;
  }

  /**
   * Get platform fee rate for a user or agency
   */
  getPlatformFeeRate(userOrAgency: User | Agency): number {
    if ('platformFeeRate' in userOrAgency) {
      return userOrAgency.platformFeeRate;
    }
    // Fallback to default from config
    return this.configService.get<number>('stripe.defaultPlatformFeeRate', 10);
  }
}

