-- Create store_settings table for configurable delivery fee and other settings
CREATE TABLE IF NOT EXISTS store_settings (
  id SERIAL PRIMARY KEY,
  delivery_fee INTEGER DEFAULT 20,
  store_name TEXT DEFAULT 'Shree Bhagvan Singh Kirana Store',
  contact_phone TEXT DEFAULT '7828303292',
  enable_cod BOOLEAN DEFAULT true,
  enable_qr_payment BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings row (id=1)
INSERT INTO store_settings (id, delivery_fee, store_name, contact_phone, enable_cod, enable_qr_payment)
VALUES (1, 20, 'Shree Bhagvan Singh Kirana Store', '7828303292', true, true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings
CREATE POLICY "Allow public read access to store settings" 
  ON store_settings FOR SELECT TO authenticated, anon 
  USING (true);

-- Allow only admin to update settings
CREATE POLICY "Allow admin to update store settings" 
  ON store_settings FOR UPDATE TO authenticated 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Allow only admin to insert settings
CREATE POLICY "Allow admin to insert store settings" 
  ON store_settings FOR INSERT TO authenticated 
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
