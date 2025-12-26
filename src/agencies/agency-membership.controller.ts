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
import { AgencyMembershipService } from './services/agency-membership.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AgencyPermissionGuard } from '../common/guards/agency-permission.guard';
import { AgencyPermissions } from '../common/decorators/agency-permissions.decorator';
import { AgencyPermission } from '../common/enums/agency-permission.enum';
import { AgencyRole } from '../common/enums/agency-role.enum';
import { AgencyMembership } from './entities/agency-membership.entity';

@ApiTags('agency-membership')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agencies/:agencyId/members')
export class AgencyMembershipController {
  constructor(private readonly agencyMembershipService: AgencyMembershipService) {}

  @Post('invite')
  @UseGuards(AgencyPermissionGuard)
  @AgencyPermissions(AgencyPermission.MANAGE_MEMBERS)
  @ApiOperation({ summary: 'Invite a member to the agency (admin only)' })
  @ApiResponse({ status: 201, description: 'Member invited successfully', type: AgencyMembership })
  @ApiResponse({ status: 403, description: 'Only admins can invite members' })
  async inviteMember(
    @Param('agencyId') agencyId: string,
    @CurrentUser() user: { id: string },
    @Body() inviteDto: InviteMemberDto,
  ): Promise<AgencyMembership> {
    return this.agencyMembershipService.inviteMember(agencyId, user.id, inviteDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all members' })
  @ApiResponse({ status: 200, description: 'List of members', type: [AgencyMembership] })
  async getMembers(
    @Param('agencyId') agencyId: string,
    @CurrentUser() user: { id: string },
  ): Promise<AgencyMembership[]> {
    return this.agencyMembershipService.getMembers(agencyId, user.id);
  }

  @Patch(':memberId/role')
  @UseGuards(AgencyPermissionGuard)
  @AgencyPermissions(AgencyPermission.MANAGE_MEMBERS)
  @ApiOperation({ summary: 'Update member role (admin only)' })
  @ApiResponse({ status: 200, description: 'Role updated successfully', type: AgencyMembership })
  async updateMemberRole(
    @Param('agencyId') agencyId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: { id: string },
    @Body('role') newRole: AgencyRole,
  ): Promise<AgencyMembership> {
    return this.agencyMembershipService.updateMemberRole(agencyId, user.id, memberId, newRole);
  }

  @Delete(':memberId')
  @UseGuards(AgencyPermissionGuard)
  @AgencyPermissions(AgencyPermission.MANAGE_MEMBERS)
  @ApiOperation({ summary: 'Remove member from agency (admin only)' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  async removeMember(
    @Param('agencyId') agencyId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: { id: string },
  ): Promise<void> {
    return this.agencyMembershipService.removeMember(agencyId, user.id, memberId);
  }

  @Post(':memberId/promote-manager')
  @UseGuards(AgencyPermissionGuard)
  @AgencyPermissions(AgencyPermission.MANAGE_MANAGERS)
  @ApiOperation({ summary: 'Promote member to manager (admin only)' })
  @ApiResponse({ status: 200, description: 'Member promoted to manager', type: AgencyMembership })
  async promoteManager(
    @Param('agencyId') agencyId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: { id: string },
  ): Promise<AgencyMembership> {
    return this.agencyMembershipService.assignManagerRole(agencyId, user.id, memberId);
  }

  @Post(':memberId/assign-bd')
  @UseGuards(AgencyPermissionGuard)
  @AgencyPermissions(AgencyPermission.MANAGE_BUSINESS_DEVELOPERS)
  @ApiOperation({ summary: 'Assign BD role to member (admin/manager)' })
  @ApiResponse({ status: 200, description: 'BD role assigned', type: AgencyMembership })
  async assignBDRole(
    @Param('agencyId') agencyId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: { id: string },
  ): Promise<AgencyMembership> {
    return this.agencyMembershipService.assignBDRole(agencyId, user.id, memberId);
  }
}

