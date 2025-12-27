import { ApiProperty } from '@nestjs/swagger';
import { PaymentOnboardingStatus } from '../enums/payment-onboarding-status.enum';

export class OnboardingResponseDto {
  @ApiProperty({
    example: 'https://connect.stripe.com/setup/c/acct_123...',
    description: 'Onboarding URL (null if already active)',
    nullable: true,
  })
  onboardingUrl: string | null;

  @ApiProperty({
    enum: PaymentOnboardingStatus,
    description: 'Current onboarding status',
  })
  status: PaymentOnboardingStatus;
}



