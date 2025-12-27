import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

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
}



