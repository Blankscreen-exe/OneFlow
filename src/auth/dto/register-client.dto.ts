import { IsEmail, IsString, MinLength, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterClientDto {
  @ApiProperty({ example: 'client@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Service Provider ID - the SP who invited this client'
  })
  @IsUUID()
  @IsNotEmpty()
  serviceProviderId: string;
}

