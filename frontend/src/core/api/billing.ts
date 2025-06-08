/**
 * Billing API client for Stripe integration
 */
import { authConfig } from '../config/auth'

export interface Subscription {
  id: string
  user_id: string
  tier: 'FREE' | 'PRO'
  subscription_type: 'MONTHLY' | 'YEARLY'
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'UNPAID'
  current_period_start?: string
  current_period_end?: string
  created_at?: string
  cancelled_at?: string
}

export interface Payment {
  id: string
  user_id: string
  subscription_id?: string
  amount: number
  currency: string
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
  description?: string
  created_at?: string
  processed_at?: string
}

export interface CheckoutSessionRequest {
  tier: 'PRO'
  subscription_type: 'MONTHLY' | 'YEARLY'
  success_url: string
  cancel_url: string
}

export interface CheckoutSessionResponse {
  checkout_url: string
  session_id: string
}

export interface BillingPortalResponse {
  portal_url: string
}

class BillingApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = authConfig.apiUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    accessToken?: string
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `Request failed: ${response.statusText}`)
    }

    return response.json()
  }

  async createCheckoutSession(
    request: CheckoutSessionRequest,
    accessToken: string
  ): Promise<CheckoutSessionResponse> {
    return this.request<CheckoutSessionResponse>(
      '/api/billing/checkout',
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      accessToken
    )
  }

  async createBillingPortalSession(
    returnUrl: string,
    accessToken: string
  ): Promise<BillingPortalResponse> {
    const searchParams = new URLSearchParams({ return_url: returnUrl })
    
    return this.request<BillingPortalResponse>(
      `/api/billing/portal?${searchParams}`,
      {
        method: 'POST',
      },
      accessToken
    )
  }

  async getSubscription(accessToken: string): Promise<Subscription> {
    return this.request<Subscription>('/api/billing/subscription', {}, accessToken)
  }

  async cancelSubscription(accessToken: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      '/api/billing/subscription',
      {
        method: 'DELETE',
      },
      accessToken
    )
  }

  async getPayments(accessToken: string, limit: number = 50): Promise<Payment[]> {
    const searchParams = new URLSearchParams({ limit: limit.toString() })
    
    return this.request<Payment[]>(
      `/api/billing/payments?${searchParams}`,
      {},
      accessToken
    )
  }

  redirectToCheckout(checkoutUrl: string) {
    window.location.href = checkoutUrl
  }

  redirectToBillingPortal(portalUrl: string) {
    window.location.href = portalUrl
  }
}

export const billingApi = new BillingApiClient()
