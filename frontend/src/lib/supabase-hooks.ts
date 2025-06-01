/**
 * Custom hooks for Supabase operations
 */

import { useEffect, useState } from 'react'
import { supabase, ProcessingSession, FrameResult, User } from './supabase'
import { useAuth } from './auth'

/**
 * Hook to get user's processing sessions
 */
export function useProcessingSessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<ProcessingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setSessions([])
      setLoading(false)
      return
    }

    const fetchSessions = async () => {
      try {
        const { data, error } = await supabase
          .from('processing_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        setSessions(data || [])
      } catch (err) {
        console.error('Error fetching sessions:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch sessions')
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [user])

  return { sessions, loading, error, refetch: () => setLoading(true) }
}

/**
 * Hook to get frame results for a session
 */
export function useFrameResults(sessionId: string | null) {
  const [results, setResults] = useState<FrameResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setResults([])
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      try {
        // First get the session to get the internal ID
        const { data: session, error: sessionError } = await supabase
          .from('processing_sessions')
          .select('id')
          .eq('session_id', sessionId)
          .single()

        if (sessionError) throw sessionError

        // Then get frame results
        const { data, error } = await supabase
          .from('frame_results')
          .select('*')
          .eq('session_id', session.id)
          .order('frame_index', { ascending: true })

        if (error) throw error

        setResults(data || [])
      } catch (err) {
        console.error('Error fetching frame results:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch results')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [sessionId])

  return { results, loading, error }
}

/**
 * Hook to get current user's usage statistics
 */
export function useUsageStats() {
  const { user } = useAuth()
  const [usage, setUsage] = useState({
    videos_processed: 0,
    frames_extracted: 0,
    storage_used_bytes: 0,
    api_requests: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchUsage = async () => {
      try {
        // Get current month's usage
        const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
        
        const { data, error } = await supabase
          .from('usage_tracking')
          .select('*')
          .eq('user_id', user.id)
          .eq('month', currentMonth)
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          throw error
        }

        setUsage(data || {
          videos_processed: 0,
          frames_extracted: 0,
          storage_used_bytes: 0,
          api_requests: 0
        })
      } catch (err) {
        console.error('Error fetching usage stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch usage')
      } finally {
        setLoading(false)
      }
    }

    fetchUsage()
  }, [user])

  return { usage, loading, error }
}

/**
 * Hook to get user's subscription info
 */
export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        setSubscription(data)
      } catch (err) {
        console.error('Error fetching subscription:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch subscription')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user])

  return { subscription, loading, error }
}

/**
 * Hook for real-time updates on processing sessions
 */
export function useRealtimeSession(sessionId: string | null) {
  const [session, setSession] = useState<ProcessingSession | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!sessionId) return

    // Initial fetch
    const fetchSession = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('processing_sessions')
          .select('*')
          .eq('session_id', sessionId)
          .single()

        if (error) throw error
        setSession(data)
      } catch (err) {
        console.error('Error fetching session:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSession()

    // Set up real-time subscription
    const subscription = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'processing_sessions',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Session updated:', payload.new)
          setSession(payload.new as ProcessingSession)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [sessionId])

  return { session, loading }
}

/**
 * Utility function to update usage stats
 */
export async function updateUsageStats(
  userId: string,
  updates: {
    videos_processed?: number
    frames_extracted?: number
    storage_used_bytes?: number
    api_requests?: number
  }
) {
  const currentMonth = new Date().toISOString().slice(0, 7) + '-01'

  // First try to get existing usage record
  const { data: existing, error: fetchError } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('month', currentMonth)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError
  }

  if (existing) {
    // Update existing record
    const newValues = {
      videos_processed: existing.videos_processed + (updates.videos_processed || 0),
      frames_extracted: existing.frames_extracted + (updates.frames_extracted || 0),
      storage_used_bytes: existing.storage_used_bytes + (updates.storage_used_bytes || 0),
      api_requests: existing.api_requests + (updates.api_requests || 0),
    }

    const { error } = await supabase
      .from('usage_tracking')
      .update(newValues)
      .eq('id', existing.id)

    if (error) throw error
  } else {
    // Create new record
    const { error } = await supabase
      .from('usage_tracking')
      .insert({
        user_id: userId,
        month: currentMonth,
        videos_processed: updates.videos_processed || 0,
        frames_extracted: updates.frames_extracted || 0,
        storage_used_bytes: updates.storage_used_bytes || 0,
        api_requests: updates.api_requests || 0,
      })

    if (error) throw error
  }
}
