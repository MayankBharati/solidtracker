-- Add Insightful integration columns to existing tables

-- Add insightful_id to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS insightful_id VARCHAR(255) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_employees_insightful_id ON employees(insightful_id);

-- Add insightful_id to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS insightful_id VARCHAR(255) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_projects_insightful_id ON projects(insightful_id);

-- Add insightful_id and is_default to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS insightful_id VARCHAR(255) UNIQUE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_tasks_insightful_id ON tasks(insightful_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_default ON tasks(project_id, is_default);

-- Add synced_to_insightful to time_entries table
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS synced_to_insightful BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_time_entries_synced ON time_entries(synced_to_insightful);

-- Add synced_to_insightful to screenshots table
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS synced_to_insightful BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_screenshots_synced ON screenshots(synced_to_insightful);

-- Add project_ids array to employees table for storing assigned projects
ALTER TABLE employees ADD COLUMN IF NOT EXISTS project_ids UUID[] DEFAULT '{}';

-- Create a sync log table to track sync operations
CREATE TABLE IF NOT EXISTS insightful_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL, -- 'employee', 'project', 'task', 'time_entry', 'screenshot'
  entity_id UUID NOT NULL,
  insightful_id VARCHAR(255),
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'sync'
  status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'pending'
  error_message TEXT,
  request_data JSONB,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for sync log
CREATE INDEX IF NOT EXISTS idx_sync_log_entity ON insightful_sync_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON insightful_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_sync_log_created ON insightful_sync_log(created_at);

-- Create a settings table for Insightful API configuration
CREATE TABLE IF NOT EXISTS insightful_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default settings (API token should be updated)
INSERT INTO insightful_settings (key, value, description) 
VALUES 
  ('api_token', '', 'Insightful API Bearer Token'),
  ('sync_enabled', 'false', 'Enable automatic sync with Insightful'),
  ('sync_interval_minutes', '15', 'Sync interval in minutes'),
  ('organization_id', '', 'Insightful Organization ID')
ON CONFLICT (key) DO NOTHING; 