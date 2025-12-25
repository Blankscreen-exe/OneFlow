import { IsOptional, IsInt, Min, Max, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProposalStatus } from '../entities/proposal.entity';

export enum ProposalSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
  TOTAL = 'total',
  VALID_UNTIL = 'validUntil',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class ProposalQueryDto {
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
    enum: ProposalStatus,
    description: 'Filter by status',
    required: false,
  })
  @IsOptional()
  @IsEnum(ProposalStatus)
  status?: ProposalStatus;

  @ApiProperty({
    description: 'Filter by client ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({
    enum: ProposalSortBy,
    description: 'Sort by field',
    required: false,
    default: ProposalSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(ProposalSortBy)
  sortBy?: ProposalSortBy = ProposalSortBy.CREATED_AT;

  @ApiProperty({
    enum: SortOrder,
    description: 'Sort order',
    required: false,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}