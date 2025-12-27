import { SetMetadata } from '@nestjs/common';
import { AgencyPermission } from '../enums/agency-permission.enum';

export const AGENCY_PERMISSIONS_KEY = 'agency_permissions';
export const AgencyPermissions = (...permissions: AgencyPermission[]) =>
  SetMetadata(AGENCY_PERMISSIONS_KEY, permissions);



