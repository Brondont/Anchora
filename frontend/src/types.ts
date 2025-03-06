export interface Role {
  ID: number;
  name: string;
}

export interface UserProps {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  Roles: Role[];
}

export interface ErrorResponse {
  msg: string;
}

export type ServerFormError = {
  type: string;
  value: string;
  msg: string;
  path: string;
  location: string;
};
