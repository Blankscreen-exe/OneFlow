import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ContactType } from '../entities/client-contact.entity';

export class CreateClientContactDto {
  @ApiProperty({
    enum: ContactType,
    description: 'Type of contact (email, phone, upwork, linkedin, etc.)',
    example: ContactType.EMAIL,
  })
  @IsEnum(ContactType)
  @IsNotEmpty()
  type: ContactType;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Contact value (email address, phone number, URL, etc.)',
  })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({
    example: 'Work Email',
    description: 'Optional label for the contact',
    required: false,
  })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({
    example: false,
    description: 'Whether to bypass validation',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  bypassValidation?: boolean = false;
}

