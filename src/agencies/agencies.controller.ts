import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AgenciesService } from './services/agencies.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AgencyPermissionGuard } from '../common/guards/agency-permission.guard';
import { AgencyPermissions } from '../common/decorators/agency-permissions.decorator';
import { AgencyPermission } from '../common/enums/agency-permission.enum';
import { Agency } from './entities/agency.entity';

@ApiTags('agencies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agency' })
  @ApiResponse({ status: 201, description: 'Agency created successfully', type: Agency })
  @ApiResponse({ status: 400, description: 'User already belongs to an agency' })
  async createAgency(
    @CurrentUser() user: { id: string },
    @Body() createAgencyDto: CreateAgencyDto,
  ): Promise<Agency> {
    return this.agenciesService.createAgency(user.id, createAgencyDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get user\'s agency' })
  @ApiResponse({ status: 200, description: 'Agency details', type: Agency })
  @ApiResponse({ status: 404, description: 'User does not belong to an agency' })
  async getMyAgency(@CurrentUser() user: { id: string }): Promise<Agency | null> {
    return this.agenciesService.getUserAgency(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agency details' })
  @ApiResponse({ status: 200, description: 'Agency details', type: Agency })
  @ApiResponse({ status: 403, description: 'Not a member of this agency' })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  async getAgency(
    @Param('id') agencyId: string,
    @CurrentUser() user: { id: string },
  ): Promise<Agency> {
    return this.agenciesService.getAgency(agencyId, user.id);
  }

  @Patch(':id')
  @UseGuards(AgencyPermissionGuard)
  @AgencyPermissions(AgencyPermission.MANAGE_AGENCY_SETTINGS)
  @ApiOperation({ summary: 'Update agency (admin only)' })
  @ApiResponse({ status: 200, description: 'Agency updated successfully', type: Agency })
  @ApiResponse({ status: 403, description: 'Only admins can update agency' })
  async updateAgency(
    @Param('id') agencyId: string,
    @CurrentUser() user: { id: string },
    @Body() updateAgencyDto: UpdateAgencyDto,
  ): Promise<Agency> {
    return this.agenciesService.updateAgency(agencyId, user.id, updateAgencyDto);
  }

  @Delete(':id')
  @UseGuards(AgencyPermissionGuard)
  @AgencyPermissions(AgencyPermission.MANAGE_AGENCY_SETTINGS)
  @ApiOperation({ summary: 'Delete agency (admin only)' })
  @ApiResponse({ status: 200, description: 'Agency deleted successfully' })
  @ApiResponse({ status: 403, description: 'Only admins can delete agency' })
  async deleteAgency(
    @Param('id') agencyId: string,
    @CurrentUser() user: { id: string },
  ): Promise<void> {
    return this.agenciesService.deleteAgency(agencyId, user.id);
  }
}




