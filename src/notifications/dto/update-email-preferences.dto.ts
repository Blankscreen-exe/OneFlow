import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsArray, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateEmailPreferencesDto {
  @ApiProperty({
    description: 'Enable/disable payment confirmation emails',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  paymentConfirmationEnabled?: boolean;

  @ApiProperty({
    description: 'Enable/disable invoice reminder emails',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  invoiceRemindersEnabled?: boolean;

  @ApiProperty({
    description: 'Array of days to send overdue reminders (e.g., [7, 14, 30])',
    required: false,
    example: [7, 14, 30],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  @Max(365, { each: true })
  @Type(() => Number)
  overdueReminderDays?: number[];
}

