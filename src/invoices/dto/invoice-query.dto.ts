import { IsOptional, IsInt, Min, Max, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { InvoiceStatus } from '../entities/invoice.entity';

export class InvoiceQueryDto {
  @ApiProperty({
    example: 1,
    description: 'Page number',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    example: 10,
    description: 'Items per page',
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    enum: InvoiceStatus,
    description: 'Filter by status',
    required: false,
  })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiProperty({
    description: 'Filter by client ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({
    example: '2025-01-01',
    description: 'Filter invoices from this date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({
    example: '2025-12-31',
    description: 'Filter invoices until this date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

