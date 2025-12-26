import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgenciesController } from './agencies.controller';
import { AgencyMembershipController } from './agency-membership.controller';
import { ResignationRequestController } from './resignation-request.controller';
import { ClientAssignmentController } from './client-assignment.controller';
import { AgenciesService } from './services/agencies.service';
import { AgencyMembershipService } from './services/agency-membership.service';
import { ResignationRequestService } from './services/resignation-request.service';
import { ClientAssignmentService } from './services/client-assignment.service';
import { AgencyUtilsService } from './services/agency-utils.service';
import { Agency } from './entities/agency.entity';
import { AgencyMembership } from './entities/agency-membership.entity';
import { ResignationRequest } from './entities/resignation-request.entity';
import { ClientAssignment } from './entities/client-assignment.entity';
import { User } from '../users/entities/user.entity';
import { Client } from '../clients/entities/client.entity';
import { AgencyRoleGuard } from '../common/guards/agency-role.guard';
import { AgencyPermissionGuard } from '../common/guards/agency-permission.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Agency,
      AgencyMembership,
      ResignationRequest,
      ClientAssignment,
      User,
      Client,
    ]),
  ],
  controllers: [
    AgenciesController,
    AgencyMembershipController,
    ResignationRequestController,
    ClientAssignmentController,
  ],
  providers: [
    AgenciesService,
    AgencyMembershipService,
    ResignationRequestService,
    ClientAssignmentService,
    AgencyUtilsService,
    AgencyRoleGuard,
    AgencyPermissionGuard,
  ],
  exports: [
    AgenciesService,
    AgencyMembershipService,
    ResignationRequestService,
    ClientAssignmentService,
    AgencyUtilsService,
  ],
})
export class AgenciesModule {}

