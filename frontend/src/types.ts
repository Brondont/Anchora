export interface Role {
  name: string;
}

export interface UserProps {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  username: string;
  email: string;
  phoneNumber: string;
  Roles: Role[] | null;
}

export interface ErrorResponse {
  msg: string;
}
