-- Migration: Bankability Module
-- Adds tables for stress testing, financial projections, and legal defensibility

-- ============================================
-- STRESS TESTING & SCENARIO ANALYSIS
-- ============================================

-- Supply contracts for commitment tracking
CREATE TABLE IF NOT EXISTS supply_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id TEXT NOT NULL UNIQUE,
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  feedstock_id UUID REFERENCES feedstocks(id),

  -- Contract terms
  contract_type TEXT NOT NULL DEFAULT 'spot', -- 'spot' | 'forward' | 'offtake' | 'framework'
  volume_committed_tonnes NUMERIC NOT NULL,
  volume_minimum_tonnes NUMERIC,
  duration_months INTEGER,

  -- Pricing
  price_per_tonne NUMERIC NOT NULL,
  price_type TEXT NOT NULL DEFAULT 'fixed', -- 'fixed' | 'indexed' | 'floating'
  price_index_reference TEXT, -- e.g., 'Platts UCO EU'
  escalation_percentage NUMERIC,

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'pending' | 'active' | 'expired' | 'terminated'

  -- Metadata
  notes TEXT,
  documents JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_supply_contracts_buyer ON supply_contracts(buyer_id);
CREATE INDEX idx_supply_contracts_supplier ON supply_contracts(supplier_id);
CREATE INDEX idx_supply_contracts_status ON supply_contracts(status);

-- Generate contract ID trigger
CREATE OR REPLACE FUNCTION generate_contract_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.contract_id := 'CTR-' || TO_CHAR(NOW(), 'YYYYMM') || '-' ||
    LPAD(NEXTVAL('contract_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS contract_seq START 1;

CREATE TRIGGER trigger_generate_contract_id
  BEFORE INSERT ON supply_contracts
  FOR EACH ROW
  WHEN (NEW.contract_id IS NULL)
  EXECUTE FUNCTION generate_contract_id();

-- Stress test scenarios
CREATE TABLE IF NOT EXISTS stress_test_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id TEXT NOT NULL UNIQUE,
  buyer_id UUID REFERENCES buyers(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),

  -- Scenario definition
  name TEXT NOT NULL,
  description TEXT,
  scenario_type TEXT NOT NULL, -- 'price_shock' | 'supply_disruption' | 'covenant_breach' | 'regulatory' | 'custom'

  -- Parameters
  parameters JSONB NOT NULL DEFAULT '{}',
  -- Example structure:
  -- {
  --   "price_shock_percentage": 30,
  --   "supply_reduction_percentage": 50,
  --   "affected_suppliers": ["uuid1", "uuid2"],
  --   "affected_categories": ["UCO", "tallow"],
  --   "duration_months": 6,
  --   "carbon_price_increase": 50
  -- }

  -- Baseline assumptions
  baseline_assumptions JSONB NOT NULL DEFAULT '{}',
  -- {
  --   "annual_volume_required": 50000,
  --   "current_average_price": 850,
  --   "carbon_credit_price": 45,
  --   "fuel_blend_mandate": 7.5
  -- }

  -- Results
  results JSONB,
  -- {
  --   "financial_impact": -2500000,
  --   "supply_gap_tonnes": 15000,
  --   "alternative_cost": 127.50,
  --   "risk_score": 7.2,
  --   "mitigation_options": [...]
  -- }

  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'running' | 'completed' | 'failed'
  run_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stress_scenarios_buyer ON stress_test_scenarios(buyer_id);
CREATE INDEX idx_stress_scenarios_type ON stress_test_scenarios(scenario_type);
CREATE INDEX idx_stress_scenarios_status ON stress_test_scenarios(status);

-- Generate scenario ID trigger
CREATE OR REPLACE FUNCTION generate_scenario_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.scenario_id := 'SCN-' ||
    UPPER(SUBSTRING(NEW.scenario_type FROM 1 FOR 3)) || '-' ||
    TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
    LPAD(NEXTVAL('scenario_seq')::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS scenario_seq START 1;

CREATE TRIGGER trigger_generate_scenario_id
  BEFORE INSERT ON stress_test_scenarios
  FOR EACH ROW
  WHEN (NEW.scenario_id IS NULL)
  EXECUTE FUNCTION generate_scenario_id();

-- Financial projections
CREATE TABLE IF NOT EXISTS financial_projections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  projection_id TEXT NOT NULL UNIQUE,
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),

  -- Projection details
  name TEXT NOT NULL,
  base_date DATE NOT NULL,
  horizon_months INTEGER NOT NULL DEFAULT 12,

  -- Volume projections
  annual_volume_tonnes NUMERIC NOT NULL,
  volume_growth_rate NUMERIC DEFAULT 0,

  -- Price assumptions
  average_price_per_tonne NUMERIC NOT NULL,
  price_escalation_rate NUMERIC DEFAULT 0,

  -- Carbon assumptions
  carbon_intensity_target NUMERIC,
  carbon_credit_price NUMERIC,

  -- Results
  total_projected_value NUMERIC,
  projected_carbon_savings NUMERIC,
  projected_carbon_credits NUMERIC,

  -- Detailed projections by period
  period_projections JSONB DEFAULT '[]',
  -- [
  --   { "period": 1, "volume": 4166, "price": 850, "value": 3541100, "carbon_savings": 2500 },
  --   ...
  -- ]

  -- Assumptions documentation (for legal defensibility)
  methodology_notes TEXT,
  data_sources JSONB DEFAULT '[]',
  disclaimers TEXT[],

  status TEXT NOT NULL DEFAULT 'draft',
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_financial_projections_buyer ON financial_projections(buyer_id);

-- Generate projection ID trigger
CREATE OR REPLACE FUNCTION generate_projection_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.projection_id := 'PRJ-' || TO_CHAR(NEW.base_date, 'YYYYMM') || '-' ||
    LPAD(NEXTVAL('projection_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS projection_seq START 1;

CREATE TRIGGER trigger_generate_projection_id
  BEFORE INSERT ON financial_projections
  FOR EACH ROW
  WHEN (NEW.projection_id IS NULL)
  EXECUTE FUNCTION generate_projection_id();

-- Supplier risk assessments
CREATE TABLE IF NOT EXISTS supplier_risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  assessed_by UUID REFERENCES profiles(id),

  -- Risk scores (0-100, higher = more risk)
  delivery_risk_score NUMERIC NOT NULL DEFAULT 0,
  price_volatility_score NUMERIC NOT NULL DEFAULT 0,
  concentration_risk_score NUMERIC NOT NULL DEFAULT 0,
  financial_stability_score NUMERIC NOT NULL DEFAULT 0,
  regulatory_risk_score NUMERIC NOT NULL DEFAULT 0,

  -- Overall
  overall_risk_score NUMERIC GENERATED ALWAYS AS (
    (delivery_risk_score * 0.25) +
    (price_volatility_score * 0.20) +
    (concentration_risk_score * 0.20) +
    (financial_stability_score * 0.20) +
    (regulatory_risk_score * 0.15)
  ) STORED,

  risk_rating TEXT GENERATED ALWAYS AS (
    CASE
      WHEN (delivery_risk_score * 0.25 + price_volatility_score * 0.20 +
            concentration_risk_score * 0.20 + financial_stability_score * 0.20 +
            regulatory_risk_score * 0.15) <= 25 THEN 'low'
      WHEN (delivery_risk_score * 0.25 + price_volatility_score * 0.20 +
            concentration_risk_score * 0.20 + financial_stability_score * 0.20 +
            regulatory_risk_score * 0.15) <= 50 THEN 'moderate'
      WHEN (delivery_risk_score * 0.25 + price_volatility_score * 0.20 +
            concentration_risk_score * 0.20 + financial_stability_score * 0.20 +
            regulatory_risk_score * 0.15) <= 75 THEN 'elevated'
      ELSE 'high'
    END
  ) STORED,

  -- Supporting data
  assessment_data JSONB DEFAULT '{}',
  notes TEXT,

  -- Validity
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_supplier_risk_supplier ON supplier_risk_assessments(supplier_id);
CREATE INDEX idx_supplier_risk_date ON supplier_risk_assessments(assessment_date);

-- ============================================
-- LEGAL DEFENSIBILITY & AUDIT TRAIL
-- ============================================

-- Methodology provenance tracking
CREATE TABLE IF NOT EXISTS methodology_provenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- What was calculated
  entity_type TEXT NOT NULL, -- 'abfi_score' | 'ci_report' | 'stress_test' | 'projection' | 'risk_assessment'
  entity_id UUID NOT NULL,

  -- Methodology details
  methodology_name TEXT NOT NULL,
  methodology_version TEXT NOT NULL,
  calculation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Inputs used
  input_data JSONB NOT NULL,
  input_sources JSONB DEFAULT '[]',
  -- [{ "source": "Supplier Declaration", "date": "2024-01-15", "verified": true }]

  -- Calculation details
  calculation_steps JSONB DEFAULT '[]',
  -- [{ "step": 1, "operation": "Calculate scope 1", "result": 12.5, "formula": "..." }]

  -- Output
  output_data JSONB NOT NULL,

  -- Uncertainty and confidence
  confidence_level TEXT, -- 'high' | 'medium' | 'low'
  uncertainty_notes TEXT,

  -- Verification
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_methodology_entity ON methodology_provenance(entity_type, entity_id);

-- Disclaimer templates
CREATE TABLE IF NOT EXISTS disclaimer_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,

  -- Applicability
  applies_to TEXT[], -- ['stress_test', 'projection', 'certificate', 'report']
  is_required BOOLEAN DEFAULT false,

  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default disclaimers
INSERT INTO disclaimer_templates (code, title, content, applies_to, is_required) VALUES
('PROJ_FORWARD', 'Forward-Looking Statements',
 'This projection contains forward-looking statements based on current assumptions and market conditions. Actual results may differ materially from projections due to changes in commodity prices, regulatory requirements, supply availability, and other factors. Past performance is not indicative of future results.',
 ARRAY['projection', 'stress_test'], true),

('DATA_ACCURACY', 'Data Accuracy Disclaimer',
 'The data presented in this report has been sourced from supplier declarations, third-party certifications, and ABFI platform calculations. While reasonable efforts have been made to ensure accuracy, ABFI does not warrant the completeness or accuracy of third-party data.',
 ARRAY['report', 'certificate', 'stress_test', 'projection'], true),

('CI_METHODOLOGY', 'Carbon Intensity Methodology',
 'Carbon intensity values are calculated in accordance with RED II methodology using default or measured emission factors as indicated. Values are expressed in gCO2e/MJ and represent lifecycle greenhouse gas emissions from feedstock cultivation through to fuel production.',
 ARRAY['ci_report', 'certificate'], true),

('NOT_FINANCIAL_ADVICE', 'Not Financial Advice',
 'This analysis is provided for informational purposes only and does not constitute financial, investment, or professional advice. Users should consult with qualified professionals before making business decisions based on this information.',
 ARRAY['stress_test', 'projection', 'risk_assessment'], true),

('STRESS_TEST', 'Stress Test Limitations',
 'Stress test scenarios represent hypothetical situations and are not predictions of future events. Results are based on simplified models and assumptions that may not capture all real-world complexities. Actual impacts of adverse events may be more or less severe than modeled.',
 ARRAY['stress_test'], true);

-- ============================================
-- ABBA DATA INTEGRATION
-- ============================================

-- ABBA data import logs
CREATE TABLE IF NOT EXISTS abba_import_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  import_type TEXT NOT NULL, -- 'feedstock' | 'price' | 'volume' | 'full'
  source_file TEXT,
  source_url TEXT,

  -- Import stats
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,

  -- Errors
  errors JSONB DEFAULT '[]',

  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Who ran it
  imported_by UUID NOT NULL REFERENCES profiles(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ABBA market prices (for stress testing reference)
CREATE TABLE IF NOT EXISTS abba_market_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  feedstock_category TEXT NOT NULL,
  region TEXT NOT NULL, -- 'AU' | 'EU' | 'US' | 'APAC'

  price_date DATE NOT NULL,
  price_aud_per_tonne NUMERIC NOT NULL,
  price_usd_per_tonne NUMERIC,

  -- Price range
  price_low NUMERIC,
  price_high NUMERIC,

  -- Volume context
  volume_available_tonnes NUMERIC,

  -- Source
  source TEXT NOT NULL, -- 'ABBA' | 'Platts' | 'Argus' | 'manual'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_abba_prices_unique ON abba_market_prices(feedstock_category, region, price_date);
CREATE INDEX idx_abba_prices_date ON abba_market_prices(price_date);

-- ============================================
-- ADMIN SYSTEM METRICS
-- ============================================

-- System metrics for admin dashboard
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  metric_date DATE NOT NULL,
  metric_type TEXT NOT NULL, -- 'daily' | 'weekly' | 'monthly'

  -- User metrics
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,

  -- Supplier metrics
  total_suppliers INTEGER DEFAULT 0,
  verified_suppliers INTEGER DEFAULT 0,
  new_suppliers INTEGER DEFAULT 0,

  -- Buyer metrics
  total_buyers INTEGER DEFAULT 0,
  active_buyers INTEGER DEFAULT 0,
  new_buyers INTEGER DEFAULT 0,

  -- Feedstock metrics
  total_feedstocks INTEGER DEFAULT 0,
  active_feedstocks INTEGER DEFAULT 0,
  new_feedstocks INTEGER DEFAULT 0,

  -- Transaction metrics
  total_inquiries INTEGER DEFAULT 0,
  new_inquiries INTEGER DEFAULT 0,
  converted_inquiries INTEGER DEFAULT 0,
  total_transaction_value NUMERIC DEFAULT 0,

  -- CI Report metrics
  ci_reports_submitted INTEGER DEFAULT 0,
  ci_reports_verified INTEGER DEFAULT 0,
  average_ci_value NUMERIC,

  -- Platform health
  api_requests INTEGER DEFAULT 0,
  avg_response_time_ms NUMERIC,
  error_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_system_metrics_unique ON system_metrics(metric_date, metric_type);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE supply_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_test_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE methodology_provenance ENABLE ROW LEVEL SECURITY;

-- Contracts: Buyers see own, suppliers see theirs, admins see all
CREATE POLICY "Buyers can manage own contracts" ON supply_contracts
  FOR ALL USING (
    buyer_id IN (SELECT id FROM buyers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Suppliers can view their contracts" ON supply_contracts
  FOR SELECT USING (
    supplier_id IN (SELECT id FROM suppliers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Admins can manage all contracts" ON supply_contracts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Stress tests & projections: Owner or admin
CREATE POLICY "Users can manage own scenarios" ON stress_test_scenarios
  FOR ALL USING (
    created_by = auth.uid() OR
    buyer_id IN (SELECT id FROM buyers WHERE profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can manage own projections" ON financial_projections
  FOR ALL USING (
    created_by = auth.uid() OR
    buyer_id IN (SELECT id FROM buyers WHERE profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Risk assessments: Admins and auditors can create, suppliers can view own
CREATE POLICY "Suppliers can view own risk assessments" ON supplier_risk_assessments
  FOR SELECT USING (
    supplier_id IN (SELECT id FROM suppliers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Admins and auditors can manage risk assessments" ON supplier_risk_assessments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'auditor'))
  );

-- Methodology provenance: Read by entity owners, write by system/admins
CREATE POLICY "Users can view relevant provenance" ON methodology_provenance
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage provenance" ON methodology_provenance
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
