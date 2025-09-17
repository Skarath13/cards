-- Cards PWA Database Setup Script
-- Run this in your Supabase SQL Editor

-- Create transactions table with _cards suffix
CREATE TABLE IF NOT EXISTS transactions_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  business_date DATE NOT NULL,
  entry_number INTEGER NOT NULL,
  time TIME,
  service TEXT,
  cash_amount DECIMAL(10,2),
  card_amount DECIMAL(10,2),
  tips DECIMAL(10,2),
  note TEXT,
  payment_type TEXT CHECK (payment_type IN ('card', 'cash')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create archived transactions table with _cards suffix
CREATE TABLE IF NOT EXISTS archived_transactions_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  business_date DATE NOT NULL,
  entry_number INTEGER NOT NULL,
  time TIME,
  service TEXT,
  cash_amount DECIMAL(10,2),
  card_amount DECIMAL(10,2),
  tips DECIMAL(10,2),
  note TEXT,
  payment_type TEXT CHECK (payment_type IN ('card', 'cash')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_cards_user_date
ON transactions_cards (user_id, business_date);

CREATE INDEX IF NOT EXISTS idx_transactions_cards_payment_type
ON transactions_cards (payment_type);

CREATE INDEX IF NOT EXISTS idx_archived_transactions_cards_user_date
ON archived_transactions_cards (user_id, business_date);

-- Enable Row Level Security
ALTER TABLE transactions_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_transactions_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transactions_cards
CREATE POLICY "Users can view own current day transactions_cards"
ON transactions_cards FOR SELECT
USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert own transactions_cards"
ON transactions_cards FOR INSERT
WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update own current day transactions_cards"
ON transactions_cards FOR UPDATE
USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can delete own transactions_cards"
ON transactions_cards FOR DELETE
USING (user_id = current_setting('app.current_user_id', true));

-- Create RLS policies for archived transactions_cards
CREATE POLICY "Users can view own archived transactions_cards"
ON archived_transactions_cards FOR SELECT
USING (user_id = current_setting('app.current_user_id', true));

-- Function to set current user context
CREATE OR REPLACE FUNCTION set_current_user_id(user_id TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql;

-- Create a function to archive transactions_cards (for cron job)
CREATE OR REPLACE FUNCTION archive_daily_transactions_cards()
RETURNS void AS $$
DECLARE
  today_pst DATE;
BEGIN
  -- Get current date in PST
  today_pst := (NOW() AT TIME ZONE 'America/Los_Angeles')::DATE;

  -- Insert current transactions into archive
  INSERT INTO archived_transactions_cards (
    user_id, business_date, entry_number, time, service,
    cash_amount, card_amount, tips, note, payment_type,
    created_at, updated_at, archived_at
  )
  SELECT
    user_id, business_date, entry_number, time, service,
    cash_amount, card_amount, tips, note, payment_type,
    created_at, updated_at, NOW()
  FROM transactions_cards
  WHERE business_date = today_pst;

  -- Delete archived transactions from main table
  DELETE FROM transactions_cards WHERE business_date = today_pst;
END;
$$ LANGUAGE plpgsql;