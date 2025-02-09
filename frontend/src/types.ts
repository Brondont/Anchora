export interface UserProps {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  username: string;
  email: string;
  phoneNumber: string;
  isAdmin: boolean;
}
