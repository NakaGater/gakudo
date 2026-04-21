export function isStaff(role: string): boolean {
  return role === "admin" || role === "teacher";
}

export function isAdmin(role: string): boolean {
  return role === "admin";
}
