import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResignationRequest, ResignationRequestStatus } from '../entities/resignation-request.entity';
import { AgencyPermission } from '../../common/enums/agency-permission.enum';
import { AgencyUtilsService } from './agency-utils.service';

@Injectable()
export class ResignationRequestService {
  constructor(
    @InjectRepository(ResignationRequest)
    private resignationRequestRepository: Repository<ResignationRequest>,
    private agencyUtilsService: AgencyUtilsService,
  ) {}

  /**
   * Submit a resignation request
   */
  async requestResignation(
    agencyId: string,
    userId: string,
    message?: string,
  ): Promise<ResignationRequest> {
    // Check if user is a member
    const isMember = await this.agencyUtilsService.isAgencyMember(userId, agencyId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this agency');
    }

    // Check if there's already a pending request
    const existingRequest = await this.resignationRequestRepository.findOne({
      where: { agencyId, userId, status: ResignationRequestStatus.PENDING },
    });
    if (existingRequest) {
      throw new BadRequestException('You already have a pending resignation request');
    }

    const request = this.resignationRequestRepository.create({
      agencyId,
      userId,
      message,
      status: ResignationRequestStatus.PENDING,
    });

    return this.resignationRequestRepository.save(request);
  }

  /**
   * Get resignation requests (admin only)
   */
  async getResignationRequests(
    agencyId: string,
    userId: string,
  ): Promise<ResignationRequest[]> {
    // Check if user has permission
    const hasPermission = await this.agencyUtilsService.hasAgencyPermission(
      userId,
      agencyId,
      AgencyPermission.PROCESS_RESIGNATIONS,
    );
    if (!hasPermission) {
      throw new ForbiddenException('Only admins can view resignation requests');
    }

    return this.resignationRequestRepository.find({
      where: { agencyId },
      relations: ['user', 'processedBy'],
      order: { requestedAt: 'DESC' },
    });
  }

  /**
   * Process a resignation request (approve/reject) - admin only
   */
  async processResignation(
    agencyId: string,
    adminId: string,
    requestId: string,
    action: 'approve' | 'reject',
  ): Promise<ResignationRequest> {
    // Check if admin has permission
    const hasPermission = await this.agencyUtilsService.hasAgencyPermission(
      adminId,
      agencyId,
      AgencyPermission.PROCESS_RESIGNATIONS,
    );
    if (!hasPermission) {
      throw new ForbiddenException('Only admins can process resignation requests');
    }

    const request = await this.resignationRequestRepository.findOne({
      where: { id: requestId, agencyId },
    });
    if (!request) {
      throw new NotFoundException('Resignation request not found');
    }

    if (request.status !== ResignationRequestStatus.PENDING) {
      throw new BadRequestException('This resignation request has already been processed');
    }

    if (action === 'approve') {
      request.status = ResignationRequestStatus.APPROVED;
      // TODO: Remove user from agency membership and update user's agencyId
      // This should be handled by the membership service
    } else {
      request.status = ResignationRequestStatus.REJECTED;
    }

    request.processedAt = new Date();
    request.processedById = adminId;

    return this.resignationRequestRepository.save(request);
  }

  /**
   * Cancel own resignation request
   */
  async cancelResignationRequest(
    agencyId: string,
    userId: string,
    requestId: string,
  ): Promise<void> {
    const request = await this.resignationRequestRepository.findOne({
      where: { id: requestId, agencyId, userId },
    });
    if (!request) {
      throw new NotFoundException('Resignation request not found');
    }

    if (request.status !== ResignationRequestStatus.PENDING) {
      throw new BadRequestException('Cannot cancel a processed resignation request');
    }

    await this.resignationRequestRepository.remove(request);
  }
}




