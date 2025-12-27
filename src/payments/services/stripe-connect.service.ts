import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Agency } from '../../agencies/entities/agency.entity';
import { StripeService } from './stripe.service';
import { StripeOnboardingStatus } from '../enums/stripe-onboarding-status.enum';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeConnectService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Agency)
    private agenciesRepository: Repository<Agency>,
    private stripeService: StripeService,
    private configService: ConfigService,
  ) {}

  /**
   * Initiate onboarding for a user (optional)
   */
  async initiateOnboarding(userId: string, returnUrl?: string): Promise<{ onboardingUrl: string | null; status: StripeOnboardingStatus }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If account already exists and is active, return existing link or status
    if (user.stripeAccountId) {
      const status = await this.stripeService.getAccountStatus(user.stripeAccountId);
      if (status === StripeOnboardingStatus.ACTIVE) {
        return {
          onboardingUrl: null,
          status,
        };
      }
      
      // If pending, create a new onboarding link
      if (status === StripeOnboardingStatus.PENDING) {
        const onboardingUrl = await this.stripeService.createOnboardingLink(
          user.stripeAccountId,
          returnUrl,
        );
        await this.usersRepository.update(userId, {
          stripeOnboardingLink: onboardingUrl,
        });
        return { onboardingUrl, status };
      }
    }

    // Create new connected account
    const account = await this.stripeService.createConnectedAccount('express', user.email);
    const onboardingUrl = await this.stripeService.createOnboardingLink(
      account.id,
      returnUrl,
    );

    await this.usersRepository.update(userId, {
      stripeAccountId: account.id,
      stripeOnboardingStatus: StripeOnboardingStatus.PENDING,
      stripeOnboardingLink: onboardingUrl,
    });

    return {
      onboardingUrl,
      status: StripeOnboardingStatus.PENDING,
    };
  }

  /**
   * Initiate onboarding for an agency (admin only)
   */
  async initiateAgencyOnboarding(
    agencyId: string,
    userId: string,
    returnUrl?: string,
  ): Promise<{ onboardingUrl: string | null; status: StripeOnboardingStatus }> {
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

    // If account already exists and is active, return existing link or status
    if (agency.stripeAccountId) {
      const status = await this.stripeService.getAccountStatus(agency.stripeAccountId);
      if (status === StripeOnboardingStatus.ACTIVE) {
        return {
          onboardingUrl: null,
          status,
        };
      }
      
      // If pending, create a new onboarding link
      if (status === StripeOnboardingStatus.PENDING) {
        const onboardingUrl = await this.stripeService.createOnboardingLink(
          agency.stripeAccountId,
          returnUrl,
        );
        await this.agenciesRepository.update(agencyId, {
          stripeOnboardingLink: onboardingUrl,
        });
        return { onboardingUrl, status };
      }
    }

    // Create new connected account using admin's email
    const account = await this.stripeService.createConnectedAccount('express', admin.email);
    const onboardingUrl = await this.stripeService.createOnboardingLink(
      account.id,
      returnUrl,
    );

    await this.agenciesRepository.update(agencyId, {
      stripeAccountId: account.id,
      stripeOnboardingStatus: StripeOnboardingStatus.PENDING,
      stripeOnboardingLink: onboardingUrl,
    });

    return {
      onboardingUrl,
      status: StripeOnboardingStatus.PENDING,
    };
  }

  /**
   * Check and update user onboarding status
   */
  async checkOnboardingStatus(userId: string): Promise<StripeOnboardingStatus> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.stripeAccountId) {
      return StripeOnboardingStatus.NOT_STARTED;
    }

    const status = await this.stripeService.getAccountStatus(user.stripeAccountId);
    
    // Update user status if changed
    if (status !== user.stripeOnboardingStatus) {
      await this.usersRepository.update(userId, {
        stripeOnboardingStatus: status,
        ...(status === StripeOnboardingStatus.ACTIVE && {
          stripeOnboardingCompletedAt: new Date(),
        }),
      });
    }

    return status;
  }

  /**
   * Check and update agency onboarding status
   */
  async checkAgencyOnboardingStatus(
    agencyId: string,
    userId: string,
  ): Promise<StripeOnboardingStatus> {
    const agency = await this.agenciesRepository.findOne({
      where: { id: agencyId, createdById: userId },
    });
    if (!agency) {
      throw new NotFoundException('Agency not found or you are not the admin');
    }

    if (!agency.stripeAccountId) {
      return StripeOnboardingStatus.NOT_STARTED;
    }

    const status = await this.stripeService.getAccountStatus(agency.stripeAccountId);
    
    // Update agency status if changed
    if (status !== agency.stripeOnboardingStatus) {
      await this.agenciesRepository.update(agencyId, {
        stripeOnboardingStatus: status,
        ...(status === StripeOnboardingStatus.ACTIVE && {
          stripeOnboardingCompletedAt: new Date(),
        }),
      });
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

