import { ApiProperty } from '@nestjs/swagger';
import { ProposalStatus } from '../entities/proposal.entity';

export class PublicProposalResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: ProposalStatus })
  status: ProposalStatus;

  @ApiProperty({ required: false })
  validUntil?: Date;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  taxRate: number;

  @ApiProperty()
  taxAmount: number;

  @ApiProperty()
  total: number;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty({ required: false })
  coverLetter?: string;

  @ApiProperty()
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;

  @ApiProperty()
  client: {
    id: string;
    name: string;
    company?: string;
  };

  @ApiProperty()
  createdAt: Date;
}

