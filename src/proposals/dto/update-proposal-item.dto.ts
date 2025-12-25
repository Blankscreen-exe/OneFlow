import { PartialType } from '@nestjs/swagger';
import { CreateProposalItemDto } from './create-proposal-item.dto';

export class UpdateProposalItemDto extends PartialType(CreateProposalItemDto) {}