'use client'

import { useState, useEffect, useRef } from 'react'
import { PinAuth } from '@/lib/auth'
import { getCurrentBusinessDate } from '@/lib/utils'
import { TransactionTable } from './transaction-table'
import { Button } from '@/components/ui/button'
import { LogOut, Calendar, CreditCard, Banknote, Plus } from 'lucide-react'

interface DashboardProps {
  onLogout: () => void
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'card' | 'cash'>('card')
  const [currentDate, setCurrentDate] = useState('')
  const [userData, setUserData] = useState<{ id: string; name: string; role: string; timezone: string } | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [addRowTrigger, setAddRowTrigger] = useState(0)
  const [isAddingRow, setIsAddingRow] = useState(false)
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const contentRef = useRef<HTMLDivElement>(null)

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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return

    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && activeTab === 'card') {
      switchTab('cash')
    }
    if (isRightSwipe && activeTab === 'cash') {
      switchTab('card')
    }

    // Reset
    touchStartX.current = 0
    touchEndX.current = 0
  }

  const switchTab = (tab: 'card' | 'cash') => {
    if (tab === activeTab || isTransitioning) return

    setIsTransitioning(true)
    setActiveTab(tab)

    // Reset transition state after animation
    setTimeout(() => {
      setIsTransitioning(false)
    }, 300)
  }

  const handleAddRow = () => {
    setIsAddingRow(true)
    setAddRowTrigger(prev => prev + 1)

    // Reset animation after a delay
    setTimeout(() => {
      setIsAddingRow(false)
    }, 600)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-bold text-gray-900">Cards</h1>
                  {userData && (
                    <div className="flex items-center text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                      <span className="font-medium">{userData.name}</span>
                      <span className="ml-2 text-xs bg-blue-100 px-2 py-0.5 rounded uppercase tracking-wide">
                        {userData.role}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{formatDisplayDate(currentDate)}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="default"
                onClick={handleLogout}
                className="h-12 w-12 p-0"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Custom Tab Design */}
        <div className="mb-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 mb-6">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => switchTab('card')}
                className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'card'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span className="text-base">Card</span>
              </button>
              <button
                onClick={() => switchTab('cash')}
                className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'cash'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Banknote className="h-5 w-5" />
                <span className="text-base">Cash</span>
              </button>
            </div>
          </div>


          {/* Content Area with Swipe Support */}
          <div
            ref={contentRef}
            className="relative overflow-hidden rounded-2xl"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className={`transition-transform duration-300 ease-in-out ${
                isTransitioning ? 'transform-gpu' : ''
              }`}
              style={{
                transform: `translateX(${activeTab === 'card' ? '0%' : '-100%'})`,
              }}
            >
              <div className="flex w-[200%]">
                {/* Card Content */}
                <div className="w-1/2 pr-4">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/20 rounded-lg">
                            <CreditCard className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-white">Card Transactions</h2>
                            <p className="text-blue-100 text-sm">Track your card payments</p>
                          </div>
                        </div>
                        {activeTab === 'card' && (
                          <Button
                            onClick={handleAddRow}
                            size="sm"
                            variant="ghost"
                            className={`h-10 w-10 p-0 text-white hover:bg-white/20 touch-manipulation border border-white/20 transition-all duration-300 ${
                              isAddingRow ? 'scale-75 rotate-90' : 'scale-100 rotate-0'
                            }`}
                            aria-label="Add transaction"
                          >
                            <Plus className={`h-5 w-5 transition-all duration-300 ${
                              isAddingRow ? 'rotate-180' : 'rotate-0'
                            }`} />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="p-6">
                      <TransactionTable paymentType="card" addRowTrigger={activeTab === 'card' ? addRowTrigger : 0} />
                    </div>
                  </div>
                </div>

                {/* Cash Content */}
                <div className="w-1/2 pl-4">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/20 rounded-lg">
                            <Banknote className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-white">Cash Transactions</h2>
                            <p className="text-emerald-100 text-sm">Track your cash payments</p>
                          </div>
                        </div>
                        {activeTab === 'cash' && (
                          <Button
                            onClick={handleAddRow}
                            size="sm"
                            variant="ghost"
                            className={`h-10 w-10 p-0 text-white hover:bg-white/20 touch-manipulation border border-white/20 transition-all duration-300 ${
                              isAddingRow ? 'scale-75 rotate-90' : 'scale-100 rotate-0'
                            }`}
                            aria-label="Add transaction"
                          >
                            <Plus className={`h-5 w-5 transition-all duration-300 ${
                              isAddingRow ? 'rotate-180' : 'rotate-0'
                            }`} />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="p-6">
                      <TransactionTable paymentType="cash" addRowTrigger={activeTab === 'cash' ? addRowTrigger : 0} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}