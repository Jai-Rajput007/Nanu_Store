'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback, useRef } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { User, Profile } from '@/types'
import { toast } from 'sonner'
import { notifyNewUser } from '@/lib/notifications'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  signUp: (data: SignUpData) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any; isAdmin?: boolean }>
  signOut: () => Promise<void>
  sendOTP: (phone: string) => Promise<{ error: any }>
  verifyOTP: (phone: string, otp: string) => Promise<{ error: any; session: any }>
  updateProfile: (data: Partial<Profile>) => Promise<{ error: any }>
}

interface SignUpData {
  full_name: string
  phone: string
  email: string
  password: string
  address?: string
  city?: string
  pincode?: string
  role?: 'customer' | 'admin'
  admin_key?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Create supabase client only once using useMemo
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  
  // Track pending requests to handle AbortError
  const pendingRequestsRef = useRef<AbortController[]>([])
  const isMountedRef = useRef(true)

  // Cleanup pending requests on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      pendingRequestsRef.current.forEach(controller => controller.abort())
      pendingRequestsRef.current = []
    }
  }, [])

  // Create abortable request wrapper
  const createAbortableRequest = useCallback(() => {
    const controller = new AbortController()
    pendingRequestsRef.current.push(controller)
    return controller
  }, [])

  const removeRequest = useCallback((controller: AbortController) => {
    pendingRequestsRef.current = pendingRequestsRef.current.filter(c => c !== controller)
  }, [])

  // Define fetchProfile BEFORE the useEffect that uses it
  const fetchProfile = useCallback(async (userId: string, signal?: AbortSignal) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      // Check if request was aborted
      if (signal?.aborted) {
        console.log('Profile fetch aborted')
        return
      }
      
      // Check if component is still mounted before updating state
      if (isMountedRef.current && data) {
        setProfile(data as Profile)
        setUser({
          id: userId,
          email: data.email || '',
          phone: data.phone,
          full_name: data.full_name,
          role: data.role,
          avatar_url: data.avatar_url,
          created_at: data.created_at,
          updated_at: data.updated_at,
        } as User)
      }
      
      // Only log actual errors, not "no rows" (PGRST116) which is expected for new users
      if (error && error.code !== 'PGRST116') {
        console.error('Fetch profile error:', error.message)
      }
    } catch (err: any) {
      // Ignore AbortError - it's expected during cleanup
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        console.log('Profile fetch aborted (expected during cleanup)')
        return
      }
      // Don't log PGRST116 (no rows) as error - it's expected for users without profiles
      if (err.code !== 'PGRST116') {
        console.error('Fetch profile error:', err.message || err)
      }
    }
  }, [supabase])

  useEffect(() => {
    // Guard flag to prevent race conditions during init
    let isActive = true
    
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && isActive) {
          await fetchProfile(session.user.id)
        }
      } catch (err: any) {
        // Ignore AbortError
        if (err.name === 'AbortError' || err.message?.includes('aborted')) {
          console.log('Session fetch aborted')
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Use setTimeout to prevent blocking the auth state callback
      setTimeout(async () => {
        if (!isActive) return
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
      }, 0)
    })

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const signUp = useCallback(async (data: SignUpData) => {
    const controller = createAbortableRequest()
    try {
      // Verify admin key if registering as admin
      if (data.role === 'admin' && data.admin_key !== process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY) {
        return { error: { message: 'Invalid admin secret key' } }
      }

      const { error, data: authData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            phone: data.phone,
            role: data.role || 'customer',
            address: data.address,
            city: data.city,
            pincode: data.pincode,
          },
          // Disable email confirmation - auto confirm the user
          emailRedirectTo: undefined,
        },
      })

      // Check if aborted
      if (controller.signal.aborted) {
        return { error: { message: 'Request cancelled' } }
      }

      // If signup successful, upsert profile with all data including address
      if (!error && authData?.user) {
        // Wait a moment for the trigger to create the profile, then upsert
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            full_name: data.full_name,
            phone: data.phone,
            email: data.email,
            role: data.role || 'customer',
            address: data.address,
            city: data.city,
            pincode: data.pincode,
          }, { onConflict: 'id' })

        if (upsertError) {
          console.error('Profile upsert error:', upsertError)
        }

        // Notify admins about new user registration
        await notifyNewUser({
          id: authData.user.id,
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
        })

        // Auto sign in after successful signup (with timeout)
        const signInPromise = supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sign in timeout')), 5000)
        )
        
        try {
          const { error: signInError } = await Promise.race([signInPromise, timeoutPromise]) as any
          if (!signInError) {
            await fetchProfile(authData.user.id, controller.signal)
          }
        } catch (e) {
          console.error('Auto sign in failed:', e)
          // Don't block registration if auto-login fails
        }
      }

      return { error }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        console.log('Sign up aborted')
        return { error: { message: 'Request cancelled' } }
      }
      return { error: err }
    } finally {
      removeRequest(controller)
    }
  }, [supabase, fetchProfile, createAbortableRequest, removeRequest])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (!error && data?.user) {
        // Try to fetch profile, but if it fails, still set user from auth data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        if (profileError) {
          console.error('Profile fetch error:', profileError)
        }
        
        let roleFromProfile: string | undefined = undefined
        if (profileData) {
          setProfile(profileData as Profile)
          setUser({
            id: data.user.id,
            email: profileData.email || data.user.email || '',
            phone: profileData.phone,
            full_name: profileData.full_name,
            role: profileData.role,
            avatar_url: profileData.avatar_url,
            created_at: profileData.created_at,
            updated_at: profileData.updated_at,
          } as User)
          roleFromProfile = profileData.role
        } else {
          // No profile yet, set user from auth data
          const inferredRole = data.user.user_metadata?.role || 'customer'
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            phone: data.user.user_metadata?.phone || '',
            full_name: data.user.user_metadata?.full_name || '',
            role: inferredRole,
            avatar_url: undefined,
            created_at: data.user.created_at,
            updated_at: data.user.updated_at,
          } as User)
          roleFromProfile = inferredRole
        }

        const isAdminFlag = roleFromProfile === 'admin'
        return { error, isAdmin: isAdminFlag }
      }
      return { error }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        console.log('Sign in aborted')
        return { error: { message: 'Request cancelled' } }
      }
      return { error: err }
    }
  }, [supabase])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      toast.success('Signed out successfully')
      // Redirect to home page after logout
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        console.log('Sign out aborted')
      }
    }
  }, [supabase])

  const sendOTP = useCallback(async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      })
      return { error }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        return { error: { message: 'Request cancelled' } }
      }
      return { error: err }
    }
  }, [supabase])

  const verifyOTP = useCallback(async (phone: string, otp: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      })
      return { error, session: data?.session }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        return { error: { message: 'Request cancelled' }, session: null }
      }
      return { error: err, session: null }
    }
  }, [supabase])

  const updateProfile = useCallback(async (data: Partial<Profile>) => {
    if (!user) return { error: { message: 'Not authenticated' } }

    const controller = createAbortableRequest()
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id)

      if (!error) {
        await fetchProfile(user.id, controller.signal)
      }

      return { error }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        return { error: { message: 'Request cancelled' } }
      }
      return { error: err }
    } finally {
      removeRequest(controller)
    }
  }, [supabase, user, fetchProfile, createAbortableRequest, removeRequest])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    signUp,
    signIn,
    signOut,
    sendOTP,
    verifyOTP,
    updateProfile,
  }), [user, profile, isLoading, signUp, signIn, signOut, sendOTP, verifyOTP, updateProfile])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
