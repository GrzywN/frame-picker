/**
 * Authentication hook
 */
'use client'

import { useSession } from 'next-auth/react'

export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user || null,
    accessToken: (session as any)?.accessToken || null,
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading',
  }
}
