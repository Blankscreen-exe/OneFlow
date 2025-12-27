import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AGENCY_PERMISSIONS_KEY } from '../decorators/agency-permissions.decorator';
import { AgencyPermission } from '../enums/agency-permission.enum';
import { AgencyUtilsService } from '../../agencies/services/agency-utils.service';

@Injectable()
export class AgencyPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private agencyUtilsService: AgencyUtilsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<AgencyPermission[]>(
      AGENCY_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    const agencyId = request.params?.agencyId || request.body?.agencyId;

    if (!user || !agencyId) {
      throw new ForbiddenException('User or agency ID not found');
    }

    // Check each required permission
    for (const permission of requiredPermissions) {
      const hasPermission = await this.agencyUtilsService.hasAgencyPermission(
        user.id,
        agencyId,
        permission,
      );
      if (!hasPermission) {
        throw new ForbiddenException(`Missing required permission: ${permission}`);
      }
    }

    return true;
  }
}



