/**
 * Authentication API client
 */
import { authConfig } from '../config/auth'
import { 
  AuthResponse, 
  LoginCredentials, 
  RegisterCredentials, 
  UsageStats 
} from '../types/auth'

class AuthApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = authConfig.apiUrl
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Registration failed')
    }

    return response.json()
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Login failed')
    }

    return response.json()
  }

  async getMe(accessToken: string) {
    const response = await fetch(`${this.baseUrl}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get user info')
    }

    return response.json()
  }

  async getUsageStats(accessToken: string): Promise<UsageStats> {
    const response = await fetch(`${this.baseUrl}/api/auth/usage`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get usage stats')
    }

    return response.json()
  }
}

export const authApi = new AuthApiClient()
