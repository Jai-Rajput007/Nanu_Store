-- Add display order_id (e.g. SBK-XXXXX) to orders. Run this if your orders table already exists.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_id TEXT UNIQUE;
