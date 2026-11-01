export type Role = "CITIZEN" | "OPERATOR" | "TECHNICIAN" | "ADMIN" | "ANALYST";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: CurrentUser;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  displayName: string;
};

