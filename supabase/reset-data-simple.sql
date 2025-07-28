-- Simple Database Reset Script - Keep Schema, Clear All Data
-- This script will delete all data from tables while preserving the structure

-- Clear all data from tables (in reverse dependency order to avoid foreign key issues)

-- Clear reports table
TRUNCATE TABLE reports RESTART IDENTITY CASCADE;

-- Clear productivity_scores table
TRUNCATE TABLE productivity_scores RESTART IDENTITY CASCADE;

-- Clear app_usage_logs table
TRUNCATE TABLE app_usage_logs RESTART IDENTITY CASCADE;

-- Clear idle_time_logs table
TRUNCATE TABLE idle_time_logs RESTART IDENTITY CASCADE;

-- Clear time_off_requests table
TRUNCATE TABLE time_off_requests RESTART IDENTITY CASCADE;

-- Clear team_assignments table
TRUNCATE TABLE team_assignments RESTART IDENTITY CASCADE;

-- Clear teams table
TRUNCATE TABLE teams RESTART IDENTITY CASCADE;

-- Clear screenshots table
TRUNCATE TABLE screenshots RESTART IDENTITY CASCADE;

-- Clear time_entries table
TRUNCATE TABLE time_entries RESTART IDENTITY CASCADE;

-- Clear task_assignments table
TRUNCATE TABLE task_assignments RESTART IDENTITY CASCADE;

-- Clear project_assignments table
TRUNCATE TABLE project_assignments RESTART IDENTITY CASCADE;

-- Clear tasks table
TRUNCATE TABLE tasks RESTART IDENTITY CASCADE;

-- Clear projects table
TRUNCATE TABLE projects RESTART IDENTITY CASCADE;

-- Clear devices table
TRUNCATE TABLE devices RESTART IDENTITY CASCADE;

-- Clear employees table (but keep admin users)
DELETE FROM employees WHERE status != 'admin';

-- Clear admins table (optional - uncomment if you want to clear admins too)
-- DELETE FROM admins;

-- Success message
SELECT 'Database reset completed successfully! All data cleared while preserving schema.' as status; 