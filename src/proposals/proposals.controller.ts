import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
  } from '@nestjs/swagger';
  import { ProposalsService } from './proposals.service';
  import { ProposalItemsService } from './proposal-items.service';
  import { CreateProposalDto } from './dto/create-proposal.dto';
  import { UpdateProposalDto } from './dto/update-proposal.dto';
  import { CreateProposalItemDto } from './dto/create-proposal-item.dto';
  import { UpdateProposalItemDto } from './dto/update-proposal-item.dto';
  import { ProposalQueryDto } from './dto/proposal-query.dto';
  import { SendProposalDto } from './dto/send-proposal.dto';
  import { CurrentUser } from '../common/decorators/current-user.decorator';
  
  @ApiTags('proposals')
  @ApiBearerAuth()
  @Controller('proposals')
  export class ProposalsController {
    constructor(
      private readonly proposalsService: ProposalsService,
      private readonly proposalItemsService: ProposalItemsService,
    ) {}
  
    // ==================== PROPOSAL ENDPOINTS ====================
  
    @Post()
    @ApiOperation({ summary: 'Create a new proposal' })
    @ApiResponse({ status: 201, description: 'Proposal created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    create(
      @CurrentUser() user: { id: string; email: string },
      @Body() createProposalDto: CreateProposalDto,
    ) {
      return this.proposalsService.create(user.id, createProposalDto);
    }
  
    @Get()
    @ApiOperation({ summary: 'Get all proposals with pagination and filters' })
    @ApiResponse({ status: 200, description: 'List of proposals' })
    findAll(
      @CurrentUser() user: { id: string; email: string },
      @Query() query: ProposalQueryDto,
    ) {
      return this.proposalsService.findAll(user.id, query);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get a proposal by ID' })
    @ApiParam({ name: 'id', description: 'Proposal UUID' })
    @ApiResponse({ status: 200, description: 'Proposal details' })
    @ApiResponse({ status: 404, description: 'Proposal not found' })
    findOne(
      @Param('id', ParseUUIDPipe) id: string,
      @CurrentUser() user: { id: string; email: string },
    ) {
      return this.proposalsService.findOne(id, user.id);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update a proposal (draft only)' })
    @ApiParam({ name: 'id', description: 'Proposal UUID' })
    @ApiResponse({ status: 200, description: 'Proposal updated' })
    @ApiResponse({ status: 403, description: 'Cannot edit non-draft proposal' })
    @ApiResponse({ status: 404, description: 'Proposal not found' })
    update(
      @Param('id', ParseUUIDPipe) id: string,
      @CurrentUser() user: { id: string; email: string },
      @Body() updateProposalDto: UpdateProposalDto,
    ) {
      return this.proposalsService.update(id, user.id, updateProposalDto);
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a proposal (draft only)' })
    @ApiParam({ name: 'id', description: 'Proposal UUID' })
    @ApiResponse({ status: 204, description: 'Proposal deleted' })
    @ApiResponse({ status: 403, description: 'Cannot delete non-draft proposal' })
    @ApiResponse({ status: 404, description: 'Proposal not found' })
    remove(
      @Param('id', ParseUUIDPipe) id: string,
      @CurrentUser() user: { id: string; email: string },
    ) {
      return this.proposalsService.remove(id, user.id);
    }
  
    // ==================== STATUS TRANSITION ENDPOINTS ====================
  
    @Post(':id/send')
    @ApiOperation({ summary: 'Send a proposal to the client' })
    @ApiParam({ name: 'id', description: 'Proposal UUID' })
    @ApiResponse({ status: 200, description: 'Proposal sent' })
    @ApiResponse({ status: 400, description: 'Invalid status transition or invalid contact IDs' })
    send(
      @Param('id', ParseUUIDPipe) id: string,
      @CurrentUser() user: { id: string; email: string },
      @Body() sendProposalDto: SendProposalDto,
    ) {
      return this.proposalsService.send(
        id,
        user.id,
        sendProposalDto.contactIds ?? [],
      );
    }
  
    @Post(':id/accept')
    @ApiOperation({ summary: 'Accept a proposal' })
    @ApiParam({ name: 'id', description: 'Proposal UUID' })
    @ApiResponse({ status: 200, description: 'Proposal accepted' })
    @ApiResponse({ status: 400, description: 'Invalid status transition' })
    accept(
      @Param('id', ParseUUIDPipe) id: string,
      @CurrentUser() user: { id: string; email: string },
    ) {
      return this.proposalsService.accept(id, user.id);
    }
  
    @Post(':id/reject')
    @ApiOperation({ summary: 'Reject a proposal' })
    @ApiParam({ name: 'id', description: 'Proposal UUID' })
    @ApiResponse({ status: 200, description: 'Proposal rejected' })
    @ApiResponse({ status: 400, description: 'Invalid status transition' })
    reject(
      @Param('id', ParseUUIDPipe) id: string,
      @CurrentUser() user: { id: string; email: string },
    ) {
      return this.proposalsService.reject(id, user.id);
    }
  
    // ==================== PROPOSAL ITEM ENDPOINTS ====================
  
    @Post(':id/items')
    @ApiOperation({ summary: 'Add an item to a proposal' })
    @ApiParam({ name: 'id', description: 'Proposal UUID' })
    @ApiResponse({ status: 201, description: 'Item added' })
    @ApiResponse({ status: 403, description: 'Cannot modify non-draft proposal' })
    addItem(
      @Param('id', ParseUUIDPipe) id: string,
      @CurrentUser() user: { id: string; email: string },
      @Body() createItemDto: CreateProposalItemDto,
    ) {
      return this.proposalItemsService.create(id, user.id, createItemDto);
    }
  
    @Patch(':id/items/:itemId')
    @ApiOperation({ summary: 'Update a proposal item' })
    @ApiParam({ name: 'id', description: 'Proposal UUID' })
    @ApiParam({ name: 'itemId', description: 'Item UUID' })
    @ApiResponse({ status: 200, description: 'Item updated' })
    @ApiResponse({ status: 403, description: 'Cannot modify non-draft proposal' })
    @ApiResponse({ status: 404, description: 'Item not found' })
    updateItem(
      @Param('id', ParseUUIDPipe) id: string,
      @Param('itemId', ParseUUIDPipe) itemId: string,
      @CurrentUser() user: { id: string; email: string },
      @Body() updateItemDto: UpdateProposalItemDto,
    ) {
      return this.proposalItemsService.update(id, itemId, user.id, updateItemDto);
    }
  
    @Delete(':id/items/:itemId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove an item from a proposal' })
    @ApiParam({ name: 'id', description: 'Proposal UUID' })
    @ApiParam({ name: 'itemId', description: 'Item UUID' })
    @ApiResponse({ status: 204, description: 'Item removed' })
    @ApiResponse({ status: 403, description: 'Cannot modify non-draft proposal' })
    @ApiResponse({ status: 404, description: 'Item not found' })
    removeItem(
      @Param('id', ParseUUIDPipe) id: string,
      @Param('itemId', ParseUUIDPipe) itemId: string,
      @CurrentUser() user: { id: string; email: string },
    ) {
      return this.proposalItemsService.remove(id, itemId, user.id);
    }
  }