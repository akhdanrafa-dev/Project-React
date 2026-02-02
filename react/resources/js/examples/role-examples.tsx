import { ROLES, RoleType, getAllRoles, ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/roles"

// ============================================
// CONTOH 1: Menampilkan Grid Role
// ============================================
export function RoleGridExample() {
  const roles = getAllRoles()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-6">
      <h2 className="col-span-full text-2xl font-bold mb-4">Daftar Role Sistem</h2>
      {roles.map((role) => (
        <div 
          key={role.value}
          className="p-4 rounded-lg border-2 hover:shadow-lg transition-shadow"
          style={{
            borderColor: role.value === ROLES.USER ? '#3B82F6' : 
                         role.value === ROLES.STAFF ? '#22C55E' :
                         role.value === ROLES.ADMIN_IT ? '#EF4444' : '#A855F7'
          }}
        >
          <h3 className="font-bold text-lg mb-2">{role.label}</h3>
          <p className="text-sm text-gray-600">{role.description}</p>
        </div>
      ))}
    </div>
  )
}

// ============================================
// CONTOH 2: Filter User berdasarkan Role
// ============================================
export function FilterUsersByRole(users: any[], selectedRole: RoleType) {
  return users.filter(user => user.role === selectedRole)
}

// ============================================
// CONTOH 3: Check Permission berdasarkan Role
// ============================================
export const ROLE_PERMISSIONS = {
  [ROLES.USER]: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canViewReports: false,
  },
  [ROLES.STAFF]: {
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canViewReports: true,
  },
  [ROLES.ADMIN_IT]: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canViewReports: true,
  },
  [ROLES.DEVELOPER]: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canViewReports: true,
  },
}

export function canUserAccess(role: RoleType, action: keyof typeof ROLE_PERMISSIONS[RoleType]) {
  return ROLE_PERMISSIONS[role][action] ?? false
}

// ============================================
// CONTOH 4: Status Badge dengan Role
// ============================================
import { Badge } from "@/components/ui/badge"

interface UserStatusProps {
  role: RoleType
}

export function UserStatusBadge({ role }: UserStatusProps) {
  const colors: Record<RoleType, { bg: string; text: string }> = {
    [ROLES.USER]: { bg: "bg-blue-100", text: "text-blue-800" },
    [ROLES.STAFF]: { bg: "bg-green-100", text: "text-green-800" },
    [ROLES.ADMIN_IT]: { bg: "bg-red-100", text: "text-red-800" },
    [ROLES.DEVELOPER]: { bg: "bg-purple-100", text: "text-purple-800" },
  }

  const color = colors[role]

  return (
    <Badge className={`${color.bg} ${color.text}`}>
      {ROLE_LABELS[role]}
    </Badge>
  )
}

// ============================================
// CONTOH 5: Dropdown dengan Role
// ============================================
export function RoleDropdownMenu() {
  const roles = getAllRoles()

  return (
    <select className="w-full px-3 py-2 border rounded-md">
      <option value="">Pilih Role</option>
      {roles.map((role) => (
        <option key={role.value} value={role.value}>
          {role.label} - {role.description}
        </option>
      ))}
    </select>
  )
}

// ============================================
// CONTOH 6: Role Statistics
// ============================================
export function getRoleStats(users: any[]) {
  const stats = {
    [ROLES.USER]: users.filter(u => u.role === ROLES.USER).length,
    [ROLES.STAFF]: users.filter(u => u.role === ROLES.STAFF).length,
    [ROLES.ADMIN_IT]: users.filter(u => u.role === ROLES.ADMIN_IT).length,
    [ROLES.DEVELOPER]: users.filter(u => u.role === ROLES.DEVELOPER).length,
  }

  return stats
}

export function RoleStatisticsCard() {
  return (
    <div className="grid gap-4 md:grid-cols-4 p-6">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-600">User</p>
        <p className="text-2xl font-bold text-blue-600">24</p>
      </div>
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-sm text-gray-600">Staff</p>
        <p className="text-2xl font-bold text-green-600">8</p>
      </div>
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <p className="text-sm text-gray-600">Admin IT</p>
        <p className="text-2xl font-bold text-red-600">2</p>
      </div>
      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
        <p className="text-sm text-gray-600">Developer</p>
        <p className="text-2xl font-bold text-purple-600">3</p>
      </div>
    </div>
  )
}
