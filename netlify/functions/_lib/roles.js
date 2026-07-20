import { staffRoles } from '../_data/staff-roles.js'

export function getRole(nameLower) {
  return staffRoles[nameLower] ?? 'Игрок'
}
