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
  title?: string;
  team_id?: string;
  shared_settings_id?: string;
  account_id?: string;
  identifier?: string;
  type?: 'personal' | 'office';
  insightful_id?: string;
  deactivated_at?: string;
  invited_at?: string;
  project_ids?: string[];
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamAssignment {
  id: string;
  employee_id: string;
  team_id: string;
  role: "member" | "lead" | "manager";
  created_at: string;
  employee?: Employee;
  team?: Team;
}

export interface TeamProject {
  id: string;
  team_id: string;
  project_id: string;
  created_at: string;
  team?: Team;
  project?: Project;
}

export interface TeamTask {
  id: string;
  team_id: string;
  task_id: string;
  created_at: string;
  team?: Team;
  task?: Task;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  hourly_rate?: number;
  status: "active" | "inactive" | "completed";
  team_id?: string;
  created_at: string;
  updated_at: string;
  team?: Team;
}

export interface Task {
  id: string;
  name: string;
  project_id: string;
  team_id?: string;
  status: "Pending" | "Completed";
  created_at: string;
  updated_at: string;
  project?: Project;
  team?: Team;
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
  updated_at: string;
  device_info?: any; // Add deviceInfo property for background information
  // Additional fields for device info page (merged from employee data)
  name?: string;
  email?: string;
  deviceInfo?: any; // Alias for device_info for compatibility
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface TimeOffRequest {
  id: string;
  employee_id: string;
  type: "vacation" | "sick_leave" | "personal" | "other";
  start_date: string;
  end_date: string;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  approved_by?: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface ProductivityScore {
  id: string;
  employee_id: string;
  date: string;
  productive_time: number;
  unproductive_time: number;
  neutral_time: number;
  total_time: number;
  productivity_score: number;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface AppUsageLog {
  id: string;
  employee_id: string;
  app_name: string;
  window_title?: string;
  url?: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  productivity_type: "productive" | "unproductive" | "neutral" | "unreviewed";
  created_at: string;
  employee?: Employee;
}

export interface IdleTimeLog {
  id: string;
  employee_id: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  created_at: string;
  employee?: Employee;
}

export interface Report {
  id: string;
  name: string;
  type: "time_summary" | "productivity" | "employee_performance" | "project_analytics";
  filters?: any;
  generated_by?: string;
  file_path?: string;
  status: "generating" | "completed" | "failed";
  created_at: string;
  completed_at?: string;
  employee?: Employee;
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
