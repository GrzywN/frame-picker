/**
 * Billing hook for subscription and payment management
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './use-auth'
import { 
  billingApi, 
  Subscription, 
  Payment, 
  CheckoutSessionRequest 
} from '@/core/api/billing'

interface BillingState {
  subscription: Subscription | null
  payments: Payment[]
  loading: boolean
  error: string | null
}

export function useBilling() {
  const { accessToken, isAuthenticated, user } = useAuth()
  const [state, setState] = useState<BillingState>({
    subscription: null,
    payments: [],
    loading: false,
    error: null,
  })

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }))
  }

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }

  const fetchSubscription = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setState(prev => ({ ...prev, subscription: null }))
      return
    }

    try {
      setError(null)
      const subscription = await billingApi.getSubscription(accessToken)
      setState(prev => ({ ...prev, subscription }))
    } catch (err) {
      // If subscription doesn't exist (404), that's normal for free users
      if (err instanceof Error && err.message.includes('404')) {
        setState(prev => ({ ...prev, subscription: null }))
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch subscription')
        setState(prev => ({ ...prev, subscription: null }))
      }
    }
  }, [accessToken, isAuthenticated])

  const fetchPayments = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setState(prev => ({ ...prev, payments: [] }))
      return
    }

    try {
      setError(null)
      const payments = await billingApi.getPayments(accessToken)
      setState(prev => ({ ...prev, payments }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payments')
      setState(prev => ({ ...prev, payments: [] }))
    }
  }, [accessToken, isAuthenticated])

  const refreshData = useCallback(async () => {
    if (!isAuthenticated || !accessToken) return
    
    setLoading(true)
    try {
      await Promise.all([fetchSubscription(), fetchPayments()])
    } finally {
      setLoading(false)
    }
  }, [fetchSubscription, fetchPayments, isAuthenticated, accessToken])

  // Fetch data when auth state changes
  useEffect(() => {
    refreshData()
  }, [refreshData])

  const createCheckoutSession = async (
    tier: 'PRO' = 'PRO',
    subscriptionType: 'MONTHLY' | 'YEARLY' = 'MONTHLY'
  ) => {
    if (!isAuthenticated || !accessToken) {
      throw new Error('Authentication required')
    }

    try {
      setLoading(true)
      setError(null)

      const request: CheckoutSessionRequest = {
        tier,
        subscription_type: subscriptionType,
        success_url: `${window.location.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/billing/cancelled`,
      }

      const response = await billingApi.createCheckoutSession(request, accessToken)
      
      // Redirect to Stripe checkout
      billingApi.redirectToCheckout(response.checkout_url)

      return response
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout session')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const openBillingPortal = async () => {
    if (!isAuthenticated || !accessToken) {
      throw new Error('Authentication required')
    }

    try {
      setLoading(true)
      setError(null)

      const returnUrl = `${window.location.origin}/billing/manage`
      const response = await billingApi.createBillingPortalSession(returnUrl, accessToken)
      
      // Redirect to Stripe billing portal
      billingApi.redirectToBillingPortal(response.portal_url)

      return response
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const cancelSubscription = async () => {
    if (!isAuthenticated || !accessToken) {
      throw new Error('Authentication required')
    }

    try {
      setLoading(true)
      setError(null)

      const response = await billingApi.cancelSubscription(accessToken)
      
      // Refresh subscription data
      await fetchSubscription()

      return response
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Helper functions for subscription status
  const isProUser = user?.tier === 'PRO'
  const hasActiveSubscription = state.subscription?.status === 'ACTIVE'
  const isSubscriptionCancelled = state.subscription?.status === 'CANCELLED'
  const isSubscriptionPastDue = state.subscription?.status === 'PAST_DUE'

  const getCurrentPeriodEnd = (): Date | null => {
    if (!state.subscription?.current_period_end) return null
    return new Date(state.subscription.current_period_end)
  }

  const getDaysUntilRenewal = (): number | null => {
    const endDate = getCurrentPeriodEnd()
    if (!endDate) return null

    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 0 ? diffDays : 0
  }

  const getSubscriptionPrice = (subscriptionType: 'MONTHLY' | 'YEARLY' = 'MONTHLY'): string => {
    return subscriptionType === 'MONTHLY' ? '$2.99' : '$29.99'
  }

  return {
    // State
    subscription: state.subscription,
    payments: state.payments,
    loading: state.loading,
    error: state.error,

    // Actions
    createCheckoutSession,
    openBillingPortal,
    cancelSubscription,
    refreshData,

    // Helper functions
    isProUser,
    hasActiveSubscription,
    isSubscriptionCancelled,
    isSubscriptionPastDue,
    getCurrentPeriodEnd,
    getDaysUntilRenewal,
    getSubscriptionPrice,
  }
}
