import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ClientPortalService } from './services/client-portal.service';

@ApiTags('client-portal')
@ApiBearerAuth()
@Controller('clients/me')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CLIENT)
export class ClientPortalController {
  constructor(private readonly clientPortalService: ClientPortalService) {}

  @Get('invoices')
  @ApiOperation({ summary: 'Get all invoices from all linked service providers' })
  @ApiQuery({ name: 'sp_id', required: false, description: 'Filter by service provider ID' })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  getInvoices(
    @CurrentUser() user: { id: string; email: string; role: Role },
    @Query('sp_id') serviceProviderId?: string,
  ) {
    return this.clientPortalService.getInvoicesForClient(
      user.id,
      serviceProviderId,
    );
  }

  @Get('proposals')
  @ApiOperation({ summary: 'Get all proposals from all linked service providers' })
  @ApiQuery({ name: 'sp_id', required: false, description: 'Filter by service provider ID' })
  @ApiResponse({ status: 200, description: 'List of proposals' })
  getProposals(
    @CurrentUser() user: { id: string; email: string; role: Role },
    @Query('sp_id') serviceProviderId?: string,
  ) {
    return this.clientPortalService.getProposalsForClient(
      user.id,
      serviceProviderId,
    );
  }

  @Get('service-providers')
  @ApiOperation({ summary: 'Get all linked service providers' })
  @ApiResponse({ status: 200, description: 'List of service providers' })
  getServiceProviders(@CurrentUser() user: { id: string; email: string; role: Role }) {
    return this.clientPortalService.getServiceProvidersForClient(user.id);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get client dashboard summary' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  getDashboard(@CurrentUser() user: { id: string; email: string; role: Role }) {
    return this.clientPortalService.getDashboardData(user.id);
  }

  @Post('link-service-provider')
  @ApiOperation({ summary: 'Link an additional service provider to client account' })
  @ApiResponse({ status: 201, description: 'Service provider linked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid service provider' })
  @ApiResponse({ status: 409, description: 'Already linked to this service provider' })
  linkServiceProvider(
    @CurrentUser() user: { id: string; email: string; role: Role },
    @Body() body: { serviceProviderId: string },
  ) {
    return this.clientPortalService.linkToServiceProvider(
      user.id,
      body.serviceProviderId,
    );
  }
}

