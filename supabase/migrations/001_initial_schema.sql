-- ABFI Platform Initial Schema
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Enum Types
CREATE TYPE user_role AS ENUM ('supplier', 'buyer', 'admin', 'auditor');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'suspended', 'rejected');
CREATE TYPE subscription_tier AS ENUM ('starter', 'professional', 'enterprise');
CREATE TYPE feedstock_status AS ENUM ('draft', 'pending_review', 'active', 'suspended', 'archived');
CREATE TYPE verification_level AS ENUM ('self_declared', 'document_verified', 'third_party_audited', 'abfi_certified');
CREATE TYPE feedstock_category AS ENUM ('oilseed', 'UCO', 'tallow', 'lignocellulosic', 'waste', 'algae', 'other');
CREATE TYPE production_method AS ENUM ('crop', 'waste', 'residue', 'processing_byproduct');
CREATE TYPE certification_type AS ENUM ('ISCC_EU', 'ISCC_PLUS', 'RSB', 'RED_II', 'GO', 'ABFI', 'OTHER');
CREATE TYPE certification_status AS ENUM ('active', 'expired', 'revoked', 'pending');
CREATE TYPE inquiry_status AS ENUM ('pending', 'responded', 'closed', 'expired');
CREATE TYPE transaction_status AS ENUM ('pending', 'confirmed', 'in_transit', 'delivered', 'completed', 'disputed', 'cancelled');
CREATE TYPE australian_state AS ENUM ('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'supplier',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  abn TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  trading_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state australian_state NOT NULL,
  postcode TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Australia',
  website TEXT,
  description TEXT,
  logo_url TEXT,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  subscription_tier subscription_tier NOT NULL DEFAULT 'starter',
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Buyers table
CREATE TABLE buyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  abn TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  trading_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state australian_state NOT NULL,
  postcode TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Australia',
  facility_location GEOGRAPHY(POINT, 4326),
  website TEXT,
  description TEXT,
  logo_url TEXT,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  subscription_tier subscription_tier NOT NULL DEFAULT 'starter',
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feedstocks table
CREATE TABLE feedstocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedstock_id TEXT NOT NULL UNIQUE, -- ABFI-[TYPE]-[STATE]-[XXXXXX]
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  category feedstock_category NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  state australian_state NOT NULL,
  region TEXT,
  production_method production_method NOT NULL,
  annual_capacity_tonnes NUMERIC NOT NULL,
  available_volume_current NUMERIC NOT NULL DEFAULT 0,
  available_volume_forward JSONB, -- { "2024-01": 100, "2024-02": 150 }
  price_indication NUMERIC,
  price_unit TEXT DEFAULT 'AUD/tonne',

  -- ABFI Scores (0-100)
  abfi_score NUMERIC NOT NULL DEFAULT 0,
  sustainability_score NUMERIC NOT NULL DEFAULT 0,
  carbon_intensity_score NUMERIC NOT NULL DEFAULT 0,
  quality_score NUMERIC NOT NULL DEFAULT 0,
  reliability_score NUMERIC NOT NULL DEFAULT 0,

  -- Carbon Intensity
  carbon_intensity_value NUMERIC, -- gCO2e/MJ
  carbon_intensity_method TEXT,

  -- Status
  status feedstock_status NOT NULL DEFAULT 'draft',
  verification_level verification_level NOT NULL DEFAULT 'self_declared',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id)
);

-- Certificates table
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedstock_id UUID NOT NULL REFERENCES feedstocks(id) ON DELETE CASCADE,
  type certification_type NOT NULL,
  certificate_number TEXT NOT NULL,
  issuing_body TEXT NOT NULL,
  issued_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status certification_status NOT NULL DEFAULT 'active',
  document_url TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quality Tests table
CREATE TABLE quality_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedstock_id UUID NOT NULL REFERENCES feedstocks(id) ON DELETE CASCADE,
  test_date DATE NOT NULL,
  laboratory TEXT NOT NULL,
  report_number TEXT,
  parameters JSONB NOT NULL, -- Array of {name, value, unit, spec_min, spec_max, pass}
  report_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inquiries table
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  feedstock_id UUID REFERENCES feedstocks(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  volume_required NUMERIC,
  delivery_location TEXT,
  delivery_date_start DATE,
  delivery_date_end DATE,
  status inquiry_status NOT NULL DEFAULT 'pending',
  response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedstock_id UUID NOT NULL REFERENCES feedstocks(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  buyer_id UUID NOT NULL REFERENCES buyers(id),
  inquiry_id UUID REFERENCES inquiries(id),
  volume_tonnes NUMERIC NOT NULL,
  price_per_tonne NUMERIC,
  total_value NUMERIC,
  delivery_date DATE NOT NULL,
  delivery_address TEXT NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  quality_receipt_url TEXT,
  supplier_rating SMALLINT CHECK (supplier_rating >= 1 AND supplier_rating <= 5),
  supplier_feedback TEXT,
  buyer_rating SMALLINT CHECK (buyer_rating >= 1 AND buyer_rating <= 5),
  buyer_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('supplier', 'buyer')),
  feedstock_id UUID REFERENCES feedstocks(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('inquiry', 'transaction', 'certificate', 'verification', 'system')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shortlist table (buyers save feedstocks)
CREATE TABLE shortlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  feedstock_id UUID NOT NULL REFERENCES feedstocks(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(buyer_id, feedstock_id)
);

-- Indexes for performance
CREATE INDEX idx_feedstocks_supplier ON feedstocks(supplier_id);
CREATE INDEX idx_feedstocks_category ON feedstocks(category);
CREATE INDEX idx_feedstocks_state ON feedstocks(state);
CREATE INDEX idx_feedstocks_status ON feedstocks(status);
CREATE INDEX idx_feedstocks_abfi_score ON feedstocks(abfi_score DESC);
CREATE INDEX idx_feedstocks_location ON feedstocks USING GIST(location);
CREATE INDEX idx_certificates_feedstock ON certificates(feedstock_id);
CREATE INDEX idx_certificates_expiry ON certificates(expiry_date);
CREATE INDEX idx_quality_tests_feedstock ON quality_tests(feedstock_id);
CREATE INDEX idx_inquiries_buyer ON inquiries(buyer_id);
CREATE INDEX idx_inquiries_supplier ON inquiries(supplier_id);
CREATE INDEX idx_transactions_supplier ON transactions(supplier_id);
CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Full text search on feedstocks
CREATE INDEX idx_feedstocks_search ON feedstocks USING GIN(
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(type, ''))
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_buyers_updated_at BEFORE UPDATE ON buyers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_feedstocks_updated_at BEFORE UPDATE ON feedstocks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_quality_tests_updated_at BEFORE UPDATE ON quality_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to generate feedstock_id
CREATE OR REPLACE FUNCTION generate_feedstock_id()
RETURNS TRIGGER AS $$
DECLARE
  category_code TEXT;
  state_code TEXT;
  sequence_num INTEGER;
BEGIN
  -- Get category code
  category_code := UPPER(LEFT(NEW.category::TEXT, 3));

  -- Get state code
  state_code := NEW.state::TEXT;

  -- Get next sequence number for this category/state combination
  SELECT COALESCE(MAX(
    CAST(RIGHT(feedstock_id, 6) AS INTEGER)
  ), 0) + 1 INTO sequence_num
  FROM feedstocks
  WHERE feedstock_id LIKE 'ABFI-' || category_code || '-' || state_code || '-%';

  -- Generate the feedstock_id
  NEW.feedstock_id := 'ABFI-' || category_code || '-' || state_code || '-' || LPAD(sequence_num::TEXT, 6, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_feedstock_id_trigger
BEFORE INSERT ON feedstocks
FOR EACH ROW
WHEN (NEW.feedstock_id IS NULL)
EXECUTE FUNCTION generate_feedstock_id();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'supplier')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedstocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlists ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Suppliers policies
CREATE POLICY "Suppliers can view their own company" ON suppliers FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Suppliers can update their own company" ON suppliers FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Suppliers can insert their own company" ON suppliers FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Verified suppliers are viewable by all" ON suppliers FOR SELECT USING (verification_status = 'verified');
CREATE POLICY "Admins can manage all suppliers" ON suppliers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Buyers policies
CREATE POLICY "Buyers can view their own company" ON buyers FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Buyers can update their own company" ON buyers FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Buyers can insert their own company" ON buyers FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Admins can manage all buyers" ON buyers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Feedstocks policies
CREATE POLICY "Active feedstocks are viewable by all authenticated" ON feedstocks FOR SELECT USING (
  status = 'active' AND auth.uid() IS NOT NULL
);
CREATE POLICY "Suppliers can manage their own feedstocks" ON feedstocks FOR ALL USING (
  supplier_id IN (SELECT id FROM suppliers WHERE profile_id = auth.uid())
);
CREATE POLICY "Admins can manage all feedstocks" ON feedstocks FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Certificates policies
CREATE POLICY "Certificates viewable with feedstock" ON certificates FOR SELECT USING (
  feedstock_id IN (SELECT id FROM feedstocks WHERE status = 'active')
);
CREATE POLICY "Suppliers can manage their feedstock certificates" ON certificates FOR ALL USING (
  feedstock_id IN (
    SELECT f.id FROM feedstocks f
    JOIN suppliers s ON f.supplier_id = s.id
    WHERE s.profile_id = auth.uid()
  )
);

-- Quality tests policies
CREATE POLICY "Quality tests viewable with feedstock" ON quality_tests FOR SELECT USING (
  feedstock_id IN (SELECT id FROM feedstocks WHERE status = 'active')
);
CREATE POLICY "Suppliers can manage their feedstock quality tests" ON quality_tests FOR ALL USING (
  feedstock_id IN (
    SELECT f.id FROM feedstocks f
    JOIN suppliers s ON f.supplier_id = s.id
    WHERE s.profile_id = auth.uid()
  )
);

-- Inquiries policies
CREATE POLICY "Buyers can view their own inquiries" ON inquiries FOR SELECT USING (
  buyer_id IN (SELECT id FROM buyers WHERE profile_id = auth.uid())
);
CREATE POLICY "Suppliers can view inquiries sent to them" ON inquiries FOR SELECT USING (
  supplier_id IN (SELECT id FROM suppliers WHERE profile_id = auth.uid())
);
CREATE POLICY "Buyers can create inquiries" ON inquiries FOR INSERT WITH CHECK (
  buyer_id IN (SELECT id FROM buyers WHERE profile_id = auth.uid())
);
CREATE POLICY "Suppliers can respond to inquiries" ON inquiries FOR UPDATE USING (
  supplier_id IN (SELECT id FROM suppliers WHERE profile_id = auth.uid())
);

-- Transactions policies
CREATE POLICY "Parties can view their transactions" ON transactions FOR SELECT USING (
  supplier_id IN (SELECT id FROM suppliers WHERE profile_id = auth.uid()) OR
  buyer_id IN (SELECT id FROM buyers WHERE profile_id = auth.uid())
);

-- Documents policies
CREATE POLICY "Owners can manage their documents" ON documents FOR ALL USING (
  (owner_type = 'supplier' AND owner_id IN (SELECT id FROM suppliers WHERE profile_id = auth.uid())) OR
  (owner_type = 'buyer' AND owner_id IN (SELECT id FROM buyers WHERE profile_id = auth.uid()))
);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Audit logs policies (read-only for admins)
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Shortlists policies
CREATE POLICY "Buyers can manage their shortlists" ON shortlists FOR ALL USING (
  buyer_id IN (SELECT id FROM buyers WHERE profile_id = auth.uid())
);
