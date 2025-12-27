import { SetMetadata } from '@nestjs/common';
import { AgencyRole } from '../enums/agency-role.enum';

export const AGENCY_ROLES_KEY = 'agency_roles';
export const AgencyRoles = (...roles: AgencyRole[]) => SetMetadata(AGENCY_ROLES_KEY, roles);



