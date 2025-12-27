import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsEnum, Min } from 'class-validator';

export enum RefundReason {
  DUPLICATE = 'duplicate',
  FRAUDULENT = 'fraudulent',
  REQUESTED_BY_CUSTOMER = 'requested_by_customer',
}

export class RefundPaymentDto {
  @ApiProperty({
    example: 100.0,
    description: 'Refund amount (partial refund). If not provided, full refund will be processed.',
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @ApiProperty({
    enum: RefundReason,
    description: 'Reason for refund',
    required: false,
  })
  @IsOptional()
  @IsEnum(RefundReason)
  reason?: RefundReason;
}



