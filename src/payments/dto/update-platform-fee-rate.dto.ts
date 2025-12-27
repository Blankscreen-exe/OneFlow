import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

export class UpdatePlatformFeeRateDto {
  @ApiProperty({
    example: 10.0,
    description: 'Platform fee rate (percentage, 0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  platformFeeRate: number;
}



