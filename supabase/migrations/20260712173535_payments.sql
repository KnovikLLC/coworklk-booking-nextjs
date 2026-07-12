-- Doc: docs/cowork-booking-architecture.md §3.2 `payments` (lines 532-573)

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'LKR',
  method payment_method NOT NULL,
  status payment_status DEFAULT 'pending',

  -- Gateway response
  gateway_transaction_id VARCHAR(100),
  gateway_response JSONB,

  -- For QR payments
  qr_confirmed_by UUID REFERENCES users(id),
  qr_confirmation_note TEXT,

  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_booking ON payments(booking_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM bookings b WHERE b.id = payments.booking_id AND b.user_id = auth.uid())
  );

CREATE POLICY "Admins can view all payments" ON payments
  FOR ALL USING (is_staff());
