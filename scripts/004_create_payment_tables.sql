-- Create payments table to track all transactions
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  product_id TEXT NOT NULL,
  product_category TEXT NOT NULL CHECK (product_category IN ('donation', 'consultation')),
  amount_cents INTEGER NOT NULL,
  amount_currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create donations table for tracking charitable donations
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  purpose TEXT,
  anonymous BOOLEAN DEFAULT FALSE,
  receipt_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create consultation_payments table for tracking consultation bookings
CREATE TABLE IF NOT EXISTS consultation_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('video', 'audio', 'chat')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for donations
CREATE POLICY "Users can view their donations"
  ON donations FOR SELECT
  USING (auth.uid() = user_id OR anonymous = FALSE);

CREATE POLICY "Users can insert donations"
  ON donations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for consultation_payments
CREATE POLICY "Users can view their consultation payments"
  ON consultation_payments FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = provider_id);

CREATE POLICY "Patients can book consultations"
  ON consultation_payments FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- Create indexes for better query performance
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_product_id ON payments(product_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_donations_user_id ON donations(user_id);
CREATE INDEX idx_consultation_payments_patient_id ON consultation_payments(patient_id);
CREATE INDEX idx_consultation_payments_provider_id ON consultation_payments(provider_id);
