"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  full_name: string
  role: 'student' | 'instructor' | 'admin'
  avatar_url: string | null
  is_active: boolean
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch student profile from the public.profiles database table
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.warn('AuthProvider: Profile row missing in database, falling back to session metadata:', error.message)
        
        // Fetch current session user metadata as a temporary local fallback
        const { data: { session } } = await supabase.auth.getSession()
        const currentUser = session?.user
        
        setProfile({
          id: userId,
          full_name: currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || 'New Student',
          role: 'student',
          avatar_url: currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture || null,
          is_active: true
        })
      } else {
        const profileData = data as Profile
        console.log("AuthProvider: Profile loaded successfully from DB:", profileData)
        if (!profileData.avatar_url) {
          const { data: { session } } = await supabase.auth.getSession()
          profileData.avatar_url = session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture || null
        }
        setProfile(profileData)
      }
    } catch (err) {
      console.error('Unexpected profile load error:', err)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      console.error('Google Sign-In failed:', error.message)
      throw error
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout failed:', error.message)
    }
    setUser(null)
    setProfile(null)
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        }
      } catch (err) {
        console.error('Error fetching initial auth session:', err)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen to session state modifications
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
