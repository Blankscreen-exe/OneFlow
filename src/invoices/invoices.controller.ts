import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { InvoiceAccessService } from './services/invoice-access.service';
import { Invoice } from './entities/invoice.entity';

@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoiceAccessService: InvoiceAccessService,
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
}

