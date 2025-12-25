import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Client full name',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Client source UUID',
  })
  @IsUUID()
  @IsNotEmpty()
  sourceId: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Client email address',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: 'Acme Corporation',
    description: 'Company name',
    required: false,
  })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({
    example: '+1-555-123-4567',
    description: 'Phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: '123 Main St, City, State 12345',
    description: 'Physical address',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: 'Important client notes and information',
    description: 'Additional notes about the client',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

