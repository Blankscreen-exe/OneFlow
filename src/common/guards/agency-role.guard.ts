import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AgencyRole } from '../enums/agency-role.enum';
import { AGENCY_ROLES_KEY } from '../decorators/agency-roles.decorator';
import { AgencyUtilsService } from '../../agencies/services/agency-utils.service';

@Injectable()
export class AgencyRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private agencyUtilsService: AgencyUtilsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<AgencyRole[]>(AGENCY_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    const agencyId = request.params?.agencyId || request.body?.agencyId;

    if (!user || !agencyId) {
      throw new ForbiddenException('User or agency ID not found');
    }

    const userRole = await this.agencyUtilsService.getUserAgencyRole(user.id, agencyId);
    if (!userRole) {
      throw new ForbiddenException('User is not a member of this agency');
    }

    return requiredRoles.some((role) => userRole === role);
  }
}




