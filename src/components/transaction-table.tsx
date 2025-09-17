'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { PinAuth } from '@/lib/auth'
import { Transaction, TransactionInput } from '@/lib/types'
import { formatCurrency, getCurrentBusinessDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Minus } from 'lucide-react'
import { debounce } from 'lodash'

interface TransactionTableProps {
  paymentType: 'card' | 'cash'
}

export function TransactionTable({ paymentType }: TransactionTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [rowCount, setRowCount] = useState(12)

  const supabase = createClient()
  const userId = PinAuth.getUserId()
  const businessDate = getCurrentBusinessDate()

  // Load transactions
  const loadTransactions = useCallback(async () => {
    if (!userId) return

    try {
      // Set user context for RLS
      await supabase.rpc('set_current_user_id', { user_id: userId })

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('payment_type', paymentType)
        .eq('business_date', businessDate)
        .order('entry_number')

      if (error) throw error

      setTransactions(data || [])
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, paymentType, businessDate, supabase])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

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
          time: '',
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
        // Set user context for RLS
        await supabase.rpc('set_current_user_id', { user_id: userId })

        const existing = transactions.find(t => t.entry_number === rowData.entry_number)

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('transactions')
            .update({
              time: rowData.time || null,
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
          // Insert new
          const { error } = await supabase
            .from('transactions')
            .insert({
              user_id: userId,
              business_date: businessDate,
              entry_number: rowData.entry_number,
              time: rowData.time || null,
              service: rowData.service || null,
              cash_amount: rowData.cash_amount || null,
              card_amount: rowData.card_amount || null,
              tips: rowData.tips || null,
              note: rowData.note || null,
              payment_type: paymentType
            })

          if (error) throw error
        }

        // Reload to get updated data
        loadTransactions()
      } catch (error) {
        console.error('Error saving transaction:', error)
      }
    }, 500),
    [userId, businessDate, paymentType, transactions, supabase, loadTransactions]
  )

  const handleCellChange = (entryNumber: number, field: keyof TransactionInput, value: string | number) => {
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

  const addRow = () => {
    setRowCount(prev => prev + 1)
  }

  const removeRow = () => {
    if (rowCount > 1) {
      setRowCount(prev => prev - 1)
    }
  }

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>
  }

  const tableRows = getTableRows()
  const totals = calculateTotals()

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold capitalize">{paymentType} Transactions</h3>
          <div className="flex gap-2">
            <Button
              onClick={removeRow}
              disabled={rowCount <= 1}
              size="sm"
              variant="outline"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              onClick={addRow}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-7 bg-gray-50 border-b text-sm font-medium">
            <div className="p-2 text-center">#</div>
            <div className="p-2 text-center">Time</div>
            <div className="p-2 text-center">Service</div>
            <div className="p-2 text-center">Cash</div>
            <div className="p-2 text-center">Card</div>
            <div className="p-2 text-center">Tips</div>
            <div className="p-2 text-center">Note</div>
          </div>

          {/* Data Rows */}
          {tableRows.map((row) => (
            <div key={row.entry_number} className="grid grid-cols-7 border-b hover:bg-gray-50">
              <div className="p-2 text-center font-medium bg-gray-50">
                {row.entry_number}
              </div>

              <div className="p-1">
                <Input
                  type="time"
                  value={row.time || ''}
                  onChange={(e) => handleCellChange(row.entry_number, 'time', e.target.value)}
                  className="h-8 text-sm border-0 shadow-none focus:ring-1"
                />
              </div>

              <div className="p-1">
                <Input
                  type="text"
                  value={row.service || ''}
                  onChange={(e) => handleCellChange(row.entry_number, 'service', e.target.value)}
                  placeholder="Service"
                  className="h-8 text-sm border-0 shadow-none focus:ring-1"
                />
              </div>

              <div className="p-1">
                <Input
                  type="number"
                  step="0.01"
                  value={row.cash_amount || ''}
                  onChange={(e) => handleCellChange(row.entry_number, 'cash_amount', e.target.value)}
                  placeholder="0.00"
                  className="h-8 text-sm border-0 shadow-none focus:ring-1 text-right"
                />
              </div>

              <div className="p-1">
                <Input
                  type="number"
                  step="0.01"
                  value={row.card_amount || ''}
                  onChange={(e) => handleCellChange(row.entry_number, 'card_amount', e.target.value)}
                  placeholder="0.00"
                  className="h-8 text-sm border-0 shadow-none focus:ring-1 text-right"
                />
              </div>

              <div className="p-1">
                <Input
                  type="number"
                  step="0.01"
                  value={row.tips || ''}
                  onChange={(e) => handleCellChange(row.entry_number, 'tips', e.target.value)}
                  placeholder="0.00"
                  className="h-8 text-sm border-0 shadow-none focus:ring-1 text-right"
                />
              </div>

              <div className="p-1">
                <Input
                  type="text"
                  value={row.note || ''}
                  onChange={(e) => handleCellChange(row.entry_number, 'note', e.target.value)}
                  placeholder="Note"
                  className="h-8 text-sm border-0 shadow-none focus:ring-1"
                />
              </div>
            </div>
          ))}

          {/* Totals Row */}
          <div className="grid grid-cols-7 bg-blue-50 font-semibold">
            <div className="p-2 text-center">Total:</div>
            <div className="p-2"></div>
            <div className="p-2"></div>
            <div className="p-2 text-right">${formatCurrency(totals.cash)}</div>
            <div className="p-2 text-right">${formatCurrency(totals.card)}</div>
            <div className="p-2 text-right">${formatCurrency(totals.tips)}</div>
            <div className="p-2"></div>
          </div>
        </div>
      </div>
    </div>
  )
}