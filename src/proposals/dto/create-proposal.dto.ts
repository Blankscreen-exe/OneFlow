import {
    IsString,
    IsNotEmpty,
    IsUUID,
    IsOptional,
    IsNumber,
    IsDateString,
    Min,
    Max,
    ValidateNested,
    IsArray,
  } from 'class-validator';
  import { Type } from 'class-transformer';
  import { ApiProperty } from '@nestjs/swagger';
  
  // DTO for creating items along with the proposal
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
  
  export class CreateProposalDto {
    @ApiProperty({
      example: '550e8400-e29b-41d4-a716-446655440000',
      description: 'Client UUID',
    })
    @IsUUID()
    @IsNotEmpty()
    clientId: string;
  
    @ApiProperty({
      example: 'Website Redesign Proposal',
      description: 'Title of the proposal',
    })
    @IsString()
    @IsNotEmpty()
    title: string;
  
    @ApiProperty({
      example: '2025-02-28',
      description: 'Date until which the proposal is valid',
      required: false,
    })
    @IsOptional()
    @IsDateString()
    validUntil?: string;
  
    @ApiProperty({
      example: 10,
      description: 'Tax rate as a percentage (0-100)',
      default: 0,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    taxRate?: number = 0;
  
  @ApiProperty({
    example: 'Thank you for considering our services.',
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: 'Dear Client, I am excited to apply for this project...',
    description: 'Cover letter for the proposal (e.g., Upwork application)',
    required: false,
  })
  @IsOptional()
  @IsString()
  coverLetter?: string;

  @ApiProperty({
    type: [CreateProposalItemDto],
    description: 'Line items for the proposal',
    required: false,
  })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateProposalItemDto)
    items?: CreateProposalItemDto[];
  }