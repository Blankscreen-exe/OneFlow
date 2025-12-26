import { Role } from '../enums/role.enum';
import { Permission } from '../enums/permission.enum';
import { getPermissionsForRole, roleHasPermission } from '../config/role-permissions.config';

/**
 * User object structure expected by these utilities
 */
export interface UserWithRole {
  id: string;
  role: Role;
}

/**
 * Check if a user has a specific role
 */
export function hasRole(user: UserWithRole, role: Role): boolean {
  return user.role === role;
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(user: UserWithRole, roles: Role[]): boolean {
  return roles.includes(user.role);
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: UserWithRole, permission: Permission): boolean {
  return roleHasPermission(user.role, permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(user: UserWithRole, permissions: Permission[]): boolean {
  const userPermissions = getPermissionsForRole(user.role);
  return permissions.some((permission) => userPermissions.includes(permission));
}

/**
 * Get all permissions for a user based on their role
 */
export function getUserPermissions(user: UserWithRole): Permission[] {
  return getPermissionsForRole(user.role);
}

