import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug logging for environment variables
const appName = process.env.NEXT_PUBLIC_APP_NAME || 'unknown';
console.log(`[${appName}] Supabase configuration:`, {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length || 0,
  keyLength: supabaseAnonKey?.length || 0,
});

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Log the client creation status
if (supabase) {
  console.log(`[${appName}] Supabase client created successfully`);
} else {
  console.error(`[${appName}] Failed to create Supabase client - missing environment variables`);
  console.error(`[${appName}] NEXT_PUBLIC_SUPABASE_URL:`, supabaseUrl ? 'present' : 'missing');
  console.error(`[${appName}] NEXT_PUBLIC_SUPABASE_ANON_KEY:`, supabaseAnonKey ? 'present' : 'missing');
}

// Database Types
export interface Employee {
  id: string;
  email: string;
  name: string;
  status: "pending" | "active" | "inactive";
  activation_token?: string;
  password?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  hourly_rate?: number;
  status: "active" | "inactive" | "completed";
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  name: string;
  project_id: string;
  status: "Pending" | "Completed";
  created_at: string;
  updated_at: string;
}

export interface ProjectAssignment {
  id: string;
  employee_id: string;
  project_id: string;
  created_at: string;
}

export interface TaskAssignment {
  id: string;
  employee_id: string;
  task_id: string;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  employee_id: string;
  project_id: string;
  projects: Project;
  task_id: string;
  tasks: Task;
  started_at: string;
  ended_at?: string;
  duration?: number;
  created_at: string;
  updated_at: string;
}

export interface Screenshot {
  id: string;
  employee_id: string;
  file_path: string;
  time_entry_id?: string;
  captured_at: string;
  has_permission: boolean;
}

export interface Device {
  id: string;
  employee_id: string;
  mac_address: string;
  hostname: string;
  last_seen: string;
  created_at: string;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// Database configuration
export const tables = {
  employees: "employees",
  projects: "projects",
  tasks: "tasks",
  project_assignments: "project_assignments",
  task_assignments: "task_assignments",
  time_entries: "time_entries",
  screenshots: "screenshots",
  devices: "devices",
  admins: "admins",
} as const;
