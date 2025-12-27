import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  ParseUUIDPipe,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InvoicesService } from '../invoices/services/invoices.service';
import { PaymentService } from './services/payment.service';
import { StripeConnectService } from './services/stripe-connect.service';
import { StripeWebhookService } from './services/stripe-webhook.service';
import { StripeService } from './services/stripe.service';
import { Payment } from './entities/payment.entity';
import { CreatePaymentLinkDto } from './dto/create-payment-link.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { OnboardingResponseDto } from './dto/onboarding-response.dto';
import { UpdatePlatformFeeRateDto } from './dto/update-platform-fee-rate.dto';
import { StripeOnboardingStatus } from './enums/stripe-onboarding-status.enum';
import { InvoiceStatus } from '../invoices/entities/invoice.entity';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly paymentService: PaymentService,
    private readonly stripeConnectService: StripeConnectService,
    private readonly stripeWebhookService: StripeWebhookService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('invoices/:id/create-payment-link')
  @ApiOperation({ summary: 'Create payment link for an invoice' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ status: 200, description: 'Payment link created', schema: { type: 'object', properties: { url: { type: 'string' } } } })
  @ApiResponse({ status: 400, description: 'Invoice not in SENT status or Stripe account not set up' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async createPaymentLink(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; email: string },
    @Body() createPaymentLinkDto: CreatePaymentLinkDto,
  ): Promise<{ url: string }> {
    const invoice = await this.invoicesService.findOne(id, user.id);

    if (invoice.status !== InvoiceStatus.SENT) {
      throw new BadRequestException('Payment link can only be created for invoices in SENT status');
    }

    // Get connected account for invoice
    const connectedAccountId = await this.paymentService.getConnectedAccountForInvoice(invoice);

    // Check if account is active
    const accountStatus = await this.stripeService.getAccountStatus(connectedAccountId);
    if (accountStatus !== StripeOnboardingStatus.ACTIVE) {
      throw new BadRequestException(
        'Stripe account is not active. Please complete onboarding first.',
      );
    }

    // Get platform fee rate
    const userOrAgency = invoice.agencyId
      ? await this.paymentService['agenciesRepository'].findOne({
          where: { id: invoice.agencyId },
        })
      : await this.paymentService['usersRepository'].findOne({
          where: { id: invoice.userId },
        });

    if (!userOrAgency) {
      throw new BadRequestException('User or agency not found');
    }

    const platformFeeRate = this.stripeConnectService.getPlatformFeeRate(userOrAgency);

    // Create payment link
    const paymentUrl = await this.stripeService.createPaymentLink(
      invoice,
      connectedAccountId,
      platformFeeRate,
      createPaymentLinkDto.returnUrl,
    );

    // Update invoice with payment link
    await this.invoicesService['invoicesRepository'].update(invoice.id, {
      stripePaymentLinkId: paymentUrl,
    });

    return { url: paymentUrl };
  }

  @Get('invoices/:id/payments')
  @ApiOperation({ summary: 'Get payment history for an invoice' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ status: 200, description: 'Payment history', type: [Payment] })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getPaymentsByInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<Payment[]> {
    // Verify invoice ownership
    await this.invoicesService.findOne(id, user.id);
    return this.paymentService.getPaymentsByInvoice(id);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Process a refund for a payment' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 200, description: 'Refund processed', type: Payment })
  @ApiResponse({ status: 400, description: 'Invalid refund request' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async refundPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; email: string },
    @Body() refundPaymentDto: RefundPaymentDto,
  ): Promise<Payment> {
    const payment = await this.paymentService['paymentsRepository'].findOne({
      where: { id },
      relations: ['invoice'],
    });

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    // Verify invoice ownership
    await this.invoicesService.findOne(payment.invoiceId, user.id);

    return this.paymentService.processRefund(
      id,
      refundPaymentDto.amount,
      refundPaymentDto.reason,
    );
  }

  @Post('stripe/onboard')
  @ApiOperation({ summary: 'Initiate user Stripe onboarding' })
  @ApiResponse({ status: 200, description: 'Onboarding initiated', type: OnboardingResponseDto })
  async initiateUserOnboarding(
    @CurrentUser() user: { id: string; email: string },
    @Body() body?: { returnUrl?: string },
  ): Promise<OnboardingResponseDto> {
    return this.stripeConnectService.initiateOnboarding(user.id, body?.returnUrl);
  }

  @Post('agencies/:id/stripe/onboard')
  @ApiOperation({ summary: 'Initiate agency Stripe onboarding (admin only)' })
  @ApiParam({ name: 'id', description: 'Agency UUID' })
  @ApiResponse({ status: 200, description: 'Onboarding initiated', type: OnboardingResponseDto })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  async initiateAgencyOnboarding(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; email: string },
    @Body() body?: { returnUrl?: string },
  ): Promise<OnboardingResponseDto> {
    return this.stripeConnectService.initiateAgencyOnboarding(id, user.id, body?.returnUrl);
  }

  @Get('stripe/onboarding-status')
  @ApiOperation({ summary: 'Check user Stripe onboarding status' })
  @ApiResponse({ status: 200, description: 'Onboarding status' })
  async checkUserOnboardingStatus(
    @CurrentUser() user: { id: string; email: string },
  ): Promise<{ status: StripeOnboardingStatus }> {
    const status = await this.stripeConnectService.checkOnboardingStatus(user.id);
    return { status };
  }

  @Get('agencies/:id/stripe/onboarding-status')
  @ApiOperation({ summary: 'Check agency Stripe onboarding status' })
  @ApiParam({ name: 'id', description: 'Agency UUID' })
  @ApiResponse({ status: 200, description: 'Onboarding status' })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  async checkAgencyOnboardingStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<{ status: StripeOnboardingStatus }> {
    const status = await this.stripeConnectService.checkAgencyOnboardingStatus(id, user.id);
    return { status };
  }

  @Patch('users/profile/platform-fee-rate')
  @ApiOperation({ summary: 'Update user platform fee rate' })
  @ApiResponse({ status: 200, description: 'Platform fee rate updated' })
  async updateUserPlatformFeeRate(
    @CurrentUser() user: { id: string; email: string },
    @Body() updatePlatformFeeRateDto: UpdatePlatformFeeRateDto,
  ): Promise<{ message: string }> {
    await this.paymentService['usersRepository'].update(user.id, {
      platformFeeRate: updatePlatformFeeRateDto.platformFeeRate,
    });
    return { message: 'Platform fee rate updated successfully' };
  }

  @Patch('agencies/:id/platform-fee-rate')
  @ApiOperation({ summary: 'Update agency platform fee rate (admin only)' })
  @ApiParam({ name: 'id', description: 'Agency UUID' })
  @ApiResponse({ status: 200, description: 'Platform fee rate updated' })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  async updateAgencyPlatformFeeRate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; email: string },
    @Body() updatePlatformFeeRateDto: UpdatePlatformFeeRateDto,
  ): Promise<{ message: string }> {
    const agency = await this.paymentService['agenciesRepository'].findOne({
      where: { id, createdById: user.id },
    });

    if (!agency) {
      throw new BadRequestException('Agency not found or you are not the admin');
    }

    await this.paymentService['agenciesRepository'].update(id, {
      platformFeeRate: updatePlatformFeeRateDto.platformFeeRate,
    });
    return { message: 'Platform fee rate updated successfully' };
  }

  @Post('webhooks/stripe')
  @Public()
  @ApiOperation({ summary: 'Stripe webhook endpoint (public)' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleStripeWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature header');
    }

    // Get raw body (should be set by middleware)
    const rawBody = (req as any).rawBody || req.body;
    if (!rawBody) {
      throw new BadRequestException('Raw body not available');
    }

    // Verify signature and construct event
    const event = this.stripeService.verifyWebhookSignature(
      rawBody,
      signature,
    );

    // Process webhook event
    await this.stripeWebhookService.handleWebhookEvent(event);

    return { received: true };
  }
}

