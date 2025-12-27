import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agency } from '../entities/agency.entity';
import { AgencyMembership } from '../entities/agency-membership.entity';
import { User } from '../../users/entities/user.entity';
import { AgencyRole } from '../../common/enums/agency-role.enum';
import { CreateAgencyDto } from '../dto/create-agency.dto';
import { UpdateAgencyDto } from '../dto/update-agency.dto';
import { AgencyUtilsService } from './agency-utils.service';
import { AgencyPermission } from '../../common/enums/agency-permission.enum';

@Injectable()
export class AgenciesService {
  constructor(
    @InjectRepository(Agency)
    private agenciesRepository: Repository<Agency>,
    @InjectRepository(AgencyMembership)
    private agencyMembershipRepository: Repository<AgencyMembership>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private agencyUtilsService: AgencyUtilsService,
  ) {}

  /**
   * Create a new agency and make the creator an admin
   */
  async createAgency(userId: string, createAgencyDto: CreateAgencyDto): Promise<Agency> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already belongs to an agency
    if (user.agencyId) {
      throw new BadRequestException('User already belongs to an agency');
    }

    // Create the agency
    const agency = this.agenciesRepository.create({
      ...createAgencyDto,
      createdById: userId,
    });
    const savedAgency = await this.agenciesRepository.save(agency);

    // Create membership with admin role
    const membership = this.agencyMembershipRepository.create({
      agencyId: savedAgency.id,
      userId: userId,
      role: AgencyRole.ADMIN,
    });
    await this.agencyMembershipRepository.save(membership);

    // Update user's agencyId
    user.agencyId = savedAgency.id;
    await this.usersRepository.save(user);

    return savedAgency;
  }

  /**
   * Update agency (admin only)
   */
  async updateAgency(
    agencyId: string,
    userId: string,
    updateAgencyDto: UpdateAgencyDto,
  ): Promise<Agency> {
    const agency = await this.agenciesRepository.findOne({ where: { id: agencyId } });
    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    // Check if user is admin
    const hasPermission = await this.agencyUtilsService.hasAgencyPermission(
      userId,
      agencyId,
      AgencyPermission.MANAGE_AGENCY_SETTINGS,
    );
    if (!hasPermission) {
      throw new ForbiddenException('Only agency admins can update agency settings');
    }

    Object.assign(agency, updateAgencyDto);
    return this.agenciesRepository.save(agency);
  }

  /**
   * Get agency details (members only)
   */
  async getAgency(agencyId: string, userId: string): Promise<Agency> {
    const agency = await this.agenciesRepository.findOne({ where: { id: agencyId } });
    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    // Check if user is a member
    const isMember = await this.agencyUtilsService.isAgencyMember(userId, agencyId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this agency');
    }

    return agency;
  }

  /**
   * Get user's agency
   */
  async getUserAgency(userId: string): Promise<Agency | null> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['agency'],
    });
    return user?.agency || null;
  }

  /**
   * Delete agency (admin only, requires validation)
   */
  async deleteAgency(agencyId: string, userId: string): Promise<void> {
    const agency = await this.agenciesRepository.findOne({ where: { id: agencyId } });
    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    // Check if user is admin
    const isAdmin = await this.agencyUtilsService.isAgencyAdmin(userId, agencyId);
    if (!isAdmin) {
      throw new ForbiddenException('Only agency admins can delete the agency');
    }

    // TODO: Add validation logic (e.g., check for pending invoices, etc.)
    // For now, we'll allow deletion

    await this.agenciesRepository.remove(agency);
  }
}



