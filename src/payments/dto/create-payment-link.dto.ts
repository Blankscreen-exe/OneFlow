import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, IsEnum } from 'class-validator';
import { PaymentProviderType } from '../enums/payment-provider.enum';

export class CreatePaymentLinkDto {
  @ApiProperty({
    example: 'https://example.com/invoices/123/payment-success',
    description: 'Return URL after payment completion',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  returnUrl?: string;

  @ApiProperty({
    enum: PaymentProviderType,
    description: 'Payment provider to use',
    required: false,
    default: PaymentProviderType.STRIPE,
  })
  @IsOptional()
  @IsEnum(PaymentProviderType)
  provider?: PaymentProviderType;
}



