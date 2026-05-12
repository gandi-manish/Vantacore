export interface JwtPayload {
  userId: string;
  sessionId: string;
  email: string;
  role: string;
  department: string;
  iat?: number;
  exp?: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshInput {
  refreshToken: string;
}

export interface LogoutInput {
  refreshToken: string;
}

export interface SafeUser {
  id: string;
  email: string;
  role: string;
  department: string;
  status: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RequestContext {
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
}