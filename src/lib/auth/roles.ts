export function isStaff(role: string): boolean {
  return role === "admin" || role === "teacher" || role === "entrance";
}

export function isAdmin(role: string): boolean {
  return role === "admin";
}
