import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProposalDto } from './create-proposal.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProposalStatus } from '../entities/proposal.entity';

// UpdateProposalDto makes all fields optional and excludes items
// (items are managed separately through their own endpoints)
export class UpdateProposalDto extends PartialType(
  OmitType(CreateProposalDto, ['items'] as const),
) {
  @ApiProperty({
    enum: ProposalStatus,
    description: 'Proposal status',
    required: false,
  })
  @IsOptional()
  @IsEnum(ProposalStatus)
  status?: ProposalStatus;
}