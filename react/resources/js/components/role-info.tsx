import { Badge } from "@/components/ui/badge"
import { ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_COLORS, RoleType, getAllRoles } from "@/lib/roles"

interface RoleInfoProps {
  role: RoleType
  showDescription?: boolean
}

export function RoleInfo({ role, showDescription = true }: RoleInfoProps) {
  return (
    <div className="flex flex-col gap-2">
      <Badge 
        variant="outline"
        className={ROLE_COLORS[role]}
      >
        {ROLE_LABELS[role]}
      </Badge>
      {showDescription && (
        <p className="text-sm text-gray-600">
          {ROLE_DESCRIPTIONS[role]}
        </p>
      )}
    </div>
  )
}

export function RoleGrid() {
  const roles = getAllRoles()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {roles.map((role) => (
        <div 
          key={role.value}
          className={`p-4 rounded-lg border ${ROLE_COLORS[role.value]}`}
        >
          <h3 className="font-semibold mb-1">{role.label}</h3>
          <p className="text-sm">{role.description}</p>
        </div>
      ))}
    </div>
  )
}
