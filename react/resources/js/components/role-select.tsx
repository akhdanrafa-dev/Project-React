import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ROLE_LABELS, RoleType, getAllRoles } from "@/lib/roles"

interface RoleSelectProps {
  value: RoleType
  onValueChange: (value: RoleType) => void
  disabled?: boolean
}

export function RoleSelect({ value, onValueChange, disabled = false }: RoleSelectProps) {
  const roles = getAllRoles()

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role.value} value={role.value}>
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
