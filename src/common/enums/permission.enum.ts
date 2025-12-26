export enum Permission {
  // User management
  MANAGE_USERS = 'manage_users',
  VIEW_USERS = 'view_users',

  // Client management
  MANAGE_CLIENTS = 'manage_clients',
  VIEW_CLIENTS = 'view_clients',
  CREATE_CLIENTS = 'create_clients',
  UPDATE_CLIENTS = 'update_clients',
  DELETE_CLIENTS = 'delete_clients',

  // Proposal management
  MANAGE_PROPOSALS = 'manage_proposals',
  VIEW_PROPOSALS = 'view_proposals',
  CREATE_PROPOSALS = 'create_proposals',
  UPDATE_PROPOSALS = 'update_proposals',
  DELETE_PROPOSALS = 'delete_proposals',
  SEND_PROPOSALS = 'send_proposals',

  // Client contacts
  MANAGE_CLIENT_CONTACTS = 'manage_client_contacts',
  VIEW_CLIENT_CONTACTS = 'view_client_contacts',

  // Client sources
  MANAGE_CLIENT_SOURCES = 'manage_client_sources',
  VIEW_CLIENT_SOURCES = 'view_client_sources',

  // System administration
  MANAGE_SYSTEM = 'manage_system',
  VIEW_ANALYTICS = 'view_analytics',
}

