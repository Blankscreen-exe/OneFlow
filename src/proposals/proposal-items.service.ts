import {
    Injectable,
    NotFoundException,
    ForbiddenException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { ProposalItem } from './entities/proposal-item.entity';
  import { Proposal, ProposalStatus } from './entities/proposal.entity';
  import { CreateProposalItemDto } from './dto/create-proposal-item.dto';
  import { UpdateProposalItemDto } from './dto/update-proposal-item.dto';
  import { ProposalsService } from './proposals.service';
  
  @Injectable()
  export class ProposalItemsService {
    constructor(
      @InjectRepository(ProposalItem)
      private proposalItemsRepository: Repository<ProposalItem>,
      @InjectRepository(Proposal)
      private proposalsRepository: Repository<Proposal>,
      private proposalsService: ProposalsService,
    ) {}
  
    /**
     * Validates that the proposal exists, belongs to the user, and is editable
     */
    private async validateProposal(
      proposalId: string,
      userId: string,
    ): Promise<Proposal> {
      const proposal = await this.proposalsRepository.findOne({
        where: { id: proposalId, userId },
      });
  
      if (!proposal) {
        throw new NotFoundException('Proposal not found');
      }
  
      if (proposal.status !== ProposalStatus.DRAFT) {
        throw new ForbiddenException(
          'Cannot modify items of a proposal that is not in draft status',
        );
      }
  
      return proposal;
    }
  
    /**
     * Calculates line item total
     */
    private calculateItemTotal(quantity: number, unitPrice: number): number {
      return Number((quantity * unitPrice).toFixed(2));
    }
  
    /**
     * Adds an item to a proposal
     */
    async create(
      proposalId: string,
      userId: string,
      createItemDto: CreateProposalItemDto,
    ): Promise<ProposalItem> {
      await this.validateProposal(proposalId, userId);
  
      const quantity = createItemDto.quantity ?? 1;
      const total = this.calculateItemTotal(quantity, createItemDto.unitPrice);
  
      const item = this.proposalItemsRepository.create({
        proposalId,
        description: createItemDto.description,
        quantity,
        unitPrice: createItemDto.unitPrice,
        total,
        sortOrder: createItemDto.sortOrder ?? 0,
      });
  
      const savedItem = await this.proposalItemsRepository.save(item);
  
      // Recalculate proposal totals
      await this.proposalsService.recalculateTotals(proposalId);
  
      return savedItem;
    }
  
    /**
     * Finds an item by ID
     */
    async findOne(
      proposalId: string,
      itemId: string,
      userId: string,
    ): Promise<ProposalItem> {
      // First validate the proposal belongs to the user
      await this.proposalsRepository.findOne({
        where: { id: proposalId, userId },
      });
  
      const item = await this.proposalItemsRepository.findOne({
        where: { id: itemId, proposalId },
      });
  
      if (!item) {
        throw new NotFoundException('Proposal item not found');
      }
  
      return item;
    }
  
    /**
     * Updates an item
     */
    async update(
      proposalId: string,
      itemId: string,
      userId: string,
      updateItemDto: UpdateProposalItemDto,
    ): Promise<ProposalItem> {
      await this.validateProposal(proposalId, userId);
  
      const item = await this.findOne(proposalId, itemId, userId);
  
      // Update fields
      if (updateItemDto.description !== undefined) {
        item.description = updateItemDto.description;
      }
      if (updateItemDto.quantity !== undefined) {
        item.quantity = updateItemDto.quantity;
      }
      if (updateItemDto.unitPrice !== undefined) {
        item.unitPrice = updateItemDto.unitPrice;
      }
      if (updateItemDto.sortOrder !== undefined) {
        item.sortOrder = updateItemDto.sortOrder;
      }
  
      // Recalculate item total
      item.total = this.calculateItemTotal(item.quantity, item.unitPrice);
  
      const savedItem = await this.proposalItemsRepository.save(item);
  
      // Recalculate proposal totals
      await this.proposalsService.recalculateTotals(proposalId);
  
      return savedItem;
    }
  
    /**
     * Removes an item from a proposal
     */
    async remove(
      proposalId: string,
      itemId: string,
      userId: string,
    ): Promise<void> {
      await this.validateProposal(proposalId, userId);
  
      const item = await this.findOne(proposalId, itemId, userId);
  
      await this.proposalItemsRepository.remove(item);
  
      // Recalculate proposal totals
      await this.proposalsService.recalculateTotals(proposalId);
    }
  }