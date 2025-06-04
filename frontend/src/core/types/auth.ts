/**
 * Authentication types
 */
import { DefaultSession } from 'next-auth'

export interface User {
  id: string
  email: string
  tier: 'FREE' | 'PRO'
  is_active: boolean
  created_at?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
}

export interface UsageStats {
  can_process: boolean
  current_usage: number
  limit: number
  remaining: number
}

// Extend NextAuth session type
declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string
    user: {
      id: string
      email: string
      tier: string
      is_active: boolean
    } & DefaultSession['user']
  }
  
  interface User {
    accessToken?: string
    tier?: string
    is_active?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    tier?: string
    is_active?: boolean
  }
}
