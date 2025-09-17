'use client'

import { useState, useEffect } from 'react'
import { PinAuth } from '@/lib/auth'
import { PinAuthComponent } from '@/components/auth/pin-auth'
import { Dashboard } from '@/components/dashboard'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = () => {
      setIsAuthenticated(PinAuth.isAuthenticated())
      setLoading(false)
    }

    checkAuth()
  }, [])

  const handleAuthenticated = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <PinAuthComponent onAuthenticated={handleAuthenticated} />
  }

  return <Dashboard onLogout={handleLogout} />
}