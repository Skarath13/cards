'use client'

import { useState, useEffect } from 'react'
import { PinAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Smartphone } from 'lucide-react'

interface PinAuthProps {
  onAuthenticated: () => void
}

export function PinAuthComponent({ onAuthenticated }: PinAuthProps) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [isSetup, setIsSetup] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setIsSetup(PinAuth.hasPin())
  }, [])

  const handleSetupPin = async () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits')
      return
    }

    if (pin !== confirmPin) {
      setError('PINs do not match')
      return
    }

    setLoading(true)
    try {
      const userId = await PinAuth.setPin(pin)
      if (userId) {
        onAuthenticated()
      } else {
        setError('Invalid PIN')
      }
    } catch {
      setError('Failed to verify PIN')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (pin.length < 4) {
      setError('Please enter your PIN')
      return
    }

    setLoading(true)
    try {
      const success = await PinAuth.verifyPin(pin)
      if (success) {
        onAuthenticated()
      } else {
        setError('Invalid PIN')
        setPin('')
      }
    } catch {
      setError('Failed to verify PIN')
    } finally {
      setLoading(false)
    }
  }

  const handlePinChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '')
    setPin(numericValue)
    setError('')
  }

  const handleConfirmPinChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '')
    setConfirmPin(numericValue)
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            {isSetup ? <Lock className="h-8 w-8 text-white" /> : <Smartphone className="h-8 w-8 text-white" />}
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Cards
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your 4-digit PIN to continue
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                maxLength={4}
                className="h-14 text-center text-2xl tracking-widest"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="text-sm p-3 rounded bg-red-100 text-red-700 text-center">
              {error}
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={loading || pin.length < 4}
            className="w-full h-14 text-lg"
          >
            {loading ? 'Loading...' : 'Enter'}
          </Button>
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>Session expires after 30 minutes of inactivity</p>
        </div>
      </div>
    </div>
  )
}