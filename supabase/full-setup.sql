-- ============================================
-- FULL SCHEMA SETUP FOR NEW SUPABASE PROJECT
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- ===== 1. CORE TABLES =====

CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  activation_token TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  hourly_rate DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS project_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(employee_id, project_id)
);

CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(employee_id, task_id)
);

CREATE TABLE IF NOT EXISTS time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS screenshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE SET NULL,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  has_permission BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  mac_address VARCHAR(255) NOT NULL,
  hostname VARCHAR(255) NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(employee_id, mac_address)
);

CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ===== 2. TEAMS & EXTENDED TABLES =====

CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  organization_id UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS team_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role VARCHAR(100) DEFAULT 'member' CHECK (role IN ('member', 'lead', 'manager')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(employee_id, team_id)
);

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

CREATE TABLE IF NOT EXISTS productivity_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  productive_time INTEGER DEFAULT 0,
  unproductive_time INTEGER DEFAULT 0,
  neutral_time INTEGER DEFAULT 0,
  total_time INTEGER DEFAULT 0,
  productivity_score DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(employee_id, date)
);

CREATE TABLE IF NOT EXISTS app_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  app_name VARCHAR(255) NOT NULL,
  window_title VARCHAR(500),
  url TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  productivity_type VARCHAR(50) DEFAULT 'neutral' CHECK (productivity_type IN ('productive', 'unproductive', 'neutral', 'unreviewed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS idle_time_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

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

-- ===== 3. TEAMS INTEGRATION (team_id on projects/tasks, junction tables) =====

ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS team_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(team_id, project_id)
);

CREATE TABLE IF NOT EXISTS team_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(team_id, task_id)
);

-- ===== 4. INSIGHTFUL INTEGRATION =====

ALTER TABLE employees ADD COLUMN IF NOT EXISTS insightful_id VARCHAR(255) UNIQUE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS insightful_id VARCHAR(255) UNIQUE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS insightful_id VARCHAR(255) UNIQUE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS synced_to_insightful BOOLEAN DEFAULT false;
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS synced_to_insightful BOOLEAN DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS project_ids UUID[] DEFAULT '{}';

CREATE TABLE IF NOT EXISTS insightful_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  insightful_id VARCHAR(255),
  action VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  error_message TEXT,
  request_data JSONB,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS insightful_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

INSERT INTO insightful_settings (key, value, description)
VALUES
  ('api_token', '', 'Insightful API Bearer Token'),
  ('sync_enabled', 'false', 'Enable automatic sync with Insightful'),
  ('sync_interval_minutes', '15', 'Sync interval in minutes'),
  ('organization_id', '', 'Insightful Organization ID')
ON CONFLICT (key) DO NOTHING;

-- ===== 5. EMPLOYEE INSIGHTFUL FIELDS =====

ALTER TABLE employees ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS shared_settings_id VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS account_id VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS identifier VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'personal' CHECK (type IN ('personal', 'office'));
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE;

-- ===== 6. ALL INDEXES =====

CREATE INDEX IF NOT EXISTS idx_employees_insightful_id ON employees(insightful_id);
CREATE INDEX IF NOT EXISTS idx_projects_insightful_id ON projects(insightful_id);
CREATE INDEX IF NOT EXISTS idx_tasks_insightful_id ON tasks(insightful_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_default ON tasks(project_id, is_default);
CREATE INDEX IF NOT EXISTS idx_time_entries_synced ON time_entries(synced_to_insightful);
CREATE INDEX IF NOT EXISTS idx_screenshots_synced ON screenshots(synced_to_insightful);
CREATE INDEX IF NOT EXISTS idx_sync_log_entity ON insightful_sync_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON insightful_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_sync_log_created ON insightful_sync_log(created_at);
CREATE INDEX IF NOT EXISTS idx_employees_team_id ON employees(team_id);
CREATE INDEX IF NOT EXISTS idx_employees_shared_settings_id ON employees(shared_settings_id);
CREATE INDEX IF NOT EXISTS idx_employees_account_id ON employees(account_id);
CREATE INDEX IF NOT EXISTS idx_employees_identifier ON employees(identifier);
CREATE INDEX IF NOT EXISTS idx_employees_type ON employees(type);
CREATE INDEX IF NOT EXISTS idx_employees_deactivated_at ON employees(deactivated_at);
CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_team_projects_team_id ON team_projects(team_id);
CREATE INDEX IF NOT EXISTS idx_team_projects_project_id ON team_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_team_tasks_team_id ON team_tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_team_tasks_task_id ON team_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_devices_device_info ON devices USING GIN (device_info);

-- ===== 7. TRIGGER FUNCTION =====

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_time_entries_updated_at ON time_entries;
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
DROP TRIGGER IF EXISTS update_time_off_requests_updated_at ON time_off_requests;
DROP TRIGGER IF EXISTS update_productivity_scores_updated_at ON productivity_scores;
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;

-- Create triggers
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_off_requests_updated_at BEFORE UPDATE ON time_off_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productivity_scores_updated_at BEFORE UPDATE ON productivity_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 8. STORAGE BUCKET =====
-- NOTE: Storage bucket must be created via Supabase Dashboard > Storage > New Bucket
-- Create a bucket named "screenshots" and set it to Public

-- ===== 9. ROW LEVEL SECURITY =====

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE idle_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_tasks ENABLE ROW LEVEL SECURITY;

-- ===== 10. RLS POLICIES (permissive for development) =====

-- Drop all existing policies first
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'employees','projects','tasks','project_assignments','task_assignments',
    'time_entries','screenshots','devices','admins','teams','team_assignments',
    'time_off_requests','productivity_scores','app_usage_logs','idle_time_logs',
    'reports','team_projects','team_tasks'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public read access to %s" ON %I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Public write access to %s" ON %I', tbl, tbl);
  END LOOP;
END $$;

-- Create permissive policies for all tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'employees','projects','tasks','project_assignments','task_assignments',
    'time_entries','screenshots','devices','admins','teams','team_assignments',
    'time_off_requests','productivity_scores','app_usage_logs','idle_time_logs',
    'reports','team_projects','team_tasks'
  ]) LOOP
    EXECUTE format('CREATE POLICY "Public read access to %s" ON %I FOR SELECT USING (true)', tbl, tbl);
    EXECUTE format('CREATE POLICY "Public write access to %s" ON %I FOR ALL USING (true)', tbl, tbl);
  END LOOP;
END $$;

-- ===== 11. VIEW =====

CREATE OR REPLACE VIEW employee_insightful_view AS
SELECT
  e.id, e.email, e.name, e.title, e.status, e.team_id,
  e.shared_settings_id, e.account_id, e.identifier, e.type,
  e.insightful_id, e.deactivated_at, e.invited_at,
  e.created_at, e.updated_at,
  t.name as team_name,
  COALESCE(e.project_ids, ARRAY[]::UUID[]) as project_ids,
  CASE WHEN e.status = 'inactive' THEN EXTRACT(EPOCH FROM e.deactivated_at) * 1000 ELSE NULL END as deactivated,
  CASE WHEN e.status = 'pending' THEN EXTRACT(EPOCH FROM e.invited_at) * 1000 ELSE NULL END as invited
FROM employees e
LEFT JOIN teams t ON e.team_id = t.id;

-- ===== 12. SEED: Default admin =====
-- Uncomment and edit the line below to create your admin:
-- INSERT INTO admins (email, name) VALUES ('your-email@example.com', 'Admin Name');

-- ===== DONE =====
SELECT 'Full schema setup completed successfully!' as status;
