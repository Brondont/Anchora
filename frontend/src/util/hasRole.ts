import { UserProps } from "../types";

export default function hasRole(
  user: UserProps | undefined,
  roleName: string
): boolean {
  if (!user || !user.Roles) return false;
  return user.Roles.some(
    (role) => role.name.toLowerCase() === roleName.toLowerCase()
  );
}
