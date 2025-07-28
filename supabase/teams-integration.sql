-- Teams Integration Enhancement
-- This script adds team-project relationships and team-based filtering

-- Add team_id to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Add team_id to tasks table  
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Create team_projects table for many-to-many relationship (optional, if you want projects to belong to multiple teams)
CREATE TABLE IF NOT EXISTS team_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(team_id, project_id)
);

-- Create team_tasks table for many-to-many relationship (optional, if you want tasks to belong to multiple teams)
CREATE TABLE IF NOT EXISTS team_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(team_id, task_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_team_projects_team_id ON team_projects(team_id);
CREATE INDEX IF NOT EXISTS idx_team_projects_project_id ON team_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_team_tasks_team_id ON team_tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_team_tasks_task_id ON team_tasks(task_id);

-- Enable RLS on new tables
ALTER TABLE team_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "Public read access to team_projects" ON team_projects FOR SELECT USING (true);
CREATE POLICY "Public write access to team_projects" ON team_projects FOR ALL USING (true);
CREATE POLICY "Public read access to team_tasks" ON team_tasks FOR SELECT USING (true);
CREATE POLICY "Public write access to team_tasks" ON team_tasks FOR ALL USING (true);

-- Add triggers for new tables
CREATE TRIGGER update_team_projects_updated_at BEFORE UPDATE ON team_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_tasks_updated_at BEFORE UPDATE ON team_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Teams integration schema updated successfully!' as status; 