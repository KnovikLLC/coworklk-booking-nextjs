# Cowork.lk Booking Engine — Technical Architecture

**Version:** 1.0  
**Date:** July 2, 2026  
**Author:** Architecture Review  
**Client:** Cowork Lanka (Private) Limited  

---

## Executive Summary

This document defines the technical architecture for cowork.lk — a booking engine and website for Cowork's coworking space in Pannipitiya, Sri Lanka. The system enables real-time space booking, payment processing, and automated Zoho Books integration.

**Key Constraints:**
- Timeline: 4 weeks (MVP)
- Budget: < LKR 500,000
- Solo developer: Madusanka
- Tech stack: Next.js 14 + Supabase

---

## Table of Contents

1. [Scope Definition](#1-scope-definition)
2. [System Architecture](#2-system-architecture)
3. [Database Schema](#3-database-schema)
4. [API Specification](#4-api-specification)
5. [Zoho Books Integration](#5-zoho-books-integration)
6. [Payment Gateway Integration](#6-payment-gateway-integration)
7. [Booking State Machine](#7-booking-state-machine)
8. [User Profiles & Member Loyalty](#8-user-profiles--member-loyalty)
9. [Frontend Pages](#9-frontend-pages)
10. [Admin Dashboard](#10-admin-dashboard)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Development Timeline](#12-development-timeline)
13. [Risk Register](#13-risk-register)

---

## 1. Scope Definition

### 1.1 MVP Scope (Weeks 1-4)

| Feature | Status |
|---------|--------|
| Public website (Home, About, Booking, Contact) | ✅ In Scope |
| Space catalog with real-time availability | ✅ In Scope |
| Immediate booking + payment (Hot Desk, Meeting Rooms) | ✅ In Scope |
| **Guest checkout (no account required)** | ✅ In Scope |
| **Member signup/login** | ✅ In Scope |
| **Member profile page (view bookings, discount status)** | ✅ In Scope |
| **10% loyalty discount (within 30 days of last booking)** | ✅ In Scope |
| **Auto profile creation prompt after guest booking** | ✅ In Scope |
| PayHere payment integration | ✅ In Scope |
| QR payment (manual confirmation) | ✅ In Scope |
| **Zoho Books — product/price sync service (Zoho is source of truth)** | ✅ In Scope |
| Zoho Books — auto-create invoice on confirmed booking | ✅ In Scope |
| Zoho Books — sync customer records | ✅ In Scope |
| **Admin — Zoho sync dashboard (manual trigger + status)** | ✅ In Scope |
| Admin dashboard — view bookings + availability | ✅ In Scope |
| Admin dashboard — create bookings (walk-ins) | ✅ In Scope |
| Email notifications (booking confirmation) | ✅ In Scope |
| Partial refund cancellation policy | ✅ In Scope |

### 1.2 Phase 2 Scope (Weeks 5-8)

| Feature | Status |
|---------|--------|
| Quotation flow for corporate/bulk bookings | Phase 2 |
| Stripe payment integration | Phase 2 |
| Admin — modify/cancel bookings with refunds | Phase 2 |
| SMS notifications (Dialog gateway) | Phase 2 |
| Monthly membership packages | Phase 2 |
| Customer portal — download invoices | Phase 2 |
| Delete account (GDPR) | Phase 2 |

### 1.3 Out of Scope

- Mobile app
- Multi-location support
- Staff scheduling
- POS integration
- Inventory management

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│                    Next.js 14 (App Router)                          │
│              Deployed on Vercel (cowork.lk)                         │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          │ REST API / Supabase Client
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           BACKEND                                    │
│                         Supabase                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │ PostgreSQL  │  │    Auth     │  │   Storage   │                 │
│  │  Database   │  │   (Users)   │  │  (Images)   │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│  ┌─────────────┐  ┌─────────────┐                                   │
│  │  Realtime   │  │    Edge     │                                   │
│  │(Availability)│  │  Functions  │                                   │
│  └─────────────┘  └─────────────┘                                   │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   PayHere   │   │ Zoho Books  │   │    Email    │
│   Gateway   │   │     API     │   │   (SMTP)    │
└─────────────┘   └─────────────┘   └─────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| Frontend | Next.js 14 (App Router) | SSR, SEO, React ecosystem |
| Styling | Tailwind CSS + shadcn/ui | Rapid development, consistent UI |
| Backend | Supabase | Real-time, PostgreSQL, built-in auth |
| Database | PostgreSQL (via Supabase) | Relational, robust, free tier |
| Auth | Supabase Auth | Email + phone, admin roles |
| File Storage | Supabase Storage | Space images, receipts |
| Payment | PayHere | Sri Lankan market, LKR native |
| Invoicing | Zoho Books API | Existing system integration |
| Email | Resend or Nodemailer | Transactional emails |
| Hosting | Vercel (frontend) | Free tier, global CDN |
| Domain | cowork.lk | Already owned |

### 2.3 External Service Dependencies

| Service | Purpose | Criticality |
|---------|---------|-------------|
| Supabase | Core backend | Critical |
| PayHere | Payment processing | Critical |
| Zoho Books | Invoice generation | High |
| Vercel | Frontend hosting | Critical |
| Resend/SMTP | Email notifications | Medium |

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    spaces    │       │   bookings   │       │    users     │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │───┐   │ id (PK)      │   ┌───│ id (PK)      │
│ name         │   │   │ space_id(FK) │◄──┘   │ email        │
│ type         │   │   │ user_id (FK) │◄──────│ phone        │
│ capacity     │   └──►│ pricing_id   │       │ full_name    │
│ description  │       │ date         │       │ zoho_id      │
│ image_url    │       │ slot         │       │ role         │
│ amenities    │       │ status       │       └──────────────┘
│ is_active    │       │ total_amount │
└──────────────┘       │ payment_ref  │       ┌──────────────┐
                       │ zoho_inv_id  │       │   payments   │
┌──────────────┐       │ created_at   │       ├──────────────┤
│   pricing    │       └──────────────┘       │ id (PK)      │
├──────────────┤              │               │ booking_id   │
│ id (PK)      │              │               │ amount       │
│ space_id(FK) │◄─────────────┘               │ method       │
│ duration     │                              │ gateway_ref  │
│ slot_type    │                              │ status       │
│ price        │                              │ paid_at      │
│ zoho_item_id │                              └──────────────┘
│ description  │
└──────────────┘
```

### 3.2 Table Definitions

#### `spaces` — Bookable Resources

```sql
CREATE TABLE spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('hot_desk', 'workspace', 'meeting_room_4', 'meeting_room_4_black', 'meeting_room_5', 'lobby', 'creative_studio', 'classroom')),
  capacity INT NOT NULL DEFAULT 1,
  description TEXT,
  image_url VARCHAR(500),
  amenities JSONB DEFAULT '[]',
  requires_specific_seat BOOLEAN DEFAULT FALSE,
  total_inventory INT NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO spaces (name, type, capacity, total_inventory, requires_specific_seat) VALUES
('Hot Desk', 'hot_desk', 1, 10, FALSE),
('Workspace Seat', 'workspace', 1, 8, FALSE),
('4-Seater Meeting Room', 'meeting_room_4', 4, 1, TRUE),
('4-Seater Black Meeting Room', 'meeting_room_4_black', 4, 1, TRUE),
('5-Seater Meeting Room', 'meeting_room_5', 5, 1, TRUE),
('Lobby Area', 'lobby', 10, 1, TRUE);
```

#### `pricing` — Price Options with Zoho Mapping

```sql
CREATE TABLE pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  duration VARCHAR(20) NOT NULL CHECK (duration IN ('half_day', 'full_day', 'unlimited', '1hr', '2hr', '30min')),
  slot_type VARCHAR(20) DEFAULT 'any' CHECK (slot_type IN ('morning', 'afternoon', 'evening', 'night', 'any')),
  price DECIMAL(10,2) NOT NULL,
  zoho_item_id VARCHAR(50) NOT NULL,
  zoho_item_name VARCHAR(200),
  description TEXT,
  includes_data_gb INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hot Desk pricing (mapped to Zoho)
INSERT INTO pricing (space_id, duration, price, zoho_item_id, zoho_item_name, description) VALUES
((SELECT id FROM spaces WHERE type='hot_desk'), 'half_day', 490, '4944213000001171243', 'Hot Desk - Half Daytime', '4hrs (8am-12pm or 12pm-4pm)'),
((SELECT id FROM spaces WHERE type='hot_desk'), 'full_day', 790, '4944213000001171232', 'Hot Desk Full Day', '8hrs (8am-5pm)'),
((SELECT id FROM spaces WHERE type='hot_desk'), 'unlimited', 990, '4944213000001171254', 'Hot Desk - Daily Unlimited', '12hrs (8am-8pm)');

-- Workspace pricing
INSERT INTO pricing (space_id, duration, price, zoho_item_id, zoho_item_name, description) VALUES
((SELECT id FROM spaces WHERE type='workspace'), 'half_day', 790, '4944213000000084278', 'Workspace - Half Day', '4hrs access'),
((SELECT id FROM spaces WHERE type='workspace'), 'full_day', 1000, '4944213000000084226', 'Workspace - Full Daytime', '8hrs (8am-5pm)'),
((SELECT id FROM spaces WHERE type='workspace'), 'unlimited', 1350, '4944213000000100027', 'Workspace - Daily Unlimited', '12hrs (8am-8pm)');

-- 4-Seater Meeting Room pricing
INSERT INTO pricing (space_id, duration, price, zoho_item_id, zoho_item_name, includes_data_gb) VALUES
((SELECT id FROM spaces WHERE type='meeting_room_4'), 'half_day', 3450, '4944213000000154001', '4 Seater Private Room - Half Day', 4),
((SELECT id FROM spaces WHERE type='meeting_room_4'), 'full_day', 4950, '4944213000000152001', '4 Seater Private Room - Full Day', 8),
((SELECT id FROM spaces WHERE type='meeting_room_4'), 'unlimited', 5950, '4944213000000175001', '4 Seater Private Room - Unlimited Day Access', 8);

-- 4-Seater Black Meeting Room pricing
INSERT INTO pricing (space_id, duration, price, zoho_item_id, zoho_item_name, includes_data_gb) VALUES
((SELECT id FROM spaces WHERE type='meeting_room_4_black'), 'half_day', 3450, '4944213000001985001', '4 Seater Black Private Room - Half Day', 4),
((SELECT id FROM spaces WHERE type='meeting_room_4_black'), 'full_day', 4950, '4944213000001985012', '4 Seater Black Private Room - Full Day', 8),
((SELECT id FROM spaces WHERE type='meeting_room_4_black'), 'unlimited', 5950, '4944213000001983049', '4 Seater Black Private Room - Unlimited Day Access', 8);

-- 5-Seater Meeting Room pricing
INSERT INTO pricing (space_id, duration, price, zoho_item_id, zoho_item_name, includes_data_gb) VALUES
((SELECT id FROM spaces WHERE type='meeting_room_5'), 'half_day', 3950, '4944213000001171199', '5 Seater Private Room - Half Day', 5),
((SELECT id FROM spaces WHERE type='meeting_room_5'), 'full_day', 5950, '4944213000001171210', '5 Seater Private Room - Full Day', 10),
((SELECT id FROM spaces WHERE type='meeting_room_5'), 'unlimited', 6750, '4944213000001171221', '5 Seater Private Room - Unlimited Day Access', 15);

-- Lobby Area pricing
INSERT INTO pricing (space_id, duration, price, zoho_item_id, zoho_item_name) VALUES
((SELECT id FROM spaces WHERE type='lobby'), '1hr', 1200, '4944213000001171476', 'Lobby Area Meeting for 1h | Max 3 Pax'),
((SELECT id FROM spaces WHERE type='lobby'), '2hr', 6500, '4944213000001171487', 'Lobby Area Meeting for 2h | Maximum 10 Pax');
```

#### `users` — Customer & Admin Accounts

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  full_name VARCHAR(200),
  company_name VARCHAR(200),
  zoho_contact_id VARCHAR(50),
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'frontdesk')),
  
  -- Membership & Loyalty
  is_member BOOLEAN DEFAULT FALSE,
  member_since TIMESTAMPTZ,
  last_booking_date DATE,
  total_bookings INT DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'frontdesk'))
  );

-- Function to check if user qualifies for member discount (booked within last 30 days)
CREATE OR REPLACE FUNCTION check_member_discount(p_user_id UUID)
RETURNS TABLE (
  eligible BOOLEAN,
  discount_percent INT,
  last_booking DATE,
  days_since_last_booking INT
) AS $$
DECLARE
  v_last_booking DATE;
  v_days_since INT;
BEGIN
  -- Get last completed booking date for this user
  SELECT MAX(booking_date) INTO v_last_booking
  FROM bookings
  WHERE user_id = p_user_id
    AND status IN ('completed', 'confirmed', 'checked_in');
  
  IF v_last_booking IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, NULL::DATE, NULL::INT;
    RETURN;
  END IF;
  
  v_days_since := CURRENT_DATE - v_last_booking;
  
  -- Eligible for 10% discount if last booking was within 30 days
  IF v_days_since <= 30 THEN
    RETURN QUERY SELECT TRUE, 10, v_last_booking, v_days_since;
  ELSE
    RETURN QUERY SELECT FALSE, 0, v_last_booking, v_days_since;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

#### `guest_profiles` — For Guest Bookings (Pre-Registration)

```sql
-- Stores guest info before they create an account
-- Allows "Continue as Guest" flow with optional account creation later
CREATE TABLE guest_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  full_name VARCHAR(200),
  
  -- Link to user if they later create an account
  converted_to_user_id UUID REFERENCES users(id),
  converted_at TIMESTAMPTZ,
  
  -- Tracking
  total_bookings INT DEFAULT 0,
  last_booking_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(email)
);

-- Function to convert guest to member after booking
CREATE OR REPLACE FUNCTION convert_guest_to_member(
  p_guest_email VARCHAR,
  p_password VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_guest_profile guest_profiles%ROWTYPE;
  v_new_user_id UUID;
BEGIN
  -- Get guest profile
  SELECT * INTO v_guest_profile FROM guest_profiles WHERE email = p_guest_email;
  
  IF v_guest_profile IS NULL THEN
    RAISE EXCEPTION 'Guest profile not found for email: %', p_guest_email;
  END IF;
  
  IF v_guest_profile.converted_to_user_id IS NOT NULL THEN
    RETURN v_guest_profile.converted_to_user_id;
  END IF;
  
  -- Create auth user (handled by application layer with Supabase Auth)
  -- This function just links the guest profile to the new user
  
  RETURN v_new_user_id;
END;
$$ LANGUAGE plpgsql;
```

#### `bookings` — Core Booking Entity

```sql
CREATE TYPE booking_status AS ENUM (
  'pending_payment',
  'confirmed',
  'checked_in',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE time_slot AS ENUM (
  'morning',    -- 8am - 12pm
  'afternoon',  -- 12pm - 4pm
  'evening',    -- 4pm - 8pm
  'night',      -- 8pm - 12am
  'full_day',   -- 8am - 5pm
  'unlimited'   -- 8am - 8pm
);

CREATE TYPE booking_type AS ENUM (
  'member',     -- Registered user booking
  'guest'       -- Guest checkout (no account)
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number VARCHAR(20) UNIQUE NOT NULL,
  space_id UUID NOT NULL REFERENCES spaces(id),
  pricing_id UUID NOT NULL REFERENCES pricing(id),
  
  -- User reference (NULL for guest bookings)
  user_id UUID REFERENCES users(id),
  guest_profile_id UUID REFERENCES guest_profiles(id),
  booking_type booking_type NOT NULL DEFAULT 'guest',
  
  -- Booking details
  booking_date DATE NOT NULL,
  time_slot time_slot NOT NULL,
  start_time TIME,
  end_time TIME,
  
  -- Guest info (for non-registered bookings)
  guest_name VARCHAR(200),
  guest_email VARCHAR(255),
  guest_phone VARCHAR(20),
  
  -- Financial
  base_amount DECIMAL(10,2) NOT NULL,
  addons_amount DECIMAL(10,2) DEFAULT 0,
  discount_percent INT DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_reason VARCHAR(100),  -- e.g., 'Member loyalty - 10%'
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Status
  status booking_status DEFAULT 'pending_payment',
  
  -- External references
  payment_reference VARCHAR(100),
  zoho_invoice_id VARCHAR(50),
  zoho_invoice_number VARCHAR(50),
  
  -- Metadata
  notes TEXT,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  refund_amount DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Trigger to update user stats after booking completion
CREATE OR REPLACE FUNCTION update_user_booking_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    IF NEW.user_id IS NOT NULL THEN
      UPDATE users SET
        total_bookings = total_bookings + 1,
        total_spent = total_spent + NEW.total_amount,
        last_booking_date = NEW.booking_date,
        is_member = TRUE,
        member_since = COALESCE(member_since, NOW()),
        updated_at = NOW()
      WHERE id = NEW.user_id;
    END IF;
    
    IF NEW.guest_profile_id IS NOT NULL THEN
      UPDATE guest_profiles SET
        total_bookings = total_bookings + 1,
        last_booking_date = NEW.booking_date,
        updated_at = NOW()
      WHERE id = NEW.guest_profile_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_user_booking_stats();

-- Generate booking number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_number := 'CW' || TO_CHAR(NOW(), 'YYMMDD') || '-' || 
    LPAD(NEXTVAL('booking_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE booking_number_seq START 1;

CREATE TRIGGER set_booking_number
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION generate_booking_number();

-- Indexes for performance
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_space_date ON bookings(space_id, booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_user ON bookings(user_id);

-- Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (user_id = auth.uid() OR guest_email = (SELECT email FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can view all bookings" ON bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'frontdesk'))
  );
```

#### `payments` — Payment Transactions

```sql
CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
  'partially_refunded'
);

CREATE TYPE payment_method AS ENUM (
  'payhere',
  'qr_transfer',
  'cash',
  'card_terminal'
);

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
```

#### `addons` — Optional Add-on Services

```sql
CREATE TABLE addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  zoho_item_id VARCHAR(50) NOT NULL,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE
);

-- Seed addons from Zoho
INSERT INTO addons (name, price, zoho_item_id, category) VALUES
('5 GB Extra Data', 650, '4944213000001171366', 'data'),
('10 GB Extra Data', 1300, '4944213000001171388', 'data'),
('20 GB Extra Data', 2500, '4944213000001171377', 'data'),
('Monitor Rental (Day)', 500, '4944213000001171305', 'equipment'),
('Projector (Up to 4hrs)', 1800, '4944213000001171316', 'equipment'),
('Projector (4+ hrs)', 2800, '4944213000001171349', 'equipment'),
('Projector Screen (Up to 4hrs)', 2400, '4944213000001171327', 'equipment'),
('Projector Screen (4+ hrs)', 3800, '4944213000001171338', 'equipment'),
('Photocopy B&W (per page)', 10, '4944213000001171288', 'printing');

CREATE TABLE booking_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES addons(id),
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);
```

### 3.3 Availability Check Function

```sql
-- Check availability for a specific space, date, and slot
CREATE OR REPLACE FUNCTION check_availability(
  p_space_id UUID,
  p_date DATE,
  p_slot time_slot
)
RETURNS TABLE (
  is_available BOOLEAN,
  booked_count INT,
  total_inventory INT
) AS $$
DECLARE
  v_total_inventory INT;
  v_booked_count INT;
  v_requires_specific_seat BOOLEAN;
BEGIN
  -- Get space details
  SELECT s.total_inventory, s.requires_specific_seat
  INTO v_total_inventory, v_requires_specific_seat
  FROM spaces s WHERE s.id = p_space_id;
  
  -- Count confirmed bookings for this slot
  -- Account for slot overlaps (unlimited covers morning+afternoon+evening)
  SELECT COUNT(*)
  INTO v_booked_count
  FROM bookings b
  WHERE b.space_id = p_space_id
    AND b.booking_date = p_date
    AND b.status IN ('pending_payment', 'confirmed', 'checked_in')
    AND (
      b.time_slot = p_slot
      OR (p_slot IN ('morning', 'afternoon') AND b.time_slot IN ('full_day', 'unlimited'))
      OR (p_slot = 'full_day' AND b.time_slot IN ('morning', 'afternoon', 'unlimited'))
      OR (p_slot = 'unlimited' AND b.time_slot IN ('morning', 'afternoon', 'evening', 'full_day'))
    );
  
  RETURN QUERY SELECT 
    (v_booked_count < v_total_inventory) AS is_available,
    v_booked_count AS booked_count,
    v_total_inventory AS total_inventory;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. API Specification

### 4.1 Public Endpoints

#### GET `/api/spaces`
Returns all active bookable spaces with pricing.

**Response:**
```json
{
  "spaces": [
    {
      "id": "uuid",
      "name": "Hot Desk",
      "type": "hot_desk",
      "capacity": 1,
      "description": "...",
      "image_url": "...",
      "amenities": ["wifi", "coffee", "lounge"],
      "pricing": [
        {
          "id": "uuid",
          "duration": "half_day",
          "price": 490,
          "description": "4hrs (8am-12pm or 12pm-4pm)"
        }
      ]
    }
  ]
}
```

#### GET `/api/availability`
Check availability for a space on specific dates.

**Query params:** `space_id`, `date` (or `start_date` + `end_date`)

**Response:**
```json
{
  "space_id": "uuid",
  "availability": [
    {
      "date": "2026-07-15",
      "slots": {
        "morning": { "available": true, "remaining": 8 },
        "afternoon": { "available": true, "remaining": 10 },
        "full_day": { "available": true, "remaining": 8 },
        "unlimited": { "available": true, "remaining": 8 }
      }
    }
  ]
}
```

#### POST `/api/bookings`
Create a new booking.

**Request:**
```json
{
  "space_id": "uuid",
  "pricing_id": "uuid",
  "date": "2026-07-15",
  "slot": "full_day",
  "guest_name": "John Doe",
  "guest_email": "john@example.com",
  "guest_phone": "+94771234567",
  "addons": [
    { "addon_id": "uuid", "quantity": 1 }
  ],
  "payment_method": "payhere"
}
```

**Response:**
```json
{
  "booking": {
    "id": "uuid",
    "booking_number": "CW260715-0001",
    "total_amount": 5450,
    "status": "pending_payment"
  },
  "payment": {
    "redirect_url": "https://sandbox.payhere.lk/pay/checkout/..."
  }
}
```

#### GET `/api/bookings/:id`
Get booking details (requires auth or booking reference).

#### POST `/api/bookings/:id/cancel`
Cancel a booking (applies partial refund policy).

### 4.2 Admin Endpoints

All require `admin` or `frontdesk` role.

#### GET `/api/admin/bookings`
List bookings with filters.

**Query params:** `date`, `status`, `space_id`, `page`, `limit`

#### POST `/api/admin/bookings`
Create walk-in booking (cash/card terminal payment).

#### PATCH `/api/admin/bookings/:id`
Update booking status (check-in, no-show, etc).

#### GET `/api/admin/availability`
Get real-time availability dashboard data for a specific date.

**Query params:** `date` (YYYY-MM-DD)

**Response:**
```json
{
  "date": "2026-07-15",
  "resources": [
    {
      "space_id": "uuid",
      "space_name": "Hot Desk",
      "space_type": "hot_desk",
      "total_inventory": 10,
      "slots": {
        "morning": { "available": 8, "booked": 2 },
        "afternoon": { "available": 6, "booked": 4 },
        "full_day": { "available": 6, "booked": 4 },
        "unlimited": { "available": 5, "booked": 5 }
      }
    },
    {
      "space_id": "uuid",
      "space_name": "4-Seater Meeting Room",
      "space_type": "meeting_room_4",
      "total_inventory": 1,
      "slots": {
        "morning": { "available": 1, "booked": 0, "booking": null },
        "afternoon": { "available": 0, "booked": 1, "booking": { "id": "uuid", "customer": "Acme Corp", "status": "confirmed" } },
        "full_day": { "available": 0, "booked": 1, "booking": { "id": "uuid", "customer": "Acme Corp", "status": "confirmed" } },
        "unlimited": { "available": 0, "booked": 1, "booking": { "id": "uuid", "customer": "Acme Corp", "status": "confirmed" } }
      }
    }
  ]
}
```

#### GET `/api/admin/calendar`
Get calendar view data for week/month view.

**Query params:** `start_date`, `end_date`, `space_id` (optional)

**Response:**
```json
{
  "start_date": "2026-07-13",
  "end_date": "2026-07-19",
  "bookings": [
    {
      "id": "uuid",
      "booking_number": "CW260715-0001",
      "space_id": "uuid",
      "space_name": "4-Seater Meeting Room",
      "space_type": "meeting_room_4",
      "date": "2026-07-15",
      "slot": "afternoon",
      "start_time": "12:00",
      "end_time": "16:00",
      "customer_name": "John Doe",
      "customer_email": "john@example.com",
      "status": "confirmed",
      "total_amount": 3450
    }
  ],
  "availability_summary": {
    "2026-07-13": { "hot_desk": { "used": 2, "total": 10 }, "meeting_room_4": { "booked": true } },
    "2026-07-14": { "hot_desk": { "used": 4, "total": 10 }, "meeting_room_4": { "booked": false } }
  }
}
```

#### POST `/api/admin/bookings`
Create a new booking from admin panel (walk-in, phone, manual).

**Request:**
```json
{
  "space_id": "uuid",
  "pricing_id": "uuid",
  "date": "2026-07-15",
  "slot": "full_day",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+94771234567"
  },
  "addons": [
    { "addon_id": "uuid", "quantity": 1 }
  ],
  "payment_method": "cash",
  "payment_received": true,
  "notes": "Walk-in customer"
}
```

**Response:**
```json
{
  "booking": {
    "id": "uuid",
    "booking_number": "CW260715-0005",
    "status": "confirmed",
    "total_amount": 4950
  },
  "zoho_invoice": {
    "invoice_id": "4944213000001234567",
    "invoice_number": "CWINV-24780"
  }
}
```

#### POST `/api/admin/payments/confirm-qr`
Confirm QR/bank transfer payment manually.

### 4.3 Webhook Endpoints

#### POST `/api/webhooks/payhere`
PayHere payment notification callback.

---

## 5. Zoho Books Integration

### 5.1 Integration Overview

**Zoho Books is the source of truth for:**
- Products/Services (Items)
- Pricing
- Customer records

**Supabase receives:**
- Synced products & prices (from Zoho)
- Booking transactions (to Zoho)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ZOHO BOOKS (Source of Truth)                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │    Items     │    │   Contacts   │    │   Invoices   │              │
│  │  (Products)  │    │  (Customers) │    │  (Bookings)  │              │
│  └──────┬───────┘    └──────┬───────┘    └──────▲───────┘              │
│         │                   │                   │                       │
└─────────┼───────────────────┼───────────────────┼───────────────────────┘
          │                   │                   │
          │ SYNC (Pull)       │ SYNC (Bi-dir)     │ CREATE (Push)
          │ Every 15 min      │                   │
          ▼                   ▼                   │
┌─────────────────────────────────────────────────┼───────────────────────┐
│                        SUPABASE                 │                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────┴───────┐              │
│  │   spaces     │    │    users     │    │   bookings   │              │
│  │   pricing    │    │              │    │   payments   │              │
│  │   addons     │    │              │    │              │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Zoho Books API Configuration

**Environment Variables:**
```env
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token
ZOHO_ORGANIZATION_ID=your_org_id
ZOHO_REDIRECT_URI=https://cowork.lk/api/auth/zoho/callback
```

**OAuth Scopes Required:**
```
ZohoBooks.items.READ          # Read products/services
ZohoBooks.invoices.CREATE     # Create invoices
ZohoBooks.invoices.READ       # Read invoice status
ZohoBooks.contacts.CREATE     # Create customers
ZohoBooks.contacts.READ       # Read customers
ZohoBooks.contacts.UPDATE     # Update customers
```

**OAuth Flow:**
1. Register app at Zoho API Console
2. Generate refresh token with all required scopes
3. Store refresh token securely (environment variable)
4. Use refresh token to get access tokens (expires in 1 hour)

### 5.3 Product & Price Sync Service

#### Sync Strategy

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Direction** | Zoho → Supabase (one-way) | Zoho is source of truth |
| **Frequency** | Every 15 minutes | Balance freshness vs API limits |
| **Trigger** | Cron job + Manual button | Scheduled + on-demand |
| **Conflict Resolution** | Zoho always wins | No local edits allowed |
| **Sync Scope** | Active items only | Skip inactive Zoho items |

#### Sync Database Tables

```sql
-- Track sync history and status
CREATE TABLE zoho_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type VARCHAR(50) NOT NULL,  -- 'items', 'contacts', 'full'
  status VARCHAR(20) NOT NULL,      -- 'running', 'completed', 'failed'
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  items_synced INT DEFAULT 0,
  items_created INT DEFAULT 0,
  items_updated INT DEFAULT 0,
  items_deactivated INT DEFAULT 0,
  error_message TEXT,
  triggered_by VARCHAR(50)          -- 'cron', 'manual', 'webhook'
);

-- Map Zoho items to local entities
CREATE TABLE zoho_item_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zoho_item_id VARCHAR(50) NOT NULL UNIQUE,
  zoho_item_name VARCHAR(200) NOT NULL,
  zoho_item_type VARCHAR(50),        -- 'service', 'goods'
  zoho_status VARCHAR(20),           -- 'active', 'inactive'
  zoho_rate DECIMAL(10,2),
  zoho_description TEXT,
  
  -- Local mapping
  local_entity_type VARCHAR(50),     -- 'space_pricing', 'addon', 'unmapped'
  local_entity_id UUID,              -- FK to pricing or addons table
  
  -- Categorization (set manually or via naming convention)
  category VARCHAR(50),              -- 'hot_desk', 'workspace', 'meeting_room', 'lobby', 'addon'
  duration VARCHAR(20),              -- 'half_day', 'full_day', 'unlimited', '1hr', etc.
  
  -- Sync metadata
  last_synced_at TIMESTAMPTZ,
  sync_hash VARCHAR(64),             -- Hash of Zoho data to detect changes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zoho_mapping_item_id ON zoho_item_mapping(zoho_item_id);
CREATE INDEX idx_zoho_mapping_local ON zoho_item_mapping(local_entity_type, local_entity_id);
```

#### Item Categorization Rules

Zoho items are categorized based on naming conventions:

```typescript
// /lib/zoho/item-categorizer.ts

interface ItemCategory {
  category: 'hot_desk' | 'workspace' | 'meeting_room_4' | 'meeting_room_4_black' | 
            'meeting_room_5' | 'lobby_meeting' | 'lobby_shooting' | 'addon' | 'other';
  duration: 'half_day' | 'full_day' | 'unlimited' | '1hr' | '2hr' | '30min' | 'per_item' | null;
}

export function categorizeZohoItem(itemName: string): ItemCategory {
  const name = itemName.toLowerCase();
  
  // Hot Desk
  if (name.includes('hot desk')) {
    if (name.includes('half')) return { category: 'hot_desk', duration: 'half_day' };
    if (name.includes('full day') || name.includes('8hr')) return { category: 'hot_desk', duration: 'full_day' };
    if (name.includes('unlimited') || name.includes('12hr')) return { category: 'hot_desk', duration: 'unlimited' };
  }
  
  // Workspace
  if (name.includes('workspace')) {
    if (name.includes('half')) return { category: 'workspace', duration: 'half_day' };
    if (name.includes('full')) return { category: 'workspace', duration: 'full_day' };
    if (name.includes('unlimited')) return { category: 'workspace', duration: 'unlimited' };
  }
  
  // 4-Seater Black Room
  if (name.includes('4 seater black') || name.includes('4-seater black')) {
    if (name.includes('half')) return { category: 'meeting_room_4_black', duration: 'half_day' };
    if (name.includes('full')) return { category: 'meeting_room_4_black', duration: 'full_day' };
    if (name.includes('unlimited')) return { category: 'meeting_room_4_black', duration: 'unlimited' };
  }
  
  // 4-Seater Room (non-black)
  if ((name.includes('4 seater') || name.includes('4-seater')) && !name.includes('black')) {
    if (name.includes('half')) return { category: 'meeting_room_4', duration: 'half_day' };
    if (name.includes('full')) return { category: 'meeting_room_4', duration: 'full_day' };
    if (name.includes('unlimited')) return { category: 'meeting_room_4', duration: 'unlimited' };
  }
  
  // 5-Seater Room
  if (name.includes('5 seater') || name.includes('5-seater')) {
    if (name.includes('half')) return { category: 'meeting_room_5', duration: 'half_day' };
    if (name.includes('full')) return { category: 'meeting_room_5', duration: 'full_day' };
    if (name.includes('unlimited')) return { category: 'meeting_room_5', duration: 'unlimited' };
  }
  
  // Lobby
  if (name.includes('lobby')) {
    if (name.includes('shooting')) {
      if (name.includes('additional') || name.includes('30min')) return { category: 'lobby_shooting', duration: '30min' };
      return { category: 'lobby_shooting', duration: '2hr' };
    }
    if (name.includes('1h') || name.includes('1 hour')) return { category: 'lobby_meeting', duration: '1hr' };
    if (name.includes('2h') || name.includes('2 hour')) return { category: 'lobby_meeting', duration: '2hr' };
    if (name.includes('additional')) return { category: 'lobby_meeting', duration: '1hr' };
  }
  
  // Add-ons
  if (name.includes('projector') || name.includes('screen') || name.includes('monitor') ||
      name.includes('data') || name.includes('gb') || name.includes('photocopy')) {
    return { category: 'addon', duration: 'per_item' };
  }
  
  // Unmapped
  return { category: 'other', duration: null };
}
```

#### Sync Service Implementation

```typescript
// /lib/zoho/sync-service.ts

import { createClient } from '@supabase/supabase-js';
import { getZohoClient } from './client';
import { categorizeZohoItem } from './item-categorizer';
import crypto from 'crypto';

interface SyncResult {
  success: boolean;
  items_synced: number;
  items_created: number;
  items_updated: number;
  items_deactivated: number;
  errors: string[];
}

export async function syncZohoItems(triggeredBy: string = 'manual'): Promise<SyncResult> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Create sync log entry
  const { data: syncLog } = await supabase
    .from('zoho_sync_log')
    .insert({ sync_type: 'items', status: 'running', triggered_by: triggeredBy })
    .select()
    .single();
  
  const result: SyncResult = {
    success: true, items_synced: 0, items_created: 0,
    items_updated: 0, items_deactivated: 0, errors: []
  };
  
  try {
    const zoho = await getZohoClient();
    
    // Fetch all items from Zoho (paginated)
    let page = 1;
    let hasMore = true;
    const allItems: any[] = [];
    
    while (hasMore) {
      const response = await zoho.get('/items', { params: { page, per_page: 200 } });
      allItems.push(...response.data.items);
      hasMore = response.data.page_context?.has_more_page || false;
      page++;
    }
    
    // Get existing mappings
    const { data: existingMappings } = await supabase
      .from('zoho_item_mapping').select('*');
    const existingMap = new Map(existingMappings?.map(m => [m.zoho_item_id, m]) || []);
    
    // Process each Zoho item
    for (const item of allItems) {
      const itemHash = crypto.createHash('sha256')
        .update(JSON.stringify({ name: item.name, rate: item.rate, status: item.status }))
        .digest('hex');
      
      const existing = existingMap.get(item.item_id);
      const category = categorizeZohoItem(item.name);
      
      if (!existing) {
        // New item
        await supabase.from('zoho_item_mapping').insert({
          zoho_item_id: item.item_id,
          zoho_item_name: item.name,
          zoho_item_type: item.item_type,
          zoho_status: item.status,
          zoho_rate: item.rate,
          zoho_description: item.description,
          category: category.category,
          duration: category.duration,
          local_entity_type: category.category === 'other' ? 'unmapped' : 
                            category.category === 'addon' ? 'addon' : 'space_pricing',
          last_synced_at: new Date().toISOString(),
          sync_hash: itemHash
        });
        result.items_created++;
      } else if (existing.sync_hash !== itemHash) {
        // Item changed
        await supabase.from('zoho_item_mapping')
          .update({
            zoho_item_name: item.name,
            zoho_status: item.status,
            zoho_rate: item.rate,
            zoho_description: item.description,
            last_synced_at: new Date().toISOString(),
            sync_hash: itemHash,
            updated_at: new Date().toISOString()
          })
          .eq('zoho_item_id', item.item_id);
        result.items_updated++;
      }
      result.items_synced++;
    }
    
    // Update pricing and addons tables from mappings
    await syncPricingFromMappings(supabase);
    await syncAddonsFromMappings(supabase);
    
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }
  
  // Update sync log
  await supabase.from('zoho_sync_log')
    .update({
      status: result.success ? 'completed' : 'failed',
      completed_at: new Date().toISOString(),
      items_synced: result.items_synced,
      items_created: result.items_created,
      items_updated: result.items_updated,
      error_message: result.errors.join('; ') || null
    })
    .eq('id', syncLog?.id);
  
  return result;
}
```

#### Sync API Endpoints

```typescript
// POST /api/admin/zoho/sync - Manual sync trigger
// GET /api/admin/zoho/sync/status - Get last sync status
// GET /api/cron/zoho-sync - Cron job endpoint (every 15 min)
```

**Vercel Cron Configuration (`vercel.json`):**
```json
{
  "crons": [
    {
      "path": "/api/cron/zoho-sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

#### Admin UI: Sync Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Zoho Sync                                              [🔄 Sync Now]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  LAST SYNC: ✅ Completed - 5 minutes ago                                │
│  Items: 47 synced (2 new, 3 updated)                                    │
│                                                                          │
│  MAPPING STATUS                                                          │
│  ├── 🟢 Active: 42    ├── ✅ Mapped: 38                                 │
│  └── 🔴 Inactive: 5   └── ⚠️ Unmapped: 4 [Review →]                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Zoho Integration Functions

#### Create or Get Customer

```typescript
// /lib/zoho/customers.ts

interface ZohoCustomer {
  contact_id: string;
  contact_name: string;
  email: string;
  phone: string;
}

async function findOrCreateCustomer(
  email: string,
  name: string,
  phone: string
): Promise<ZohoCustomer> {
  const zoho = await getZohoClient();
  
  // Search for existing customer
  const searchResult = await zoho.get('/contacts', {
    params: { email }
  });
  
  if (searchResult.data.contacts.length > 0) {
    return searchResult.data.contacts[0];
  }
  
  // Create new customer
  const newCustomer = await zoho.post('/contacts', {
    contact_name: name,
    email,
    phone,
    contact_type: 'customer'
  });
  
  return newCustomer.data.contact;
}
```

#### Create Invoice

```typescript
// /lib/zoho/invoices.ts

interface InvoiceLineItem {
  item_id: string;
  quantity: number;
  rate: number;
}

async function createInvoice(
  customerId: string,
  bookingNumber: string,
  lineItems: InvoiceLineItem[],
  paymentReceived: boolean = true
): Promise<{ invoice_id: string; invoice_number: string }> {
  const zoho = await getZohoClient();
  
  const invoice = await zoho.post('/invoices', {
    customer_id: customerId,
    reference_number: bookingNumber,
    date: new Date().toISOString().split('T')[0],
    payment_terms: 0, // Due on receipt
    line_items: lineItems.map(item => ({
      item_id: item.item_id,
      quantity: item.quantity,
      rate: item.rate
    })),
    notes: `Booking Reference: ${bookingNumber}\nThank you for choosing Cowork!`
  });
  
  const invoiceId = invoice.data.invoice.invoice_id;
  const invoiceNumber = invoice.data.invoice.invoice_number;
  
  // If payment already received (PayHere confirmed), record payment
  if (paymentReceived) {
    await zoho.post(`/invoices/${invoiceId}/payments`, {
      amount: lineItems.reduce((sum, item) => sum + item.rate * item.quantity, 0),
      date: new Date().toISOString().split('T')[0],
      payment_mode: 'Online Payment'
    });
  }
  
  // Send invoice email to customer
  await zoho.post(`/invoices/${invoiceId}/email`, {
    to_mail_ids: [/* customer email from invoice */],
    subject: `Invoice ${invoiceNumber} from Cowork`,
    body: `Dear Customer,\n\nPlease find attached your invoice for booking ${bookingNumber}.\n\nThank you for choosing Cowork!`
  });
  
  return { invoice_id: invoiceId, invoice_number: invoiceNumber };
}
```

### 5.4 Zoho Item ID Mapping

```typescript
// /lib/zoho/item-mapping.ts

export const ZOHO_ITEMS = {
  // Hot Desk
  'hot_desk_half_day': '4944213000001171243',
  'hot_desk_full_day': '4944213000001171232',
  'hot_desk_unlimited': '4944213000001171254',
  
  // Workspace
  'workspace_half_day': '4944213000000084278',
  'workspace_full_day': '4944213000000084226',
  'workspace_unlimited': '4944213000000100027',
  
  // 4-Seater Meeting Room
  'meeting_4_half_day': '4944213000000154001',
  'meeting_4_full_day': '4944213000000152001',
  'meeting_4_unlimited': '4944213000000175001',
  
  // 4-Seater Black Meeting Room
  'meeting_4_black_half_day': '4944213000001985001',
  'meeting_4_black_full_day': '4944213000001985012',
  'meeting_4_black_unlimited': '4944213000001983049',
  
  // 5-Seater Meeting Room
  'meeting_5_half_day': '4944213000001171199',
  'meeting_5_full_day': '4944213000001171210',
  'meeting_5_unlimited': '4944213000001171221',
  
  // Lobby
  'lobby_1hr': '4944213000001171476',
  'lobby_2hr': '4944213000001171487',
  'lobby_additional_hour': '4944213000000181010',
  
  // Add-ons
  'data_5gb': '4944213000001171366',
  'data_10gb': '4944213000001171388',
  'data_20gb': '4944213000001171377',
  'monitor_rental': '4944213000001171305',
  'projector_4hr': '4944213000001171316',
  'projector_4hr_plus': '4944213000001171349',
  'screen_4hr': '4944213000001171327',
  'screen_4hr_plus': '4944213000001171338',
  'photocopy_bw': '4944213000001171288'
} as const;
```

---

## 6. Payment Gateway Integration

### 6.1 PayHere Integration

**Sandbox URL:** `https://sandbox.payhere.lk/pay/checkout`  
**Production URL:** `https://www.payhere.lk/pay/checkout`

#### Environment Variables

```env
PAYHERE_MERCHANT_ID=your_merchant_id
PAYHERE_MERCHANT_SECRET=your_merchant_secret
PAYHERE_MODE=sandbox  # or 'live'
```

#### Generate Payment Hash

```typescript
// /lib/payhere/hash.ts
import crypto from 'crypto';

export function generatePayhereHash(
  merchantId: string,
  orderId: string,
  amount: number,
  currency: string,
  merchantSecret: string
): string {
  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();
  
  const amountFormatted = amount.toFixed(2);
  
  const hash = crypto
    .createHash('md5')
    .update(
      merchantId +
      orderId +
      amountFormatted +
      currency +
      hashedSecret
    )
    .digest('hex')
    .toUpperCase();
  
  return hash;
}
```

#### Initiate Payment

```typescript
// /app/api/payments/payhere/initiate/route.ts

export async function POST(request: Request) {
  const { bookingId } = await request.json();
  
  const booking = await getBookingById(bookingId);
  
  const paymentData = {
    merchant_id: process.env.PAYHERE_MERCHANT_ID,
    return_url: `${process.env.NEXT_PUBLIC_URL}/booking/success?id=${bookingId}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/booking/cancel?id=${bookingId}`,
    notify_url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/payhere`,
    order_id: booking.booking_number,
    items: booking.space_name,
    currency: 'LKR',
    amount: booking.total_amount,
    first_name: booking.guest_name.split(' ')[0],
    last_name: booking.guest_name.split(' ').slice(1).join(' ') || '-',
    email: booking.guest_email,
    phone: booking.guest_phone,
    address: 'N/A',
    city: 'Colombo',
    country: 'Sri Lanka',
    hash: generatePayhereHash(
      process.env.PAYHERE_MERCHANT_ID!,
      booking.booking_number,
      booking.total_amount,
      'LKR',
      process.env.PAYHERE_MERCHANT_SECRET!
    )
  };
  
  // Return data for client-side form submission
  return Response.json({
    payhere_url: process.env.PAYHERE_MODE === 'sandbox'
      ? 'https://sandbox.payhere.lk/pay/checkout'
      : 'https://www.payhere.lk/pay/checkout',
    form_data: paymentData
  });
}
```

#### Payment Notification Webhook

```typescript
// /app/api/webhooks/payhere/route.ts

export async function POST(request: Request) {
  const formData = await request.formData();
  
  const merchantId = formData.get('merchant_id') as string;
  const orderId = formData.get('order_id') as string;
  const paymentId = formData.get('payment_id') as string;
  const amount = formData.get('payhere_amount') as string;
  const currency = formData.get('payhere_currency') as string;
  const statusCode = formData.get('status_code') as string;
  const md5sig = formData.get('md5sig') as string;
  
  // Verify signature
  const localSig = generatePayhereNotifyHash(
    merchantId,
    orderId,
    amount,
    currency,
    statusCode,
    process.env.PAYHERE_MERCHANT_SECRET!
  );
  
  if (localSig !== md5sig) {
    return new Response('Invalid signature', { status: 400 });
  }
  
  // Status codes: 2 = success, 0 = pending, -1 = canceled, -2 = failed, -3 = chargedback
  if (statusCode === '2') {
    // Payment successful
    await confirmBookingPayment(orderId, paymentId, parseFloat(amount));
    
    // Create Zoho invoice
    const booking = await getBookingByNumber(orderId);
    await createZohoInvoice(booking);
    
    // Send confirmation email
    await sendBookingConfirmationEmail(booking);
  }
  
  return new Response('OK');
}
```

### 6.2 QR Payment Flow

For bank transfers via QR code (no gateway integration required):

1. Show QR code with bank details on booking confirmation page
2. Customer makes transfer and enters reference number
3. Front desk staff confirms payment manually in admin dashboard
4. System updates booking status and creates Zoho invoice

```typescript
// Bank details for QR
export const BANK_DETAILS = {
  bank_name: 'Commercial Bank of Ceylon',
  account_name: 'Cowork Lanka (Private) Limited',
  account_number: 'XXXXXXXXXX',
  branch: 'Pannipitiya',
  swift_code: 'CABORLK'
};
```

---

## 7. Booking State Machine

### 7.1 State Diagram

```
                    ┌─────────────────┐
                    │  pending_payment │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │  confirmed  │   │  cancelled  │   │   expired   │
    └──────┬──────┘   └─────────────┘   └─────────────┘
           │                                   ▲
           │              (auto after 30min)   │
           ├───────────────────────────────────┘
           │
           ▼
    ┌─────────────┐
    │  checked_in │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │  completed  │
    └─────────────┘
```

### 7.2 State Transitions

| From | To | Trigger | Actions |
|------|-----|---------|---------|
| `pending_payment` | `confirmed` | Payment webhook success | Create Zoho invoice, send confirmation email |
| `pending_payment` | `cancelled` | User cancels | Release slot |
| `pending_payment` | `expired` | 30min timeout | Release slot (cron job) |
| `confirmed` | `checked_in` | Admin check-in | Log timestamp |
| `confirmed` | `cancelled` | User/admin cancels | Calculate refund, update Zoho, release slot |
| `confirmed` | `no_show` | Admin marks no-show | Log, no refund |
| `checked_in` | `completed` | Admin checkout or auto at slot end | Complete booking |

### 7.3 Cancellation & Refund Policy

```typescript
// /lib/bookings/cancellation.ts

interface RefundCalculation {
  refund_amount: number;
  refund_percentage: number;
  reason: string;
}

export function calculateRefund(
  booking: Booking,
  cancellationTime: Date
): RefundCalculation {
  const bookingDate = new Date(booking.booking_date);
  const hoursUntilBooking = (bookingDate.getTime() - cancellationTime.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilBooking >= 24) {
    // More than 24 hours: 80% refund
    return {
      refund_amount: booking.total_amount * 0.8,
      refund_percentage: 80,
      reason: 'Cancelled more than 24 hours in advance'
    };
  } else if (hoursUntilBooking >= 4) {
    // 4-24 hours: 50% refund
    return {
      refund_amount: booking.total_amount * 0.5,
      refund_percentage: 50,
      reason: 'Cancelled 4-24 hours before booking'
    };
  } else {
    // Less than 4 hours: No refund
    return {
      refund_amount: 0,
      refund_percentage: 0,
      reason: 'Cancelled less than 4 hours before booking'
    };
  }
}
```

---

## 8. User Profiles & Member Loyalty

### 8.1 Guest vs Member Booking Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BOOKING CHECKOUT                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  "How would you like to continue?"                                      │
│                                                                          │
│  ┌─────────────────────────┐    ┌─────────────────────────┐            │
│  │                         │    │                         │            │
│  │   🔐 SIGN IN / SIGN UP  │    │    👤 CONTINUE AS GUEST │            │
│  │                         │    │                         │            │
│  │   • 10% member discount │    │    • No account needed  │            │
│  │   • View booking history│    │    • Quick checkout     │            │
│  │   • Faster checkout     │    │    • Create account     │            │
│  │                         │    │      later (optional)   │            │
│  │                         │    │                         │            │
│  └─────────────────────────┘    └─────────────────────────┘            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Booking Flow Comparison

| Step | Guest Flow | Member Flow |
|------|------------|-------------|
| 1. Select space/slot | ✅ Same | ✅ Same |
| 2. Checkout prompt | "Continue as Guest" | "Sign In" (existing) or "Sign Up" (new) |
| 3. Enter details | Name, Email, Phone | Pre-filled from profile |
| 4. Discount check | ❌ No discount | ✅ Check for 10% loyalty discount |
| 5. Payment | PayHere / QR | PayHere / QR |
| 6. Confirmation | Booking confirmed | Booking confirmed |
| 7. Post-booking | Prompt to create account | Update booking history |

### 8.3 Member Loyalty Discount Rules

| Rule | Value | Description |
|------|-------|-------------|
| Discount Percentage | **10%** | Applied to base amount (not add-ons) |
| Eligibility Window | **30 days** | From last completed booking |
| Applies To | Base price only | Add-ons (projector, data, etc.) excluded |
| Stacking | No | Cannot combine with other discounts |
| Trigger | Auto-detected | System checks eligibility at checkout |

**Discount Calculation Example:**

```
4-Seater Meeting Room (Full Day): LKR 4,950
Projector Rental:                  LKR 1,800
                                   ─────────
Subtotal before discount:          LKR 6,750

Member Discount (10% of base):    -LKR   495  (10% of 4,950)
                                   ─────────
TOTAL:                             LKR 6,255
```

### 8.4 Discount Check Logic

```typescript
// /lib/pricing/discount.ts

interface DiscountResult {
  eligible: boolean;
  discount_percent: number;
  discount_amount: number;
  reason: string | null;
  last_booking_date: string | null;
  days_since_last: number | null;
}

export async function checkMemberDiscount(
  userId: string | null,
  guestEmail: string | null,
  baseAmount: number
): Promise<DiscountResult> {
  // Guest bookings never get discount
  if (!userId) {
    return {
      eligible: false,
      discount_percent: 0,
      discount_amount: 0,
      reason: null,
      last_booking_date: null,
      days_since_last: null
    };
  }
  
  const supabase = createClient();
  
  // Check last completed booking
  const { data: lastBooking } = await supabase
    .from('bookings')
    .select('booking_date')
    .eq('user_id', userId)
    .in('status', ['completed', 'confirmed', 'checked_in'])
    .order('booking_date', { ascending: false })
    .limit(1)
    .single();
  
  if (!lastBooking) {
    return {
      eligible: false,
      discount_percent: 0,
      discount_amount: 0,
      reason: 'First booking - no loyalty discount yet',
      last_booking_date: null,
      days_since_last: null
    };
  }
  
  const lastDate = new Date(lastBooking.booking_date);
  const today = new Date();
  const daysSince = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSince <= 30) {
    const discountAmount = Math.round(baseAmount * 0.10);
    return {
      eligible: true,
      discount_percent: 10,
      discount_amount: discountAmount,
      reason: `Member loyalty discount (booked ${daysSince} days ago)`,
      last_booking_date: lastBooking.booking_date,
      days_since_last: daysSince
    };
  }
  
  return {
    eligible: false,
    discount_percent: 0,
    discount_amount: 0,
    reason: `Last booking was ${daysSince} days ago (over 30 day limit)`,
    last_booking_date: lastBooking.booking_date,
    days_since_last: daysSince
  };
}
```

### 8.5 Post-Booking Profile Creation

After a guest completes a booking, prompt them to create an account:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ✅ Booking Confirmed! #CW260715-0001                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Your booking details have been sent to john@example.com                │
│                                                                          │
│  ───────────────────────────────────────────────────────────────────    │
│                                                                          │
│  🎁 CREATE AN ACCOUNT & GET 10% OFF YOUR NEXT BOOKING                  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                                                                  │    │
│  │  As a Cowork member, you'll get:                                │    │
│  │                                                                  │    │
│  │  ✓ 10% discount on your next booking (within 30 days)          │    │
│  │  ✓ View your booking history                                    │    │
│  │  ✓ Faster checkout with saved details                          │    │
│  │  ✓ Exclusive member events & offers                            │    │
│  │                                                                  │    │
│  │  Email: john@example.com (from your booking)                    │    │
│  │  Password: [••••••••••••]                                       │    │
│  │                                                                  │    │
│  │                            [Create Account]   [Maybe Later]     │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.6 Profile Creation Flow

```typescript
// /app/api/auth/convert-guest/route.ts

export async function POST(request: Request) {
  const { email, password, bookingId } = await request.json();
  
  const supabase = createServerClient();
  
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { source: 'guest_conversion' }
    }
  });
  
  if (authError) throw authError;
  
  const userId = authData.user!.id;
  
  // 2. Get guest profile
  const { data: guestProfile } = await supabase
    .from('guest_profiles')
    .select('*')
    .eq('email', email)
    .single();
  
  // 3. Create user profile
  await supabase.from('users').insert({
    id: userId,
    email,
    phone: guestProfile?.phone,
    full_name: guestProfile?.full_name,
    is_member: true,
    member_since: new Date().toISOString(),
    total_bookings: guestProfile?.total_bookings || 0
  });
  
  // 4. Link all past guest bookings to new user
  await supabase
    .from('bookings')
    .update({ user_id: userId, booking_type: 'member' })
    .eq('guest_email', email);
  
  // 5. Mark guest profile as converted
  if (guestProfile) {
    await supabase
      .from('guest_profiles')
      .update({ 
        converted_to_user_id: userId, 
        converted_at: new Date().toISOString() 
      })
      .eq('id', guestProfile.id);
  }
  
  // 6. Sync to Zoho
  await createOrUpdateZohoContact(email, guestProfile?.full_name, guestProfile?.phone);
  
  return Response.json({ 
    success: true, 
    user_id: userId,
    message: 'Account created! You now qualify for member discounts.'
  });
}
```

### 8.7 Member Profile Page

```
/profile                    # Member profile overview
/profile/bookings           # Booking history
/profile/settings           # Account settings
```

**Profile Page Features (MVP):**

| Feature | MVP | Description |
|---------|-----|-------------|
| View profile info | ✅ | Name, email, phone |
| Edit profile | ✅ | Update contact details |
| Booking history | ✅ | List of past bookings |
| Member status | ✅ | Show discount eligibility |
| Change password | ✅ | Via Supabase Auth |
| Delete account | Phase 2 | GDPR compliance |

### 8.8 Member Dashboard Widget

```
┌─────────────────────────────────────────────────────────────────────────┐
│  👋 Welcome back, John!                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  🎫 MEMBER SINCE: January 2026                                          │
│  📊 TOTAL BOOKINGS: 7                                                   │
│  💰 TOTAL SPENT: LKR 28,450                                             │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  🎁 YOU HAVE A 10% DISCOUNT AVAILABLE!                           │   │
│  │                                                                   │   │
│  │  Your last booking was 12 days ago.                              │   │
│  │  Book within the next 18 days to keep your member discount.      │   │
│  │                                                                   │   │
│  │                                        [Book Now & Save 10%]     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  UPCOMING BOOKINGS                                                       │
│  ─────────────────                                                       │
│  📅 Jul 20, 2026 | 4-Seater Room | Full Day | LKR 4,455 (10% off)      │
│                                                                          │
│  RECENT BOOKINGS                                                         │
│  ───────────────                                                         │
│  📅 Jul 1, 2026  | Hot Desk | Half Day | LKR 490 | Completed            │
│  📅 Jun 15, 2026 | 5-Seater Room | Full Day | LKR 5,355 | Completed    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Frontend Pages

### 9.1 Page Structure

```
/                       # Homepage
/about                  # About Us
/booking                # Space listing + booking flow
/booking/[spaceId]      # Space details + date/slot selection
/booking/checkout       # Guest info + payment selection
/booking/success        # Confirmation page
/booking/cancel         # Cancellation page
/contact                # Contact form
/terms                  # Terms & Conditions
/privacy                # Privacy Policy

# Auth Pages
/login                  # Member login
/signup                 # Member registration
/forgot-password        # Password reset

# Member Profile
/profile                # Member dashboard
/profile/bookings       # Booking history
/profile/settings       # Account settings

# Admin Pages
/admin                  # Admin login
/admin/dashboard        # Overview + stats
/admin/bookings         # Booking list
/admin/calendar         # Calendar view
/admin/bookings/new     # Create walk-in booking
/admin/settings         # System settings
```

### 9.2 Key Components

| Component | Purpose |
|-----------|---------|
| `SpaceCard` | Display space with image, pricing, CTA |
| `AvailabilityCalendar` | Date picker with availability indicators |
| `SlotSelector` | Time slot selection with pricing |
| `BookingForm` | Guest details + addons |
| `PaymentSelector` | PayHere / QR payment choice |
| `BookingConfirmation` | Success page with details |
| `AdminCalendar` | Full calendar view with bookings |
| `BookingModal` | Quick view/edit booking |
| `MemberDashboard` | Member profile with discount status |
| `AuthModal` | Login/signup modal at checkout |

### 9.3 Mobile-First Design

Following the uploaded screenshots:
- Orange (#F97316) as primary accent
- Dark (#1F2937) for headers/CTAs
- Clean white backgrounds
- Card-based layout
- Sticky mobile booking bar

---

## 10. Admin Dashboard

### 10.1 MVP Admin Requirements (Week 1-4)

The admin panel must deliver **three core functions** at launch:

| # | Requirement | Description |
|---|-------------|-------------|
| 1 | **View All Bookings** | List/calendar view of all bookings with filters |
| 2 | **View Resource Availability** | Real-time view of what's available to book |
| 3 | **Create Bookings** | Admin can book on behalf of walk-in/phone customers |

### 10.2 Dashboard Features

| Feature | Priority | MVP? | Description |
|---------|----------|------|-------------|
| **Availability Dashboard** | P0 | ✅ | Real-time grid showing available slots per resource |
| **Booking Calendar** | P0 | ✅ | Day/week view with all bookings |
| **Booking List** | P0 | ✅ | Filterable table of all bookings |
| **Create Booking** | P0 | ✅ | Form to create booking (walk-in, phone, cash) |
| **Quick Check-in** | P0 | ✅ | One-click check-in from calendar |
| **QR Payment Confirm** | P0 | ✅ | Confirm bank transfers |
| Today's Summary | P1 | ⚠️ | Bookings count, revenue (if time permits) |
| Customer Search | P2 | ❌ | Phase 2 |
| Drag-drop Reschedule | P2 | ❌ | Phase 2 |

### 10.3 Availability Dashboard (MVP Core)

**Purpose:** Front desk staff needs to instantly see what's available RIGHT NOW and for upcoming dates.

```
┌─────────────────────────────────────────────────────────────────────┐
│  📅 Today: Monday, July 13, 2026                    [← Prev] [Next →]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  RESOURCE          │ MORNING    │ AFTERNOON  │ FULL DAY  │ UNLIMITED │
│                    │ 8am-12pm   │ 12pm-4pm   │ 8am-5pm   │ 8am-8pm   │
│  ──────────────────┼────────────┼────────────┼───────────┼───────────│
│  🪑 Hot Desk (10)  │ 8 avail ✅ │ 6 avail ✅ │ 6 avail ✅│ 5 avail ✅│
│  💼 Workspace (8)  │ 5 avail ✅ │ 7 avail ✅ │ 5 avail ✅│ 4 avail ✅│
│  🚪 4-Seat Room    │ ✅ FREE    │ ❌ BOOKED  │ ❌ BOOKED │ ❌ BOOKED │
│  🚪 4-Seat Black   │ ❌ BOOKED  │ ✅ FREE    │ ❌ BOOKED │ ❌ BOOKED │
│  🚪 5-Seat Room    │ ✅ FREE    │ ✅ FREE    │ ✅ FREE   │ ✅ FREE   │
│  🛋️ Lobby          │ ✅ FREE    │ ✅ FREE    │ N/A       │ N/A       │
│                                                                      │
│  [+ Create Booking]                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

**Interactions:**
- Click any ✅ cell → Opens "Create Booking" modal pre-filled with resource + slot
- Click any ❌ cell → Shows booking details with option to view/check-in
- Date navigation → Updates availability grid
- Real-time updates via Supabase Realtime subscriptions

### 10.4 Booking List View (MVP Core)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Bookings                                          [+ New Booking]   │
├─────────────────────────────────────────────────────────────────────┤
│  Filters: [Today ▼] [All Spaces ▼] [All Status ▼]    🔍 Search      │
├─────────────────────────────────────────────────────────────────────┤
│  # │ Booking ID   │ Customer      │ Space        │ Date    │ Slot  │ Status    │ Actions     │
│  ──┼──────────────┼───────────────┼──────────────┼─────────┼───────┼───────────┼─────────────│
│  1 │ CW260713-001 │ John Doe      │ 4-Seat Room  │ Jul 13  │ PM    │ Confirmed │ [Check-in]  │
│  2 │ CW260713-002 │ Acme Corp     │ 5-Seat Room  │ Jul 13  │ Full  │ Checked-in│ [View]      │
│  3 │ CW260713-003 │ Jane Smith    │ Hot Desk     │ Jul 13  │ AM    │ Pending   │ [Confirm QR]│
│  4 │ CW260714-001 │ XYZ Ltd       │ Lobby        │ Jul 14  │ 2hr   │ Confirmed │ [View]      │
└─────────────────────────────────────────────────────────────────────┘
```

**Actions per status:**
- `pending_payment` → [Confirm QR Payment] [Cancel]
- `confirmed` → [Check-in] [Cancel] [View]
- `checked_in` → [Complete] [View]
- `completed` → [View]
- `cancelled` → [View]

### 10.5 Create Booking Flow (MVP Core)

**Use cases:**
1. Walk-in customer at front desk
2. Phone booking
3. Corporate booking (quotation flow - Phase 2)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Create New Booking                                          [X]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  STEP 1: Select Resource                                            │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ [Hot Desk ▼]  [4-Seat Room]  [4-Seat Black]  [5-Seat]  [Lobby]│   │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  STEP 2: Select Date & Slot                                         │
│  ┌──────────────┐  ┌─────────────────────────────────────────┐      │
│  │ 📅 Jul 13    │  │ ○ Half Day (AM) - LKR 3,450            │      │
│  │    2026      │  │ ○ Half Day (PM) - LKR 3,450            │      │
│  └──────────────┘  │ ● Full Day - LKR 4,950        ✅ Avail │      │
│                    │ ○ Unlimited - LKR 5,950                 │      │
│                    └─────────────────────────────────────────┘      │
│                                                                      │
│  STEP 3: Customer Details                                           │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Name:  [John Doe                    ]                       │    │
│  │ Email: [john@example.com            ]                       │    │
│  │ Phone: [+94 77 123 4567             ]                       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  STEP 4: Add-ons (Optional)                                         │
│  ☐ Projector (LKR 1,800)   ☐ Screen (LKR 2,400)   ☐ 10GB Data      │
│                                                                      │
│  STEP 5: Payment Method                                             │
│  ● Cash (Received)   ○ Card Terminal   ○ QR Transfer (Pending)     │
│                                                                      │
│  ───────────────────────────────────────────────────────────────    │
│  TOTAL: LKR 4,950                                                   │
│                                                       [Create Booking]│
└─────────────────────────────────────────────────────────────────────┘
```

**Payment handling for admin-created bookings:**

| Method | Booking Status | Zoho Action |
|--------|----------------|-------------|
| Cash (Received) | `confirmed` | Create invoice + mark paid |
| Card Terminal | `confirmed` | Create invoice + mark paid |
| QR Transfer (Pending) | `pending_payment` | Wait for confirmation |
| Send Payment Link | `pending_payment` | Generate PayHere link, email to customer |

### 10.6 Admin Calendar View (Week View)

```
┌─────────────────────────────────────────────────────────────────┐
│  July 2026                              [Day] [Week] [Month]    │
├─────────────────────────────────────────────────────────────────┤
│           │ Mon 13 │ Tue 14 │ Wed 15 │ Thu 16 │ Fri 17 │       │
├───────────┼────────┼────────┼────────┼────────┼────────┤       │
│ Hot Desk  │   8/10 │   6/10 │   9/10 │   5/10 │   3/10 │       │
│           │  ████  │  ███   │  █████ │  ██    │  █     │       │
├───────────┼────────┼────────┼────────┼────────┼────────┤       │
│ Workspace │   5/8  │   7/8  │   4/8  │   8/8  │   6/8  │       │
│           │  ███   │  ████  │  ██    │  █████ │  ███   │       │
├───────────┼────────┼────────┼────────┼────────┼────────┤       │
│ 4-Seat    │ [John] │   ✅   │ [Acme] │   ✅   │ [XYZ]  │       │
│ Room      │ 9am-1pm│  FREE  │ All Day│  FREE  │ 2-6pm  │       │
├───────────┼────────┼────────┼────────┼────────┼────────┤       │
│ 4-Seat    │   ✅   │ [Tech] │   ✅   │ [Dev]  │   ✅   │       │
│ Black     │  FREE  │ 10-2pm │  FREE  │ 8-12pm │  FREE  │       │
├───────────┼────────┼────────┼────────┼────────┼────────┤       │
│ 5-Seat    │   ✅   │ [ABC]  │   ✅   │[Corp]  │   ✅   │       │
│ Room      │  FREE  │ 10-2pm │  FREE  │ All Day│  FREE  │       │
├───────────┼────────┼────────┼────────┼────────┼────────┤       │
│ Lobby     │   ✅   │   ✅   │[Photo] │   ✅   │   ✅   │       │
│           │  FREE  │  FREE  │ 2-4pm  │  FREE  │  FREE  │       │
└───────────┴────────┴────────┴────────┴────────┴────────┘

Legend: [Name] = Booked (click to view)  |  ✅ FREE (click to book)  |  X/Y = used/total
```

**Calendar interactions:**
- Click booking block → View booking details modal
- Click FREE cell → Create booking modal (pre-filled)
- Hover → Show quick summary tooltip
- Color coding: Green = Confirmed, Yellow = Pending, Blue = Checked-in

### 10.7 Admin Auth

Using Supabase Auth with role-based access:

```typescript
// /middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (!user || !['admin', 'frontdesk'].includes(user.role)) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
  
  return res;
}
```

---

## 11. Deployment Architecture

### 11.1 Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│                         Vercel                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Next.js Application                     │    │
│  │  • Server Components (SSR)                          │    │
│  │  • API Routes (/api/*)                              │    │
│  │  • Edge Middleware (auth, redirects)                │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│              cowork.lk (Custom Domain)                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Supabase                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │PostgreSQL│  │   Auth   │  │ Storage  │  │ Realtime │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 Environment Variables

```env
# App
NEXT_PUBLIC_URL=https://cowork.lk
NEXT_PUBLIC_PHONE=+94774884040

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# PayHere
PAYHERE_MERCHANT_ID=xxx
PAYHERE_MERCHANT_SECRET=xxx
PAYHERE_MODE=live

# Zoho
ZOHO_CLIENT_ID=xxx
ZOHO_CLIENT_SECRET=xxx
ZOHO_REFRESH_TOKEN=xxx
ZOHO_ORGANIZATION_ID=xxx

# Email
RESEND_API_KEY=xxx
EMAIL_FROM=bookings@cowork.lk
```

### 11.3 Domain Setup

1. Point `cowork.lk` DNS to Vercel
2. Configure SSL (automatic via Vercel)
3. Set up email DNS records (SPF, DKIM) for transactional emails

---

## 12. Development Timeline

### 12.1 Week-by-Week Plan

#### Week 1: Foundation
| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Project setup, Supabase config, DB schema | Working dev environment |
| 2 | Auth setup, user model, admin middleware | Login/logout working |
| 3 | Space & pricing CRUD, seed data | Spaces displaying |
| 4 | Homepage, About, Contact pages | Public pages live |
| 5 | Booking page, space listing | Space catalog complete |

#### Week 2: Booking Flow
| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Availability calendar component | Date selection working |
| 2 | Slot selection, pricing display | Slot booking UI |
| 3 | Guest form, addons selection | Checkout flow |
| 4 | PayHere integration (sandbox) | Payment redirect working |
| 5 | Payment webhook, booking confirmation | End-to-end booking |

#### Week 3: Zoho + Admin
| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Zoho OAuth, token refresh | Zoho connection |
| 2 | Customer sync, invoice creation | Invoices generating |
| 3 | Admin dashboard, booking list | Admin can view bookings |
| 4 | Admin calendar view | Calendar displaying |
| 5 | Walk-in booking, QR payment confirm | Manual booking working |

#### Week 4: Polish + Launch
| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Email notifications (confirmation) | Emails sending |
| 2 | Cancellation flow, refund logic | Cancellations working |
| 3 | Mobile responsive fixes, UX polish | Mobile-ready |
| 4 | PayHere live mode, Zoho production | Production credentials |
| 5 | Final testing, DNS switch, launch | **LIVE** |

### 12.2 Critical Path

```
Setup → Spaces → Availability → Booking → PayHere → Zoho → Admin → Launch
  │                                │           │
  └────────────────────────────────┴───────────┘
                CRITICAL PATH (no slack)
```

### 12.3 Parallel Tracks

| Track A (Critical) | Track B (Can Slip) |
|--------------------|---------------------|
| DB schema | UI polish |
| Booking flow | About/Contact pages |
| PayHere integration | Email templates |
| Zoho invoice | Admin analytics |
| Admin calendar | Mobile optimizations |

---

## 13. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| PayHere sandbox/live differences | Medium | High | Test with live credentials early (day 2 of week 4) |
| Zoho token refresh failures | Medium | High | Implement retry logic, alert on failure |
| Availability race conditions | Low | High | Use DB transactions, pessimistic locking |
| Supabase free tier limits | Low | Medium | Monitor usage, upgrade plan if needed |
| SSL/DNS propagation delays | Low | Medium | Configure DNS 48hrs before launch |
| Scope creep | High | High | Strict MVP boundaries, defer to Phase 2 |
| Madusanka availability | Medium | Critical | Document everything, no single-point-of-failure |

---

## Appendix A: Contact Information

**Cowork Lanka (Private) Limited**  
279 Avissawella Road, Pannipitiya 10230  
Western Province, Sri Lanka

📞 **Hotline:** +94 77 488 4040  
📧 **Email:** hello@cowork.lk (general) / business@cowork.lk (corporate)  
🌐 **Website:** https://cowork.lk

**Social Media:**
- Facebook / LinkedIn / Instagram / YouTube / TikTok

---

## Appendix B: Zoho Item Reference

| Category | Item Name | Zoho Item ID | Price (LKR) |
|----------|-----------|--------------|-------------|
| Hot Desk | Half Day | 4944213000001171243 | 490 |
| Hot Desk | Full Day | 4944213000001171232 | 790 |
| Hot Desk | Unlimited | 4944213000001171254 | 990 |
| Workspace | Half Day | 4944213000000084278 | 790 |
| Workspace | Full Day | 4944213000000084226 | 1,000 |
| Workspace | Unlimited | 4944213000000100027 | 1,350 |
| 4-Seater | Half Day | 4944213000000154001 | 3,450 |
| 4-Seater | Full Day | 4944213000000152001 | 4,950 |
| 4-Seater | Unlimited | 4944213000000175001 | 5,950 |
| 4-Seater Black | Half Day | 4944213000001985001 | 3,450 |
| 4-Seater Black | Full Day | 4944213000001985012 | 4,950 |
| 4-Seater Black | Unlimited | 4944213000001983049 | 5,950 |
| 5-Seater | Half Day | 4944213000001171199 | 3,950 |
| 5-Seater | Full Day | 4944213000001171210 | 5,950 |
| 5-Seater | Unlimited | 4944213000001171221 | 6,750 |
| Lobby | 1hr (3 pax) | 4944213000001171476 | 1,200 |
| Lobby | 2hr (10 pax) | 4944213000001171487 | 6,500 |
| Lobby | Additional Hour | 4944213000000181010 | 1,800 |
| Add-on | 5GB Data | 4944213000001171366 | 650 |
| Add-on | 10GB Data | 4944213000001171388 | 1,300 |
| Add-on | 20GB Data | 4944213000001171377 | 2,500 |
| Add-on | Monitor Rental | 4944213000001171305 | 500 |
| Add-on | Projector ≤4hr | 4944213000001171316 | 1,800 |
| Add-on | Projector >4hr | 4944213000001171349 | 2,800 |
| Add-on | Screen ≤4hr | 4944213000001171327 | 2,400 |
| Add-on | Screen >4hr | 4944213000001171338 | 3,800 |
| Add-on | Photocopy B&W | 4944213000001171288 | 10 |

---

## Appendix C: Included Amenities

All bookings include:
- 🚀 High-Speed Fiber WiFi
- ☕ Unlimited Coffee & Tea
- 🛋️ Lounge & Foosball Play Area
- 🤝 Networking Events
- 🛎️ 24/7 Customer Support

---

*Document Version: 1.0*  
*Last Updated: July 2, 2026*
