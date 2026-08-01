export type UserRole = "patient" | "doctor" | "staff" | "admin";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  approved: boolean;
}
