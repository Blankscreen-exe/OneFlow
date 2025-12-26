import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ResignationRequestService } from './services/resignation-request.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AgencyPermissionGuard } from '../common/guards/agency-permission.guard';
import { AgencyPermissions } from '../common/decorators/agency-permissions.decorator';
import { AgencyPermission } from '../common/enums/agency-permission.enum';
import { ResignationRequest } from './entities/resignation-request.entity';

@ApiTags('resignation-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agencies/:agencyId/resignations')
export class ResignationRequestController {
  constructor(private readonly resignationRequestService: ResignationRequestService) {}

  @Post()
  @ApiOperation({ summary: 'Request resignation from agency' })
  @ApiResponse({ status: 201, description: 'Resignation request submitted', type: ResignationRequest })
  async requestResignation(
    @Param('agencyId') agencyId: string,
    @CurrentUser() user: { id: string },
    @Body('message') message?: string,
  ): Promise<ResignationRequest> {
    return this.resignationRequestService.requestResignation(agencyId, user.id, message);
  }

  @Get()
  @UseGuards(AgencyPermissionGuard)
  @AgencyPermissions(AgencyPermission.PROCESS_RESIGNATIONS)
  @ApiOperation({ summary: 'Get resignation requests (admin only)' })
  @ApiResponse({ status: 200, description: 'List of resignation requests', type: [ResignationRequest] })
  async getResignationRequests(
    @Param('agencyId') agencyId: string,
    @CurrentUser() user: { id: string },
  ): Promise<ResignationRequest[]> {
    return this.resignationRequestService.getResignationRequests(agencyId, user.id);
  }

  @Post(':requestId/approve')
  @UseGuards(AgencyPermissionGuard)
  @AgencyPermissions(AgencyPermission.PROCESS_RESIGNATIONS)
  @ApiOperation({ summary: 'Approve resignation request (admin only)' })
  @ApiResponse({ status: 200, description: 'Resignation approved', type: ResignationRequest })
  async approveResignation(
    @Param('agencyId') agencyId: string,
    @Param('requestId') requestId: string,
    @CurrentUser() user: { id: string },
  ): Promise<ResignationRequest> {
    return this.resignationRequestService.processResignation(agencyId, user.id, requestId, 'approve');
  }

  @Post(':requestId/reject')
  @UseGuards(AgencyPermissionGuard)
  @AgencyPermissions(AgencyPermission.PROCESS_RESIGNATIONS)
  @ApiOperation({ summary: 'Reject resignation request (admin only)' })
  @ApiResponse({ status: 200, description: 'Resignation rejected', type: ResignationRequest })
  async rejectResignation(
    @Param('agencyId') agencyId: string,
    @Param('requestId') requestId: string,
    @CurrentUser() user: { id: string },
  ): Promise<ResignationRequest> {
    return this.resignationRequestService.processResignation(agencyId, user.id, requestId, 'reject');
  }

  @Delete(':requestId')
  @ApiOperation({ summary: 'Cancel own resignation request' })
  @ApiResponse({ status: 200, description: 'Resignation request cancelled' })
  async cancelResignationRequest(
    @Param('agencyId') agencyId: string,
    @Param('requestId') requestId: string,
    @CurrentUser() user: { id: string },
  ): Promise<void> {
    return this.resignationRequestService.cancelResignationRequest(agencyId, user.id, requestId);
  }
}

