-- Clear Database Completely - All Data and Schema
-- This script will remove all tables, functions, triggers, and data

-- Drop all tables in the correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS screenshots CASCADE;
DROP TABLE IF EXISTS task_assignments CASCADE;
DROP TABLE IF EXISTS project_assignments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS team_assignments CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS time_off_requests CASCADE;
DROP TABLE IF EXISTS productivity_scores CASCADE;
DROP TABLE IF EXISTS app_usage_logs CASCADE;
DROP TABLE IF EXISTS idle_time_logs CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS team_projects CASCADE;
DROP TABLE IF EXISTS team_tasks CASCADE;

-- Drop any custom functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_teams_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_projects_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_tasks_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_employees_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_time_entries_updated_at() CASCADE;

-- Drop any custom types
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;
DROP TYPE IF EXISTS productivity_type CASCADE;

-- Reset all sequences
-- (These will be recreated when you add the schema back)

-- Clear any remaining objects
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all triggers
    FOR r IN (SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public') LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON ' || quote_ident(r.event_object_table) || ' CASCADE';
    END LOOP;
    
    -- Drop all policies
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- Clear any remaining data in system tables (if any)
-- This is a safety measure to ensure everything is clean

SELECT 'Database cleared successfully. All tables, functions, triggers, and data have been removed.' as status; 