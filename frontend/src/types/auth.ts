export type UserRole = 'student' | 'guest' | 'counselor' | 'admin';

export interface User {
  id: string;
  email: string | null;
  role: UserRole;
  is_anonymous: boolean;
  email_verified: boolean;
  age: number | null;
  gender: string | null;
  faculty: string | null;
  year_of_study: number | null;
  nickname: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: User;
  tokens: TokenResponse;
  message?: string;
}

export interface MessageResponse {
  message: string;
}
