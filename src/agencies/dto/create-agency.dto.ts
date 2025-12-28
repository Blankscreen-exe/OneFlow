import { IsString, IsOptional, IsUrl, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAgencyDto {
  @ApiProperty({ example: 'Acme Digital Agency' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'A leading digital marketing agency', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://acme.com', required: false })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ example: '+1-555-0123', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '123 Main St, City, State 12345', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'TAX-123456', required: false })
  @IsOptional()
  @IsString()
  taxId?: string;
}




