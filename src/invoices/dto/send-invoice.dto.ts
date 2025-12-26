import { IsOptional, IsEmail, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendInvoiceDto {
  @ApiProperty({
    example: 'client@example.com',
    description: 'Recipient email address for the invoice',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @ApiProperty({
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    description: 'Contact IDs to send invoice via (for future multi-channel support)',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  contactIds?: string[];
}

