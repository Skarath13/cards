ALTER TABLE transactions_cards ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
ALTER TABLE archived_transactions_cards ALTER COLUMN user_id TYPE UUID USING user_id::uuid;