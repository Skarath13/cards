export interface Transaction {
  id: string
  user_id: string
  business_date: string
  entry_number: number
  time?: string
  service?: string
  cash_amount?: number
  card_amount?: number
  tips?: number
  note?: string
  payment_type: 'card' | 'cash'
  created_at: string
  updated_at: string
}

export interface TransactionInput {
  entry_number: number
  time?: string
  service?: string
  cash_amount?: number
  card_amount?: number
  tips?: number
  note?: string
  payment_type: 'card' | 'cash'
}

export interface User {
  id: string
  name: string
  pin_code: string
  role: 'admin' | 'manager' | 'technician'
  allowed_locations: string[] | null
  created_at: string
  updated_at: string
  auth_user_id: string | null
  session_start_time: string
  session_end_time: string
  timezone: string
}