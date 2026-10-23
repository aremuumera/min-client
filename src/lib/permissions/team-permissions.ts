/*
 * Team-member keys — a copy of the backend's catalogue
 * (minmeg-backend-ts/src/shared/permissions/team-permissions.ts, decision #84).
 * KEEP IN SYNC: when a key or preset changes there, change it here and in the other app.
 * The backend enforces these keys on every request; the app only hides what would be refused.
 */
export const TEAM_PERMISSIONS = {
  products: 'Manage products, listings & storefront',
  rfq: 'Manage RFQs & bids',
  chat: 'Access chat',
  enquiries: 'Handle product inquiries & the trade room',
  invoices: 'Invoices, agreements & trade documents',
  inspectors: 'Inspections & lab results',
  analytics: 'View analytics',
  settings: 'Company profile, verification & settings',
  team_management: 'Manage the team',
  activity: 'View the activity log',
  inventory: 'Batches, stock, sites & checkpoints',
  shipments: 'Shipments, tracking & alerts',
  traceability: 'Codes, labels, custody, units, events & measurements',
  passports: 'Passports, certificates, compliance & proofs',
  esg: 'ESG & carbon assessments',
  documents: 'Document vault, evidence & sharing',
} as const;

export type TeamPermission = keyof typeof TEAM_PERMISSIONS;
export const TEAM_PERMISSION_KEYS = Object.keys(TEAM_PERMISSIONS) as TeamPermission[];

export type TeamRole = 'admin' | 'marketer' | 'customer_care' | 'operations_manager';

/** Starting keys per team role; the owner edits them per member */
export const TEAM_ROLE_PRESETS: Record<TeamRole, readonly TeamPermission[]> = {
  admin: TEAM_PERMISSION_KEYS,
  marketer: ['products', 'rfq', 'analytics'],
  customer_care: ['chat', 'enquiries'],
  operations_manager: ['invoices', 'inspectors', 'analytics', 'activity', 'inventory', 'shipments', 'traceability', 'passports', 'documents', 'esg'],
};
