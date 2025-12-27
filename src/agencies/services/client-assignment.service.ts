import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientAssignment } from '../entities/client-assignment.entity';
import { Client } from '../../clients/entities/client.entity';
import { AgencyPermission } from '../../common/enums/agency-permission.enum';
import { AgencyRole } from '../../common/enums/agency-role.enum';
import { AgencyUtilsService } from './agency-utils.service';

@Injectable()
export class ClientAssignmentService {
  constructor(
    @InjectRepository(ClientAssignment)
    private clientAssignmentRepository: Repository<ClientAssignment>,
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    private agencyUtilsService: AgencyUtilsService,
  ) {}

  /**
   * Assign a client to a Business Developer (manager/admin)
   */
  async assignClientToBD(
    agencyId: string,
    assignerId: string,
    clientId: string,
    bdId: string,
  ): Promise<ClientAssignment> {
    // Check if assigner has permission
    const hasPermission = await this.agencyUtilsService.hasAgencyPermission(
      assignerId,
      agencyId,
      AgencyPermission.ASSIGN_CLIENTS,
    );
    if (!hasPermission) {
      throw new ForbiddenException('Only managers and admins can assign clients');
    }

    // Verify client belongs to the agency
    const client = await this.clientsRepository.findOne({ where: { id: clientId } });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    if (client.agencyId !== agencyId) {
      throw new ForbiddenException('Client does not belong to this agency');
    }

    // Verify BD is a member and has BD role
    const bdRole = await this.agencyUtilsService.getUserAgencyRole(bdId, agencyId);
    if (!bdRole || bdRole !== AgencyRole.BUSINESS_DEVELOPER) {
      throw new BadRequestException('User is not a Business Developer in this agency');
    }

    // Check if client is already assigned
    const existingAssignment = await this.clientAssignmentRepository.findOne({
      where: { agencyId, clientId },
    });
    if (existingAssignment) {
      if (existingAssignment.businessDeveloperId === bdId) {
        throw new ConflictException('Client is already assigned to this Business Developer');
      }
      // Reassign to new BD
      existingAssignment.businessDeveloperId = bdId;
      existingAssignment.assignedById = assignerId;
      existingAssignment.assignedAt = new Date();
      return this.clientAssignmentRepository.save(existingAssignment);
    }

    // Create new assignment
    const assignment = this.clientAssignmentRepository.create({
      agencyId,
      clientId,
      businessDeveloperId: bdId,
      assignedById: assignerId,
    });

    return this.clientAssignmentRepository.save(assignment);
  }

  /**
   * Unassign a client (manager/admin)
   */
  async unassignClient(agencyId: string, unassignerId: string, clientId: string): Promise<void> {
    // Check if unassigner has permission
    const hasPermission = await this.agencyUtilsService.hasAgencyPermission(
      unassignerId,
      agencyId,
      AgencyPermission.ASSIGN_CLIENTS,
    );
    if (!hasPermission) {
      throw new ForbiddenException('Only managers and admins can unassign clients');
    }

    const assignment = await this.clientAssignmentRepository.findOne({
      where: { agencyId, clientId },
    });
    if (!assignment) {
      throw new NotFoundException('Client assignment not found');
    }

    await this.clientAssignmentRepository.remove(assignment);
  }

  /**
   * Get all clients assigned to a Business Developer
   */
  async getAssignedClients(agencyId: string, bdId: string): Promise<ClientAssignment[]> {
    return this.clientAssignmentRepository.find({
      where: { agencyId, businessDeveloperId: bdId },
      relations: ['client'],
      order: { assignedAt: 'DESC' },
    });
  }

  /**
   * Get who a client is assigned to
   */
  async getClientAssignment(
    agencyId: string,
    clientId: string,
  ): Promise<ClientAssignment | null> {
    return this.clientAssignmentRepository.findOne({
      where: { agencyId, clientId },
      relations: ['businessDeveloper', 'assignedBy'],
    });
  }

  /**
   * Validate that there's no overlap (one client per BD per agency)
   */
  async validateNoOverlap(agencyId: string, clientId: string, bdId: string): Promise<boolean> {
    const assignment = await this.clientAssignmentRepository.findOne({
      where: { agencyId, clientId },
    });
    if (!assignment) {
      return true; // No assignment exists, no overlap
    }
    return assignment.businessDeveloperId === bdId; // Only overlap if same BD
  }
}



