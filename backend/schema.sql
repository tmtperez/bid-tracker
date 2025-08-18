-- Companies, Contacts, Bids, Scopes
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  company_id INT REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bids (
  id SERIAL PRIMARY KEY,
  company_id INT REFERENCES companies(id) ON DELETE SET NULL,
  project TEXT NOT NULL,
  date_sent DATE,
  last_contact DATE,
  status TEXT CHECK (status IN ('active','won','lost','pending')) DEFAULT 'active',
  value NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scopes (
  id SERIAL PRIMARY KEY,
  bid_id INT REFERENCES bids(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cost NUMERIC(14,2) DEFAULT 0,
  status TEXT CHECK (status IN ('open','in_progress','done','not_applicable')) DEFAULT 'open'
);

-- Simple aggregates via views
CREATE OR REPLACE VIEW v_dashboard AS
SELECT
  (SELECT COALESCE(SUM(value),0) FROM bids WHERE status='active') AS active_pipeline_value,
  (SELECT COALESCE(SUM(value),0) FROM bids WHERE status='won') AS total_won,
  (SELECT COALESCE(COUNT(*),0) FROM bids WHERE status='won') AS count_won,
  (SELECT COALESCE(COUNT(*),0) FROM bids WHERE status='lost') AS count_lost;