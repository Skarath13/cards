'use client'

import { useState, useEffect } from 'react'
import { PinAuth } from '@/lib/auth'
import { getCurrentBusinessDate } from '@/lib/utils'
import { TransactionTable } from './transaction-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { LogOut, Calendar, Eye, EyeOff } from 'lucide-react'

interface DashboardProps {
  onLogout: () => void
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'card' | 'cash'>('card')
  const [privacyMode, setPrivacyMode] = useState(false)
  const [currentDate, setCurrentDate] = useState('')
  const [userData, setUserData] = useState<{ id: string; name: string; role: string; timezone: string } | null>(null)

  useEffect(() => {
    setCurrentDate(getCurrentBusinessDate())
    setUserData(PinAuth.getUserData())

    // Check authentication periodically
    const authCheck = setInterval(() => {
      if (!PinAuth.isAuthenticated()) {
        onLogout()
      }
    }, 60000) // Check every minute

    return () => clearInterval(authCheck)
  }, [onLogout])

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Los_Angeles'
    })
  }

  const handleLogout = () => {
    PinAuth.logout()
    onLogout()
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${privacyMode ? 'blur-sm' : ''}`}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Cards</h1>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{formatDisplayDate(currentDate)}</span>
              </div>
              {userData && (
                <div className="flex items-center text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                  <span className="font-medium">{userData.name}</span>
                  <span className="ml-2 text-xs bg-blue-100 px-2 py-0.5 rounded uppercase tracking-wide">
                    {userData.role}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPrivacyMode(!privacyMode)}
              >
                {privacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'card' | 'cash')}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="card" className="text-lg py-3">
              Card Transactions
            </TabsTrigger>
            <TabsTrigger value="cash" className="text-lg py-3">
              Cash Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="space-y-6">
            <TransactionTable paymentType="card" />
          </TabsContent>

          <TabsContent value="cash" className="space-y-6">
            <TransactionTable paymentType="cash" />
          </TabsContent>
        </Tabs>
      </main>

      {/* Privacy Mode Overlay */}
      {privacyMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <EyeOff className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-semibold mb-2">Privacy Mode Active</h3>
            <p className="text-gray-600 mb-4">Data is hidden for privacy</p>
            <Button onClick={() => setPrivacyMode(false)}>
              Show Data
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}