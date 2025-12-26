import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInvoiceDto {
  @ApiProperty({
    example: 'Additional notes for the invoice',
    description: 'Invoice notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: '2025-02-15',
    description: 'Due date for the invoice',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

