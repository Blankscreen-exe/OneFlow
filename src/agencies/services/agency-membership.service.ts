import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgencyMembership } from '../entities/agency-membership.entity';
import { User } from '../../users/entities/user.entity';
import { AgencyRole } from '../../common/enums/agency-role.enum';
import { AgencyPermission } from '../../common/enums/agency-permission.enum';
import { AgencyUtilsService } from './agency-utils.service';
import { InviteMemberDto } from '../dto/invite-member.dto';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class AgencyMembershipService {
  constructor(
    @InjectRepository(AgencyMembership)
    private agencyMembershipRepository: Repository<AgencyMembership>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private agencyUtilsService: AgencyUtilsService,
  ) {}

  /**
   * Invite a user to the agency (admin only)
   */
  async inviteMember(
    agencyId: string,
    inviterId: string,
    inviteDto: InviteMemberDto,
  ): Promise<AgencyMembership> {
    // Check if inviter has permission
    const hasPermission = await this.agencyUtilsService.hasAgencyPermission(
      inviterId,
      agencyId,
      AgencyPermission.MANAGE_MEMBERS,
    );
    if (!hasPermission) {
      throw new ForbiddenException('Only admins can invite members');
    }

    // Find the user to invite
    const userToInvite = await this.usersRepository.findOne({
      where: { email: inviteDto.email },
    });
    if (!userToInvite) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a member
    const existingMembership = await this.agencyMembershipRepository.findOne({
      where: { agencyId, userId: userToInvite.id },
    });
    if (existingMembership) {
      throw new ConflictException('User is already a member of this agency');
    }

    // Check if user already belongs to another agency
    if (userToInvite.agencyId && userToInvite.agencyId !== agencyId) {
      throw new BadRequestException('User already belongs to another agency');
    }

    // Check if user is a service provider
    if (userToInvite.role !== Role.SERVICE_PROVIDER) {
      throw new BadRequestException('Only service providers can join agencies');
    }

    // Create membership
    const membership = this.agencyMembershipRepository.create({
      agencyId,
      userId: userToInvite.id,
      role: inviteDto.role || AgencyRole.BUSINESS_DEVELOPER,
    });
    const savedMembership = await this.agencyMembershipRepository.save(membership);

    // Update user's agencyId
    userToInvite.agencyId = agencyId;
    await this.usersRepository.save(userToInvite);

    return savedMembership;
  }

  /**
   * Remove a member from the agency (admin only)
   */
  async removeMember(agencyId: string, removerId: string, memberId: string): Promise<void> {
    // Check if remover has permission
    const hasPermission = await this.agencyUtilsService.hasAgencyPermission(
      removerId,
      agencyId,
      AgencyPermission.MANAGE_MEMBERS,
    );
    if (!hasPermission) {
      throw new ForbiddenException('Only admins can remove members');
    }

    // Prevent removing self
    if (removerId === memberId) {
      throw new BadRequestException('Cannot remove yourself from the agency');
    }

    const membership = await this.agencyMembershipRepository.findOne({
      where: { agencyId, userId: memberId },
    });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Update user's agencyId
    const user = await this.usersRepository.findOne({ where: { id: memberId } });
    if (user) {
      user.agencyId = undefined;
      await this.usersRepository.save(user);
    }

    await this.agencyMembershipRepository.remove(membership);
  }

  /**
   * Get all members (filtered by role permissions)
   */
  async getMembers(agencyId: string, userId: string): Promise<AgencyMembership[]> {
    // Check if user is a member
    const isMember = await this.agencyUtilsService.isAgencyMember(userId, agencyId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this agency');
    }

    // Check if user can view employees
    const canViewEmployees = await this.agencyUtilsService.hasAgencyPermission(
      userId,
      agencyId,
      AgencyPermission.VIEW_EMPLOYEES,
    );

    // If user can't view employees, only return themselves
    if (!canViewEmployees) {
      const membership = await this.agencyMembershipRepository.findOne({
        where: { agencyId, userId },
        relations: ['user'],
      });
      return membership ? [membership] : [];
    }

    // Return all members
    return this.agencyMembershipRepository.find({
      where: { agencyId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Update member role (admin only)
   */
  async updateMemberRole(
    agencyId: string,
    updaterId: string,
    memberId: string,
    newRole: AgencyRole,
  ): Promise<AgencyMembership> {
    // Check if updater has permission
    const hasPermission = await this.agencyUtilsService.hasAgencyPermission(
      updaterId,
      agencyId,
      AgencyPermission.MANAGE_MEMBERS,
    );
    if (!hasPermission) {
      throw new ForbiddenException('Only admins can update member roles');
    }

    const membership = await this.agencyMembershipRepository.findOne({
      where: { agencyId, userId: memberId },
    });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    membership.role = newRole;
    return this.agencyMembershipRepository.save(membership);
  }

  /**
   * Promote a member to manager (admin only)
   */
  async assignManagerRole(
    agencyId: string,
    adminId: string,
    memberId: string,
  ): Promise<AgencyMembership> {
    // Check if admin has permission
    const hasPermission = await this.agencyUtilsService.hasAgencyPermission(
      adminId,
      agencyId,
      AgencyPermission.MANAGE_MANAGERS,
    );
    if (!hasPermission) {
      throw new ForbiddenException('Only admins can assign manager role');
    }

    return this.updateMemberRole(agencyId, adminId, memberId, AgencyRole.MANAGER);
  }

  /**
   * Assign BD role to a member (admin/manager)
   */
  async assignBDRole(
    agencyId: string,
    assignerId: string,
    memberId: string,
  ): Promise<AgencyMembership> {
    // Check if assigner has permission
    const hasPermission = await this.agencyUtilsService.hasAgencyPermission(
      assignerId,
      agencyId,
      AgencyPermission.MANAGE_BUSINESS_DEVELOPERS,
    );
    if (!hasPermission) {
      throw new ForbiddenException('Only admins and managers can assign BD role');
    }

    return this.updateMemberRole(agencyId, assignerId, memberId, AgencyRole.BUSINESS_DEVELOPER);
  }
}



