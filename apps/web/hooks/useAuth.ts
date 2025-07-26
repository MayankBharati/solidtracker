'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@time-tracker/api'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const currentUser = await auth.getCurrentUser()
      setUser(currentUser)
      
      if (!currentUser && typeof window !== 'undefined') {
        router.push('/login')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      if (typeof window !== 'undefined') {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await auth.signOut()
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return { user, loading, logout }
}