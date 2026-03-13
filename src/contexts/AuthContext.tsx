'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { getProfileAdmin } from '@/actions/profiles'

interface AuthContextType {
  user: any
  profile: any
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, phone: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
      }

      setLoading(false)
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for userId:', userId)
      const { data, error } = await getProfileAdmin(userId)

      if (error) {
        if (error.includes('PGRST116') || error.includes('no rows')) {
          console.warn('No profile found. Attempting to create one...')
          // Auto-create profile if missing
          const { data: { user } } = await supabase.auth.getUser()
          const { error: insertError } = await supabase.from('profiles').insert([
            {
              user_id: userId,
              name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Agent',
              email: user?.email,
              role: 'agent',
              commission_rate: 5
            }
          ]).select().single()

          if (insertError) {
            console.error('Failed to auto-create profile:', insertError)
            setProfile(null)
          } else {
            console.log('Profile auto-created.')
            const { data: newData } = await getProfileAdmin(userId)
            setProfile(newData)
          }
        } else {
          console.error('Profile fetch error:', error)
          setProfile(null)
        }
        return
      }

      if (data?.name?.startsWith('(INACTIVE) ')) {
        console.warn('Deactivated user attempted login')
        await supabase.auth.signOut()
        setProfile(null)
        setUser(null)
        setLoading(false)
        return
      }

      console.log('Profile loaded successfully:', data?.id)
      setProfile(data)
    } catch (err: any) {
      console.error('Fatal error in loadProfile:', err.message)
      setProfile(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      toast.success('Login successful!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
      throw error
    }
  }

  const signUp = async (email: string, password: string, name: string, phone: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (authError) throw authError

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: authData.user?.id,
            name,
            email,
            phone,
            role: 'agent',
          },
        ])
      if (profileError) throw profileError

      toast.success('Registration successful! Please check your email to confirm your account.')
      router.push('/login')
    } catch (error: any) {
      toast.error(error.message || 'Registration failed')
      throw error
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      router.push('/login')
      toast.success('Logged out successfully')
    } catch (error: any) {
      toast.error('Logout failed')
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error

      toast.success('Password reset email sent!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
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
