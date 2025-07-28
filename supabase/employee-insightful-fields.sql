-- Add missing Insightful API fields to employees table
-- These fields are required to fully support the Insightful API contract

-- Add job title field
ALTER TABLE employees ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- Add team assignment (using team_id for primary team)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Add shared settings ID (for Insightful settings)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS shared_settings_id VARCHAR(255);

-- Add account ID (Insightful account reference)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS account_id VARCHAR(255);

-- Add identifier field (unique employee identifier in Insightful)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS identifier VARCHAR(255);

-- Add type field (personal/office)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'personal' CHECK (type IN ('personal', 'office'));

-- Add deactivated timestamp
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE;

-- Add invited timestamp
ALTER TABLE employees ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_team_id ON employees(team_id);
CREATE INDEX IF NOT EXISTS idx_employees_shared_settings_id ON employees(shared_settings_id);
CREATE INDEX IF NOT EXISTS idx_employees_account_id ON employees(account_id);
CREATE INDEX IF NOT EXISTS idx_employees_identifier ON employees(identifier);
CREATE INDEX IF NOT EXISTS idx_employees_type ON employees(type);
CREATE INDEX IF NOT EXISTS idx_employees_deactivated_at ON employees(deactivated_at);

-- Create a view that combines employee data with team and project assignments
CREATE OR REPLACE VIEW employee_insightful_view AS
SELECT 
  e.id,
  e.email,
  e.name,
  e.title,
  e.status,
  e.team_id,
  e.shared_settings_id,
  e.account_id,
  e.identifier,
  e.type,
  e.insightful_id,
  e.deactivated_at,
  e.invited_at,
  e.created_at,
  e.updated_at,
  t.name as team_name,
  COALESCE(e.project_ids, ARRAY[]::UUID[]) as project_ids,
  CASE 
    WHEN e.status = 'inactive' THEN EXTRACT(EPOCH FROM e.deactivated_at) * 1000
    ELSE NULL
  END as deactivated,
  CASE 
    WHEN e.status = 'pending' THEN EXTRACT(EPOCH FROM e.invited_at) * 1000
    ELSE NULL
  END as invited
FROM employees e
LEFT JOIN teams t ON e.team_id = t.id;

-- Update existing inactive employees to set deactivated_at
UPDATE employees 
SET deactivated_at = updated_at 
WHERE status = 'inactive' AND deactivated_at IS NULL;

-- Update existing pending employees to set invited_at
UPDATE employees 
SET invited_at = created_at 
WHERE status = 'pending' AND invited_at IS NULL;

-- Success message
SELECT 'Employee Insightful fields added successfully!' as status; 