import { AgencyRole } from '../enums/agency-role.enum';
import { AgencyPermission } from '../enums/agency-permission.enum';

/**
 * Centralized mapping of agency roles to permissions.
 */
export const AGENCY_ROLE_PERMISSIONS: Record<AgencyRole, AgencyPermission[]> = {
  [AgencyRole.ADMIN]: [
    // All permissions
    AgencyPermission.MANAGE_AGENCY_SETTINGS,
    AgencyPermission.MANAGE_MEMBERS,
    AgencyPermission.MANAGE_MANAGERS,
    AgencyPermission.MANAGE_BUSINESS_DEVELOPERS,
    AgencyPermission.ASSIGN_CLIENTS,
    AgencyPermission.VIEW_ALL_CLIENTS,
    AgencyPermission.VIEW_ALL_PROPOSALS,
    AgencyPermission.VIEW_ALL_INVOICES,
    AgencyPermission.VIEW_EMPLOYEES,
    AgencyPermission.PROCESS_RESIGNATIONS,
  ],

  [AgencyRole.MANAGER]: [
    // Can manage BDs, assign clients, view all data, do BD tasks
    AgencyPermission.MANAGE_BUSINESS_DEVELOPERS,
    AgencyPermission.ASSIGN_CLIENTS,
    AgencyPermission.VIEW_ALL_CLIENTS,
    AgencyPermission.VIEW_ALL_PROPOSALS,
    AgencyPermission.VIEW_ALL_INVOICES,
    AgencyPermission.VIEW_EMPLOYEES,
  ],

  [AgencyRole.BUSINESS_DEVELOPER]: [
    // BDs have no special permissions - they can only access assigned clients
    // Permission checks are handled at the service level
  ],
};

/**
 * Get all permissions for a given agency role
 */
export function getAgencyPermissionsForRole(role: AgencyRole): AgencyPermission[] {
  return AGENCY_ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if an agency role has a specific permission
 */
export function agencyRoleHasPermission(
  role: AgencyRole,
  permission: AgencyPermission,
): boolean {
  const permissions = getAgencyPermissionsForRole(role);
  return permissions.includes(permission);
}

