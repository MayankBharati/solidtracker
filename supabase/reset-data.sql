-- Database Reset Script - Keep Schema, Clear All Data
-- This script will delete all data from tables while preserving the structure

-- Disable foreign key checks temporarily to avoid constraint issues
SET session_replication_role = replica;

-- Clear all data from tables (in reverse dependency order)

-- Clear reports table
DELETE FROM reports;
ALTER SEQUENCE IF EXISTS reports_id_seq RESTART WITH 1;

-- Clear productivity_scores table
DELETE FROM productivity_scores;
ALTER SEQUENCE IF EXISTS productivity_scores_id_seq RESTART WITH 1;

-- Clear app_usage_logs table
DELETE FROM app_usage_logs;
ALTER SEQUENCE IF EXISTS app_usage_logs_id_seq RESTART WITH 1;

-- Clear idle_time_logs table
DELETE FROM idle_time_logs;
ALTER SEQUENCE IF EXISTS idle_time_logs_id_seq RESTART WITH 1;

-- Clear time_off_requests table
DELETE FROM time_off_requests;
ALTER SEQUENCE IF EXISTS time_off_requests_id_seq RESTART WITH 1;

-- Clear team_assignments table
DELETE FROM team_assignments;
ALTER SEQUENCE IF EXISTS team_assignments_id_seq RESTART WITH 1;

-- Clear teams table
DELETE FROM teams;
ALTER SEQUENCE IF EXISTS teams_id_seq RESTART WITH 1;

-- Clear screenshots table
DELETE FROM screenshots;
ALTER SEQUENCE IF EXISTS screenshots_id_seq RESTART WITH 1;

-- Clear time_entries table
DELETE FROM time_entries;
ALTER SEQUENCE IF EXISTS time_entries_id_seq RESTART WITH 1;

-- Clear task_assignments table
DELETE FROM task_assignments;
ALTER SEQUENCE IF EXISTS task_assignments_id_seq RESTART WITH 1;

-- Clear project_assignments table
DELETE FROM project_assignments;
ALTER SEQUENCE IF EXISTS project_assignments_id_seq RESTART WITH 1;

-- Clear tasks table
DELETE FROM tasks;
ALTER SEQUENCE IF EXISTS tasks_id_seq RESTART WITH 1;

-- Clear projects table
DELETE FROM projects;
ALTER SEQUENCE IF EXISTS projects_id_seq RESTART WITH 1;

-- Clear devices table
DELETE FROM devices;
ALTER SEQUENCE IF EXISTS devices_id_seq RESTART WITH 1;

-- Clear employees table (but keep admin)
DELETE FROM employees WHERE status != 'admin';
ALTER SEQUENCE IF EXISTS employees_id_seq RESTART WITH 1;

-- Clear admins table (optional - uncomment if you want to clear admins too)
-- DELETE FROM admins;
-- ALTER SEQUENCE IF EXISTS admins_id_seq RESTART WITH 1;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Reset all sequences to start from 1
-- Note: UUID tables don't need sequence resets, but included for completeness

-- Success message
SELECT 'Database reset completed successfully! All data cleared while preserving schema.' as status;

-- Show table status
SELECT 
    schemaname,
    tablename,
    n_tup_ins as "rows_inserted",
    n_tup_del as "rows_deleted"
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename; 