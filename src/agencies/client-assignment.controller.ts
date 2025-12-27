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
import { ClientAssignmentService } from './services/client-assignment.service';
import { AssignClientDto } from './dto/assign-client.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AgencyPermissionGuard } from '../common/guards/agency-permission.guard';
import { AgencyPermissions } from '../common/decorators/agency-permissions.decorator';
import { AgencyPermission } from '../common/enums/agency-permission.enum';
import { ClientAssignment } from './entities/client-assignment.entity';
import { Client } from '../clients/entities/client.entity';

@ApiTags('client-assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agencies/:agencyId/clients')
export class ClientAssignmentController {
  constructor(private readonly clientAssignmentService: ClientAssignmentService) {}

  @Post(':clientId/assign')
  @UseGuards(AgencyPermissionGuard)
  @AgencyPermissions(AgencyPermission.ASSIGN_CLIENTS)
  @ApiOperation({ summary: 'Assign client to Business Developer (manager/admin)' })
  @ApiResponse({ status: 201, description: 'Client assigned successfully', type: ClientAssignment })
  async assignClient(
    @Param('agencyId') agencyId: string,
    @Param('clientId') clientId: string,
    @CurrentUser() user: { id: string },
    @Body() assignDto: AssignClientDto,
  ): Promise<ClientAssignment> {
    return this.clientAssignmentService.assignClientToBD(
      agencyId,
      user.id,
      clientId,
      assignDto.businessDeveloperId,
    );
  }

  @Delete(':clientId/assign')
  @UseGuards(AgencyPermissionGuard)
  @AgencyPermissions(AgencyPermission.ASSIGN_CLIENTS)
  @ApiOperation({ summary: 'Unassign client (manager/admin)' })
  @ApiResponse({ status: 200, description: 'Client unassigned successfully' })
  async unassignClient(
    @Param('agencyId') agencyId: string,
    @Param('clientId') clientId: string,
    @CurrentUser() user: { id: string },
  ): Promise<void> {
    return this.clientAssignmentService.unassignClient(agencyId, user.id, clientId);
  }

  @Get('assigned')
  @ApiOperation({ summary: 'Get assigned clients (BD sees own, manager/admin sees all)' })
  @ApiResponse({ status: 200, description: 'List of assigned clients', type: [ClientAssignment] })
  async getAssignedClients(
    @Param('agencyId') agencyId: string,
    @CurrentUser() user: { id: string },
  ): Promise<ClientAssignment[]> {
    // For now, return all assignments. Service will filter based on role
    return this.clientAssignmentService.getAssignedClients(agencyId, user.id);
  }

  @Get('business-developers/:bdId/clients')
  @ApiOperation({ summary: 'Get all clients assigned to a specific Business Developer' })
  @ApiResponse({ status: 200, description: 'List of assigned clients', type: [ClientAssignment] })
  async getBDClients(
    @Param('agencyId') agencyId: string,
    @Param('bdId') bdId: string,
  ): Promise<ClientAssignment[]> {
    return this.clientAssignmentService.getAssignedClients(agencyId, bdId);
  }
}



