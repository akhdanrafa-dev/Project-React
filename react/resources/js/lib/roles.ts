// Role constants and utilities
export const ROLES = {
  USER: 'user',
  STAFF: 'staff',
  ADMIN_IT: 'admin_it',
  DEVELOPER: 'developer',
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS: Record<RoleType, string> = {
  [ROLES.USER]: 'User',
  [ROLES.STAFF]: 'Staff',
  [ROLES.ADMIN_IT]: 'Admin IT',
  [ROLES.DEVELOPER]: 'Developer',
};

export const ROLE_DESCRIPTIONS: Record<RoleType, string> = {
  [ROLES.USER]: 'Pengguna biasa dengan akses terbatas',
  [ROLES.STAFF]: 'Staff yang dapat mengelola data dasar',
  [ROLES.ADMIN_IT]: 'Admin IT dengan akses penuh sistem',
  [ROLES.DEVELOPER]: 'Developer dengan akses ke setting teknis',
};

export const ROLE_COLORS: Record<RoleType, string> = {
  [ROLES.USER]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ROLES.STAFF]: 'bg-green-100 text-green-800 border-green-200',
  [ROLES.ADMIN_IT]: 'bg-red-100 text-red-800 border-red-200',
  [ROLES.DEVELOPER]: 'bg-purple-100 text-purple-800 border-purple-200',
};

export const getAllRoles = (): Array<{ value: RoleType; label: string; description: string }> => [
  {
    value: ROLES.USER,
    label: ROLE_LABELS[ROLES.USER],
    description: ROLE_DESCRIPTIONS[ROLES.USER],
  },
  {
    value: ROLES.STAFF,
    label: ROLE_LABELS[ROLES.STAFF],
    description: ROLE_DESCRIPTIONS[ROLES.STAFF],
  },
  {
    value: ROLES.ADMIN_IT,
    label: ROLE_LABELS[ROLES.ADMIN_IT],
    description: ROLE_DESCRIPTIONS[ROLES.ADMIN_IT],
  },
  {
    value: ROLES.DEVELOPER,
    label: ROLE_LABELS[ROLES.DEVELOPER],
    description: ROLE_DESCRIPTIONS[ROLES.DEVELOPER],
  },
];
