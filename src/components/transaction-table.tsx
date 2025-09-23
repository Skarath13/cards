'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase'
import { PinAuth } from '@/lib/auth'
import { Transaction, TransactionInput } from '@/lib/types'
import { formatCurrency, getCurrentBusinessDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Minus, Trash2, Lock, Unlock } from 'lucide-react'
import { debounce } from 'lodash'

interface TransactionTableProps {
  paymentType: 'card' | 'cash'
  addRowTrigger?: number
}

export function TransactionTable({ paymentType, addRowTrigger }: TransactionTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [rowCount, setRowCount] = useState(1)
  const lastRowRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()
  const userId = PinAuth.getUserId()
  const businessDate = getCurrentBusinessDate()

  // Load transactions
  const loadTransactions = useCallback(async () => {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from('transactions_cards')
        .select('*')
        .eq('user_id', userId)
        .eq('payment_type', paymentType)
        .eq('business_date', businessDate)
        .order('entry_number')

      if (error) throw error

      setTransactions(data || [])

      // Set row count based on existing transactions, minimum 1
      const maxEntryNumber = data && data.length > 0
        ? Math.max(...data.map(t => t.entry_number))
        : 0
      setRowCount(Math.max(1, maxEntryNumber))
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, paymentType, businessDate, supabase])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  useEffect(() => {
    if (addRowTrigger && addRowTrigger > 0) {
      addRow()
    }
  }, [addRowTrigger])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Ensure we have at least rowCount rows
  const getTableRows = () => {
    const rows: (Transaction | TransactionInput)[] = []

    for (let i = 1; i <= rowCount; i++) {
      const existing = transactions.find(t => t.entry_number === i)
      if (existing) {
        rows.push(existing)
      } else {
        rows.push({
          entry_number: i,
          payment_type: paymentType,
          service: '',
          cash_amount: undefined,
          card_amount: undefined,
          tips: undefined,
          note: ''
        })
      }
    }

    return rows
  }

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (rowData: TransactionInput) => {
      if (!userId) return

      try {
        const existing = transactions.find(t => t.entry_number === rowData.entry_number)

        // Check if we have a real existing transaction (not a temp one)
        const realExisting = existing && !existing.id.startsWith('temp-')

        if (realExisting) {
          // Update existing
          const { error } = await supabase
            .from('transactions_cards')
            .update({
              service: rowData.service || null,
              cash_amount: rowData.cash_amount || null,
              card_amount: rowData.card_amount || null,
              tips: rowData.tips || null,
              note: rowData.note || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)

          if (error) throw error
        } else {
          // Insert new (either no existing or temp existing)
          const { data, error } = await supabase
            .from('transactions_cards')
            .insert({
              user_id: userId,
              business_date: businessDate,
              entry_number: rowData.entry_number,
              service: rowData.service || null,
              cash_amount: rowData.cash_amount || null,
              card_amount: rowData.card_amount || null,
              tips: rowData.tips || null,
              note: rowData.note || null,
              payment_type: paymentType
            })
            .select()
            .single()

          if (error) throw error

          // Update local state with real ID from database
          if (data) {
            setTransactions(prev =>
              prev.map(t =>
                t.entry_number === rowData.entry_number && t.id.startsWith('temp-')
                  ? { ...data }
                  : t
              )
            )
          }
        }

      } catch (error) {
        console.error('Error saving transaction:', error)
        console.error('Full error object:', JSON.stringify(error, null, 2))
        console.error('Error type:', typeof error)
        console.error('Error details:', {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          name: error?.name,
          stack: error?.stack,
          rowData,
          userId,
          businessDate,
          paymentType
        })

        // Also check if it's a Supabase error specifically
        if (error && typeof error === 'object') {
          console.error('Object keys:', Object.keys(error))
          console.error('Error constructor:', error.constructor?.name)
        }
      }
    }, 200),
    [userId, businessDate, paymentType, transactions, supabase, loadTransactions]
  )

  const handleCellChange = (entryNumber: number, field: keyof TransactionInput, value: string | number) => {
    // Optimistically update the local state first
    setTransactions(prevTransactions => {
      const existingIndex = prevTransactions.findIndex(t => t.entry_number === entryNumber)

      if (existingIndex >= 0) {
        // Update existing transaction
        const updated = [...prevTransactions]
        if (field === 'cash_amount' || field === 'card_amount' || field === 'tips') {
          updated[existingIndex] = {
            ...updated[existingIndex],
            [field]: value === '' ? undefined : Number(value)
          }
        } else {
          updated[existingIndex] = {
            ...updated[existingIndex],
            [field]: value
          }
        }
        return updated
      } else {
        // Create new transaction
        const newTransaction: Transaction = {
          id: `temp-${entryNumber}`, // Temporary ID
          user_id: userId!,
          business_date: businessDate,
          entry_number: entryNumber,
          payment_type: paymentType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          service: field === 'service' ? value as string : '',
          cash_amount: field === 'cash_amount' ? (value === '' ? undefined : Number(value)) : undefined,
          card_amount: field === 'card_amount' ? (value === '' ? undefined : Number(value)) : undefined,
          tips: field === 'tips' ? (value === '' ? undefined : Number(value)) : undefined,
          note: field === 'note' ? value as string : ''
        }
        return [...prevTransactions, newTransaction]
      }
    })

    // Then save to database
    const tableRows = getTableRows()
    const rowIndex = tableRows.findIndex(r => r.entry_number === entryNumber)

    if (rowIndex >= 0) {
      const updatedRow = { ...tableRows[rowIndex] } as TransactionInput

      if (field === 'cash_amount' || field === 'card_amount' || field === 'tips') {
        updatedRow[field] = value === '' ? undefined : Number(value)
      } else {
        (updatedRow as unknown as Record<string, unknown>)[field] = value
      }

      debouncedSave(updatedRow)
    }
  }

  const calculateTotals = () => {
    const tableRows = getTableRows()
    return {
      cash: tableRows.reduce((sum, row) => sum + (row.cash_amount || 0), 0),
      card: tableRows.reduce((sum, row) => sum + (row.card_amount || 0), 0),
      tips: tableRows.reduce((sum, row) => sum + (row.tips || 0), 0)
    }
  }

  const scrollToNewRow = () => {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      if (lastRowRef.current) {
        lastRowRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        })
      }
    }, 100)
  }

  const addRow = async () => {
    const newEntryNumber = rowCount + 1
    setRowCount(newEntryNumber)

    // Create an empty database record immediately when adding a row
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('transactions_cards')
          .insert({
            user_id: userId,
            business_date: businessDate,
            entry_number: newEntryNumber,
            payment_type: paymentType,
            service: null,
            cash_amount: null,
            card_amount: null,
            tips: null,
            note: null
          })
          .select()
          .single()

        if (error) throw error

        // Add the new record to local state
        if (data) {
          setTransactions(prev => [...prev, data])
        }

        // Scroll to the new row
        scrollToNewRow()

      } catch (error) {
        console.error('Error creating new row:', error)
        // Revert rowCount if database insert failed
        setRowCount(prev => prev - 1)
      }
    }
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTargetTurn, setDeleteTargetTurn] = useState<number | null>(null)
  const [lockedTurns, setLockedTurns] = useState<Set<number>>(new Set())
  const [isMounted, setIsMounted] = useState(false)

  const removeRow = () => {
    if (rowCount > 1) {
      setRowCount(prev => prev - 1)
    }
  }

  const deleteTransaction = async (entryNumber: number) => {
    setDeleteTargetTurn(entryNumber)
    setShowDeleteConfirm(true)
  }

  const toggleLockTurn = (entryNumber: number) => {
    setLockedTurns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(entryNumber)) {
        newSet.delete(entryNumber)
      } else {
        newSet.add(entryNumber)
      }
      return newSet
    })
  }

  const confirmDelete = async () => {
    if (deleteTargetTurn) {
      // Find the transaction to delete
      const transactionToDelete = transactions.find(t => t.entry_number === deleteTargetTurn)

      if (transactionToDelete && !transactionToDelete.id.startsWith('temp-')) {
        // Delete from database if it's a real transaction
        try {
          const { error } = await supabase
            .from('transactions_cards')
            .delete()
            .eq('id', transactionToDelete.id)

          if (error) throw error
        } catch (error) {
          console.error('Error deleting transaction:', error)
          // If database delete fails, don't continue with local state update
          setShowDeleteConfirm(false)
          setDeleteTargetTurn(null)
          return
        }
      }

      // Remove from local state and renumber remaining transactions
      const updatedTransactions = transactions
        .filter(t => t.entry_number !== deleteTargetTurn)
        .map((t, index) => ({
          ...t,
          entry_number: index + 1
        }))

      // Update database with new entry numbers for remaining transactions
      if (updatedTransactions.length > 0) {
        try {
          for (const transaction of updatedTransactions) {
            if (!transaction.id.startsWith('temp-')) {
              await supabase
                .from('transactions_cards')
                .update({ entry_number: transaction.entry_number })
                .eq('id', transaction.id)
            }
          }
        } catch (error) {
          console.error('Error renumbering transactions:', error)
        }
      }

      setTransactions(updatedTransactions)
      setRowCount(Math.max(1, updatedTransactions.length))
    }

    setShowDeleteConfirm(false)
    setDeleteTargetTurn(null)
  }

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>
  }

  const tableRows = getTableRows()
  const totals = calculateTotals()

  return (
    <div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-6 bg-gray-50 border-b text-sm font-medium">
            <div className="p-2 text-center">#</div>
            <div className="p-2 text-center">Service</div>
            <div className="p-2 text-center">{paymentType === 'card' ? 'Card' : 'Cash'}</div>
            <div className="p-2 text-center">Tips</div>
            <div className="p-2 text-center">Note</div>
            <div className="p-2 text-center">Actions</div>
          </div>

          {tableRows.map((row, index) => (
            <div
              key={row.entry_number}
              ref={index === tableRows.length - 1 ? lastRowRef : null}
              className={`grid grid-cols-6 border-b hover:bg-gray-50 ${lockedTurns.has(row.entry_number) ? 'bg-gray-100' : ''}`}
            >
              <div className="p-2 text-center font-medium bg-gray-50">
                Turn {row.entry_number}
              </div>
              <div className="p-1">
                <Input
                  type="text"
                  inputMode="text"
                  value={row.service || ''}
                  onChange={(e) => handleCellChange(row.entry_number, 'service', e.target.value)}
                  placeholder="Service"
                  className="h-11 text-sm border-0 shadow-none focus:ring-1"
                  autoComplete="off"
                  autoCorrect="on"
                  autoCapitalize="sentences"
                  disabled={lockedTurns.has(row.entry_number)}
                />
              </div>
              <div className="p-1">
                <Input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={paymentType === 'card' ? (row.card_amount || '') : (row.cash_amount || '')}
                  onChange={(e) => handleCellChange(row.entry_number, paymentType === 'card' ? 'card_amount' : 'cash_amount', e.target.value)}
                  placeholder="0"
                  className="h-11 text-sm border-0 shadow-none focus:ring-1 text-right"
                  autoComplete="transaction-amount"
                  autoCorrect="off"
                  disabled={lockedTurns.has(row.entry_number)}
                />
              </div>
              <div className="p-1">
                <Input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={row.tips || ''}
                  onChange={(e) => handleCellChange(row.entry_number, 'tips', e.target.value)}
                  placeholder="0"
                  className="h-11 text-sm border-0 shadow-none focus:ring-1 text-right"
                  autoComplete="transaction-amount"
                  autoCorrect="off"
                  disabled={lockedTurns.has(row.entry_number)}
                />
              </div>
              <div className="p-1">
                <Input
                  type="text"
                  inputMode="text"
                  value={row.note || ''}
                  onChange={(e) => handleCellChange(row.entry_number, 'note', e.target.value)}
                  placeholder="Notes"
                  className="h-11 text-sm border-0 shadow-none focus:ring-1"
                  autoComplete="off"
                  autoCorrect="on"
                  autoCapitalize="sentences"
                  disabled={lockedTurns.has(row.entry_number)}
                />
              </div>
              <div className="p-1 flex justify-center gap-1">
                <Button
                  onClick={() => toggleLockTurn(row.entry_number)}
                  size="sm"
                  variant="ghost"
                  className="h-11 w-11 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-50 touch-manipulation"
                  aria-label={`${lockedTurns.has(row.entry_number) ? 'Unlock' : 'Lock'} turn ${row.entry_number}`}
                >
                  {lockedTurns.has(row.entry_number) ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={() => deleteTransaction(row.entry_number)}
                  size="sm"
                  variant="ghost"
                  className="h-11 w-11 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 touch-manipulation"
                  aria-label={`Delete turn ${row.entry_number}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="grid grid-cols-6 bg-blue-50 font-semibold">
            <div className="p-2 text-center">Total:</div>
            <div className="p-2"></div>
            <div className="p-2 text-right">${formatCurrency(paymentType === 'card' ? totals.card : totals.cash)}</div>
            <div className="p-2 text-right">${formatCurrency(totals.tips)}</div>
            <div className="p-2"></div>
            <div className="p-2"></div>
          </div>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {tableRows.map((row, index) => (
          <div
            key={row.entry_number}
            ref={index === tableRows.length - 1 ? lastRowRef : null}
            className={`border rounded-lg p-4 shadow-sm ${lockedTurns.has(row.entry_number) ? 'bg-gray-50' : 'bg-white'}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-600">Turn {row.entry_number}</span>
              <div className="flex gap-2">
                <Button
                  onClick={() => toggleLockTurn(row.entry_number)}
                  size="sm"
                  variant="ghost"
                  className="h-9 w-9 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-50 touch-manipulation"
                  aria-label={`${lockedTurns.has(row.entry_number) ? 'Unlock' : 'Lock'} turn ${row.entry_number}`}
                >
                  {lockedTurns.has(row.entry_number) ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={() => deleteTransaction(row.entry_number)}
                  size="sm"
                  variant="ghost"
                  className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 touch-manipulation"
                  aria-label={`Delete turn ${row.entry_number}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Service</label>
                <Input
                  type="text"
                  inputMode="text"
                  value={row.service || ''}
                  onChange={(e) => handleCellChange(row.entry_number, 'service', e.target.value)}
                  placeholder="Service"
                  className="h-12 text-base border focus:ring-2"
                  autoComplete="off"
                  autoCorrect="on"
                  autoCapitalize="sentences"
                  disabled={lockedTurns.has(row.entry_number)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{paymentType === 'card' ? 'Card' : 'Cash'}</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    value={paymentType === 'card' ? (row.card_amount || '') : (row.cash_amount || '')}
                    onChange={(e) => handleCellChange(row.entry_number, paymentType === 'card' ? 'card_amount' : 'cash_amount', e.target.value)}
                    placeholder="0"
                    className="h-12 text-base border focus:ring-2 text-right"
                    autoComplete="transaction-amount"
                    autoCorrect="off"
                    disabled={lockedTurns.has(row.entry_number)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tips</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    value={row.tips || ''}
                    onChange={(e) => handleCellChange(row.entry_number, 'tips', e.target.value)}
                    placeholder="0"
                    className="h-12 text-base border focus:ring-2 text-right"
                    autoComplete="transaction-amount"
                    autoCorrect="off"
                    disabled={lockedTurns.has(row.entry_number)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
                <Input
                  type="text"
                  inputMode="text"
                  value={row.note || ''}
                  onChange={(e) => handleCellChange(row.entry_number, 'note', e.target.value)}
                  placeholder="Notes"
                  className="h-12 text-base border focus:ring-2"
                  autoComplete="off"
                  autoCorrect="on"
                  autoCapitalize="sentences"
                  disabled={lockedTurns.has(row.entry_number)}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Mobile Totals */}
        <div className="bg-blue-50 rounded-lg p-4 mt-6">
          <h4 className="font-semibold text-gray-800 mb-3">Totals</h4>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-600 mb-1">{paymentType === 'card' ? 'Card' : 'Cash'}</div>
              <div className="text-lg font-semibold">${formatCurrency(paymentType === 'card' ? totals.card : totals.cash)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Tips</div>
              <div className="text-lg font-semibold">${formatCurrency(totals.tips)}</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200 text-center">
            <div className="text-sm text-gray-600">Grand Total</div>
            <div className="text-xl font-bold">${formatCurrency((paymentType === 'card' ? totals.card : totals.cash) + totals.tips)}</div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal - Using Portal for proper positioning */}
      {isMounted && showDeleteConfirm && deleteTargetTurn &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999
            }}
          >
            <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-200 w-80 mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Delete Turn {deleteTargetTurn}?</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Are you sure you want to delete Turn {deleteTargetTurn}? Any data in that turn will be lost.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Delete Turn
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </div>
  )
}