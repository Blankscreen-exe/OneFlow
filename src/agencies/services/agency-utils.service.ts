import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AgencyMembership } from '../entities/agency-membership.entity';
import { AgencyRole } from '../../common/enums/agency-role.enum';
import { AgencyPermission } from '../../common/enums/agency-permission.enum';
import { getAgencyPermissionsForRole, agencyRoleHasPermission } from '../../common/config/agency-permissions.config';
import { ClientAssignment } from '../entities/client-assignment.entity';

@Injectable()
export class AgencyUtilsService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(AgencyMembership)
    private agencyMembershipRepository: Repository<AgencyMembership>,
    @InjectRepository(ClientAssignment)
    private clientAssignmentRepository: Repository<ClientAssignment>,
  ) {}

  /**
   * Get user's agency
   */
  async getUserAgency(userId: string): Promise<string | null> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'agencyId'],
    });
    return user?.agencyId || null;
  }

  /**
   * Get user's role in an agency
   */
  async getUserAgencyRole(userId: string, agencyId: string): Promise<AgencyRole | null> {
    const membership = await this.agencyMembershipRepository.findOne({
      where: { userId, agencyId },
    });
    return membership?.role || null;
  }

  /**
   * Check if user has a specific permission in an agency
   */
  async hasAgencyPermission(
    userId: string,
    agencyId: string,
    permission: AgencyPermission,
  ): Promise<boolean> {
    const role = await this.getUserAgencyRole(userId, agencyId);
    if (!role) {
      return false;
    }
    return agencyRoleHasPermission(role, permission);
  }

  /**
   * Check if a Business Developer can access a specific client
   */
  async canAccessClient(userId: string, agencyId: string, clientId: string): Promise<boolean> {
    const role = await this.getUserAgencyRole(userId, agencyId);
    if (!role) {
      return false;
    }

    // Admin and Manager can access all clients
    if (role === AgencyRole.ADMIN || role === AgencyRole.MANAGER) {
      return true;
    }

    // Business Developer can only access assigned clients
    if (role === AgencyRole.BUSINESS_DEVELOPER) {
      const assignment = await this.clientAssignmentRepository.findOne({
        where: { agencyId, clientId, businessDeveloperId: userId },
      });
      return !!assignment;
    }

    return false;
  }

  /**
   * Check if user is a member of an agency
   */
  async isAgencyMember(userId: string, agencyId: string): Promise<boolean> {
    const membership = await this.agencyMembershipRepository.findOne({
      where: { userId, agencyId },
    });
    return !!membership;
  }

  /**
   * Check if user is an admin of an agency
   */
  async isAgencyAdmin(userId: string, agencyId: string): Promise<boolean> {
    const role = await this.getUserAgencyRole(userId, agencyId);
    return role === AgencyRole.ADMIN;
  }

  /**
   * Get all client IDs assigned to a Business Developer
   */
  async getAssignedClientIds(agencyId: string, bdId: string): Promise<string[]> {
    const assignments = await this.clientAssignmentRepository.find({
      where: { agencyId, businessDeveloperId: bdId },
      select: ['clientId'],
    });
    return assignments.map(a => a.clientId);
  }
}

