import { Role } from '../enums/role.enum';
import { Permission } from '../enums/permission.enum';

/**
 * Centralized mapping of roles to permissions.
 * This is the key extensibility point - adding new roles only requires
 * updating this mapping.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    // Full system access
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.MANAGE_SYSTEM,
    Permission.VIEW_ANALYTICS,
    
    // All client operations
    Permission.MANAGE_CLIENTS,
    Permission.VIEW_CLIENTS,
    Permission.CREATE_CLIENTS,
    Permission.UPDATE_CLIENTS,
    Permission.DELETE_CLIENTS,
    
    // All proposal operations
    Permission.MANAGE_PROPOSALS,
    Permission.VIEW_PROPOSALS,
    Permission.CREATE_PROPOSALS,
    Permission.UPDATE_PROPOSALS,
    Permission.DELETE_PROPOSALS,
    Permission.SEND_PROPOSALS,
    
    // All contact operations
    Permission.MANAGE_CLIENT_CONTACTS,
    Permission.VIEW_CLIENT_CONTACTS,
    
    // All source operations
    Permission.MANAGE_CLIENT_SOURCES,
    Permission.VIEW_CLIENT_SOURCES,
  ],

  [Role.SERVICE_PROVIDER]: [
    // Client operations (own clients)
    Permission.VIEW_CLIENTS,
    Permission.CREATE_CLIENTS,
    Permission.UPDATE_CLIENTS,
    Permission.DELETE_CLIENTS,
    
    // Proposal operations (own proposals)
    Permission.VIEW_PROPOSALS,
    Permission.CREATE_PROPOSALS,
    Permission.UPDATE_PROPOSALS,
    Permission.DELETE_PROPOSALS,
    Permission.SEND_PROPOSALS,
    
    // Contact operations (own contacts)
    Permission.VIEW_CLIENT_CONTACTS,
    Permission.MANAGE_CLIENT_CONTACTS,
    
    // Source operations (own sources)
    Permission.VIEW_CLIENT_SOURCES,
  ],

  [Role.CLIENT]: [
    // Limited view permissions
    Permission.VIEW_PROPOSALS,
    // Clients can view proposals sent to them
    // Additional permissions can be added as needed
  ],
};

/**
 * Get all permissions for a given role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission);
}

