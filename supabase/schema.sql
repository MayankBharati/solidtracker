-- Create employees table
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

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  hourly_rate DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create project_assignments table
CREATE TABLE IF NOT EXISTS project_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(employee_id, project_id)
);

-- Create task_assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(employee_id, task_id)
);

-- Create time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create screenshots table
CREATE TABLE IF NOT EXISTS screenshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE SET NULL,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  has_permission BOOLEAN DEFAULT true
);

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  mac_address VARCHAR(255) NOT NULL,
  hostname VARCHAR(255) NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(employee_id, mac_address)
);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create updated_at trigger function
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

-- Create triggers for updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for screenshots if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('screenshots', 'screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for screenshots (simple open access)
DROP POLICY IF EXISTS "Authenticated users can upload screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow all access to screenshots" ON storage.objects;

CREATE POLICY "Allow all access to screenshots" ON storage.objects FOR ALL USING (bucket_id = 'screenshots');

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access to employees" ON employees;
DROP POLICY IF EXISTS "Public write access to employees" ON employees;
DROP POLICY IF EXISTS "Public read access to projects" ON projects;
DROP POLICY IF EXISTS "Public write access to projects" ON projects;
DROP POLICY IF EXISTS "Public read access to tasks" ON tasks;
DROP POLICY IF EXISTS "Public write access to tasks" ON tasks;
DROP POLICY IF EXISTS "Public read access to project_assignments" ON project_assignments;
DROP POLICY IF EXISTS "Public write access to project_assignments" ON project_assignments;
DROP POLICY IF EXISTS "Public read access to task_assignments" ON task_assignments;
DROP POLICY IF EXISTS "Public write access to task_assignments" ON task_assignments;
DROP POLICY IF EXISTS "Public read access to time_entries" ON time_entries;
DROP POLICY IF EXISTS "Public write access to time_entries" ON time_entries;
DROP POLICY IF EXISTS "Public read access to screenshots" ON screenshots;
DROP POLICY IF EXISTS "Public write access to screenshots" ON screenshots;
DROP POLICY IF EXISTS "Public read access to devices" ON devices;
DROP POLICY IF EXISTS "Public write access to devices" ON devices;
DROP POLICY IF EXISTS "Public read access to admins" ON admins;
DROP POLICY IF EXISTS "Public write access to admins" ON admins;

-- Create permissive policies for development (allows both authenticated users and anon access)
-- In production, these should be more restrictive

-- Employees table policies
CREATE POLICY "Public read access to employees" ON employees FOR SELECT USING (true);
CREATE POLICY "Public write access to employees" ON employees FOR ALL USING (true);

-- Projects table policies
CREATE POLICY "Public read access to projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Public write access to projects" ON projects FOR ALL USING (true);

-- Tasks table policies
CREATE POLICY "Public read access to tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Public write access to tasks" ON tasks FOR ALL USING (true);

-- Project assignments table policies
CREATE POLICY "Public read access to project_assignments" ON project_assignments FOR SELECT USING (true);
CREATE POLICY "Public write access to project_assignments" ON project_assignments FOR ALL USING (true);

-- Task assignments table policies
CREATE POLICY "Public read access to task_assignments" ON task_assignments FOR SELECT USING (true);
CREATE POLICY "Public write access to task_assignments" ON task_assignments FOR ALL USING (true);

-- Time entries table policies
CREATE POLICY "Public read access to time_entries" ON time_entries FOR SELECT USING (true);
CREATE POLICY "Public write access to time_entries" ON time_entries FOR ALL USING (true);

-- Screenshots table policies
CREATE POLICY "Public read access to screenshots" ON screenshots FOR SELECT USING (true);
CREATE POLICY "Public write access to screenshots" ON screenshots FOR ALL USING (true);

-- Devices table policies
CREATE POLICY "Public read access to devices" ON devices FOR SELECT USING (true);
CREATE POLICY "Public write access to devices" ON devices FOR ALL USING (true);

-- Admins table policies
CREATE POLICY "Public read access to admins" ON admins FOR SELECT USING (true);
CREATE POLICY "Public write access to admins" ON admins FOR ALL USING (true);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  organization_id UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create team_assignments table
CREATE TABLE IF NOT EXISTS team_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role VARCHAR(100) DEFAULT 'member' CHECK (role IN ('member', 'lead', 'manager')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(employee_id, team_id)
);

-- Create time_off_requests table
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

-- Create productivity_scores table
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

-- Create app_usage_logs table
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

-- Create idle_time_logs table
CREATE TABLE IF NOT EXISTS idle_time_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create reports table
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

-- Add triggers for new tables
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_off_requests_updated_at BEFORE UPDATE ON time_off_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productivity_scores_updated_at BEFORE UPDATE ON productivity_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE idle_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

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
