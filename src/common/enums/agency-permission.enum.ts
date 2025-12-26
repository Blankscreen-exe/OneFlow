export enum AgencyPermission {
  // Agency management
  MANAGE_AGENCY_SETTINGS = 'manage_agency_settings',
  
  // Member management
  MANAGE_MEMBERS = 'manage_members',
  MANAGE_MANAGERS = 'manage_managers',
  MANAGE_BUSINESS_DEVELOPERS = 'manage_business_developers',
  
  // Client assignments
  ASSIGN_CLIENTS = 'assign_clients',
  
  // Data visibility
  VIEW_ALL_CLIENTS = 'view_all_clients',
  VIEW_ALL_PROPOSALS = 'view_all_proposals',
  VIEW_ALL_INVOICES = 'view_all_invoices',
  VIEW_EMPLOYEES = 'view_employees',
  
  // Resignation processing
  PROCESS_RESIGNATIONS = 'process_resignations',
}

