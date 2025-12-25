import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProposalItemDto {
  @ApiProperty({
    example: 'Website Development',
    description: 'Description of the line item',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 1,
    description: 'Quantity of items',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  quantity?: number = 1;

  @ApiProperty({
    example: 1500.00,
    description: 'Price per unit',
  })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({
    example: 0,
    description: 'Sort order for display',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number = 0;
}