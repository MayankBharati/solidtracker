-- Safe Schema Execution - Handles existing objects
-- This script can be run multiple times without errors

-- Create teams table (if not exists)
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  organization_id UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create team_assignments table (if not exists)
CREATE TABLE IF NOT EXISTS team_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role VARCHAR(100) DEFAULT 'member' CHECK (role IN ('member', 'lead', 'manager')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(employee_id, team_id)
);

-- Create time_off_requests table (if not exists)
CREATE TABLE IF NOT EXISTS time_off_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('vacation', 'sick_leave', 'personal', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create productivity_scores table (if not exists)
CREATE TABLE IF NOT EXISTS productivity_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  productive_time INTEGER DEFAULT 0, -- in seconds
  unproductive_time INTEGER DEFAULT 0, -- in seconds
  neutral_time INTEGER DEFAULT 0, -- in seconds
  total_time INTEGER DEFAULT 0, -- in seconds
  productivity_score DECIMAL(5,2) DEFAULT 0.00, -- percentage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(employee_id, date)
);

-- Create app_usage_logs table (if not exists)
CREATE TABLE IF NOT EXISTS app_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  app_name VARCHAR(255) NOT NULL,
  window_title VARCHAR(500),
  url TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in seconds
  productivity_type VARCHAR(50) DEFAULT 'neutral' CHECK (productivity_type IN ('productive', 'unproductive', 'neutral', 'unreviewed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create idle_time_logs table (if not exists)
CREATE TABLE IF NOT EXISTS idle_time_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create reports table (if not exists)
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('time_summary', 'productivity', 'employee_performance', 'project_analytics')),
  filters JSONB,
  generated_by UUID REFERENCES employees(id),
  file_path TEXT,
  status VARCHAR(50) DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create or replace update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers if they exist (to avoid conflicts)
DO $$ 
BEGIN
    -- Teams triggers
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_teams_updated_at') THEN
        DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
    END IF;
    
    -- Time off requests triggers
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_time_off_requests_updated_at') THEN
        DROP TRIGGER IF EXISTS update_time_off_requests_updated_at ON time_off_requests;
    END IF;
    
    -- Productivity scores triggers
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_productivity_scores_updated_at') THEN
        DROP TRIGGER IF EXISTS update_productivity_scores_updated_at ON productivity_scores;
    END IF;
    
    -- Reports triggers
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_reports_updated_at') THEN
        DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
    END IF;
END $$;

-- Create triggers for new tables
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_off_requests_updated_at BEFORE UPDATE ON time_off_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productivity_scores_updated_at BEFORE UPDATE ON productivity_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables (safe to run multiple times)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE idle_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Teams policies
    DROP POLICY IF EXISTS "Public read access to teams" ON teams;
    DROP POLICY IF EXISTS "Public write access to teams" ON teams;
    
    -- Team assignments policies
    DROP POLICY IF EXISTS "Public read access to team_assignments" ON team_assignments;
    DROP POLICY IF EXISTS "Public write access to team_assignments" ON team_assignments;
    
    -- Time off requests policies
    DROP POLICY IF EXISTS "Public read access to time_off_requests" ON time_off_requests;
    DROP POLICY IF EXISTS "Public write access to time_off_requests" ON time_off_requests;
    
    -- Productivity scores policies
    DROP POLICY IF EXISTS "Public read access to productivity_scores" ON productivity_scores;
    DROP POLICY IF EXISTS "Public write access to productivity_scores" ON productivity_scores;
    
    -- App usage logs policies
    DROP POLICY IF EXISTS "Public read access to app_usage_logs" ON app_usage_logs;
    DROP POLICY IF EXISTS "Public write access to app_usage_logs" ON app_usage_logs;
    
    -- Idle time logs policies
    DROP POLICY IF EXISTS "Public read access to idle_time_logs" ON idle_time_logs;
    DROP POLICY IF EXISTS "Public write access to idle_time_logs" ON idle_time_logs;
    
    -- Reports policies
    DROP POLICY IF EXISTS "Public read access to reports" ON reports;
    DROP POLICY IF EXISTS "Public write access to reports" ON reports;
END $$;

-- Create policies for new tables
CREATE POLICY "Public read access to teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public write access to teams" ON teams FOR ALL USING (true);

CREATE POLICY "Public read access to team_assignments" ON team_assignments FOR SELECT USING (true);
CREATE POLICY "Public write access to team_assignments" ON team_assignments FOR ALL USING (true);

CREATE POLICY "Public read access to time_off_requests" ON time_off_requests FOR SELECT USING (true);
CREATE POLICY "Public write access to time_off_requests" ON time_off_requests FOR ALL USING (true);

CREATE POLICY "Public read access to productivity_scores" ON productivity_scores FOR SELECT USING (true);
CREATE POLICY "Public write access to productivity_scores" ON productivity_scores FOR ALL USING (true);

CREATE POLICY "Public read access to app_usage_logs" ON app_usage_logs FOR SELECT USING (true);
CREATE POLICY "Public write access to app_usage_logs" ON app_usage_logs FOR ALL USING (true);

CREATE POLICY "Public read access to idle_time_logs" ON idle_time_logs FOR SELECT USING (true);
CREATE POLICY "Public write access to idle_time_logs" ON idle_time_logs FOR ALL USING (true);

CREATE POLICY "Public read access to reports" ON reports FOR SELECT USING (true);
CREATE POLICY "Public write access to reports" ON reports FOR ALL USING (true);

-- Success message
SELECT 'Schema executed successfully! Teams management is now available.' as status; 