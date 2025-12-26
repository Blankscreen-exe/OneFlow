import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InvoiceAccessService } from './services/invoice-access.service';
import { InvoicesService } from './services/invoices.service';
import { Invoice } from './entities/invoice.entity';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { SendInvoiceDto } from './dto/send-invoice.dto';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoiceAccessService: InvoiceAccessService,
    private readonly invoicesService: InvoicesService,
  ) {}

  @Get('public/:token')
  @Public()
  @ApiOperation({ summary: 'Get invoice by access token (public, no auth)' })
  @ApiParam({ name: 'token', description: 'Access token' })
  @ApiQuery({ name: 'sp_id', required: false, description: 'Service Provider ID (optional, for context)' })
  @ApiResponse({ status: 200, description: 'Invoice details' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getPublicInvoice(
    @Param('token') token: string,
    @Query('sp_id') serviceProviderId?: string,
  ): Promise<Invoice> {
    const invoice = await this.invoiceAccessService.findByToken(token);
    
    if (serviceProviderId) {
      this.invoiceAccessService.validateAccess(invoice, serviceProviderId);
    }

    return invoice;
  }

  @Post('public/:token/pay')
  @Public()
  @ApiOperation({ summary: 'Pay invoice (public, no auth)' })
  @ApiParam({ name: 'token', description: 'Access token' })
  @ApiResponse({ status: 200, description: 'Payment link or redirect' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async payInvoice(@Param('token') token: string) {
    const invoice = await this.invoiceAccessService.findByToken(token);

    // TODO: Integrate with Stripe payment link
    // For now, return the invoice with payment link ID
    return {
      invoiceId: invoice.id,
      total: invoice.total,
      stripePaymentLinkId: invoice.stripePaymentLinkId,
      message: 'Payment link will be generated here',
    };
  }

  // ==================== AUTHENTICATED ENDPOINTS ====================

  @Post('from-proposal/:proposalId')
  @ApiOperation({ summary: 'Generate invoice from accepted proposal' })
  @ApiParam({ name: 'proposalId', description: 'Proposal UUID' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully', type: Invoice })
  @ApiResponse({ status: 400, description: 'Proposal not accepted or invoice already exists' })
  @ApiResponse({ status: 404, description: 'Proposal not found' })
  async createFromProposal(
    @Param('proposalId', ParseUUIDPipe) proposalId: string,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<Invoice> {
    return this.invoicesService.createFromProposal(proposalId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List invoices with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  async findAll(
    @CurrentUser() user: { id: string; email: string },
    @Query() query: InvoiceQueryDto,
  ) {
    return this.invoicesService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice details' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ status: 200, description: 'Invoice details', type: Invoice })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<Invoice> {
    return this.invoicesService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update invoice (only if DRAFT status)' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ status: 200, description: 'Invoice updated', type: Invoice })
  @ApiResponse({ status: 400, description: 'Invoice cannot be edited after sent' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; email: string },
    @Body() updateDto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    return this.invoicesService.update(id, user.id, updateDto);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send invoice (updates status to SENT and optionally sends email)' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ status: 200, description: 'Invoice sent', type: Invoice })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async send(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; email: string },
    @Body() sendDto: SendInvoiceDto,
  ): Promise<Invoice> {
    return this.invoicesService.send(id, user.id, sendDto.recipientEmail);
  }
}

