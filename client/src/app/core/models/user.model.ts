export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Profile extends User {
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
}
