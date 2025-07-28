import { supabase } from "@time-tracker/db";
import crypto from "crypto";
import { HmacSHA1 } from "crypto-js";
import { collectAndLogBackgroundInfo, DeviceInfo } from "./background-info";

// Export Insightful API integration
export * from "./insightful-client";
export * from "./insightful-integration";

export const auth = {
  generateActivationToken: (): string => {
    return crypto.randomBytes(32).toString("hex");
  },

  // Supabase handles authentication, but we can add helper methods
  getCurrentUser: async (): Promise<any> => {
    if (!supabase) return null;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },

  signInWithEmail: async (email: string, password: string) => {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signUp: async (email: string, password: string, metadata?: any) => {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { data, error };
  },

  signOut: async () => {
    if (!supabase) return { error: { message: "Supabase not configured" } };
    const { error } = await supabase.auth.signOut();
    return { error };
  },
};

export const response = {
  success: (data: any, message?: string) => {
    return {
      success: true,
      data,
      message,
    };
  },

  error: (message: string, statusCode: number = 400) => {
    return {
      success: false,
      message,
      statusCode,
    };
  },
};

export const utils = {
  calculateDuration: (startTime: Date, endTime: Date): number => {
    return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  },

  formatDuration: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  },

  generateEmployeeId: (): string => {
    return `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
};

// Database helper functions
export const database = {
  // Employees
  async getEmployees() {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async getEmployee(id: string) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();
    return { data, error };
  },

  async createEmployee(employee: {
    email: string;
    name: string;
    activation_token?: string;
    title?: string;
    team_id?: string;
    shared_settings_id?: string;
    type?: 'personal' | 'office';
  }) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("employees")
      .insert([employee])
      .select();
    return { data, error };
  },

  async updateEmployee(id: string, updates: any) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("employees")
      .update(updates)
      .eq("id", id)
      .select();
    return { data, error };
  },

  async deleteEmployee(id: string) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id);
    return { data, error };
  },

  async getEmployeeByActivationToken(token: string) {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("activation_token", token)
      .eq("status", "pending");
    return { data, error };
  },

  async activateEmployee(employeeId: string, password: string) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };

    try {
      // First, get the employee details
      const { data: employee, error: fetchError } = await supabase
        .from("employees")
        .select("*")
        .eq("id", employeeId)
        .single();

      if (fetchError || !employee) {
        return {
          data: null,
          error: fetchError || { message: "Employee not found" },
        };
      }

      // Update employee status to active and clear activation token
      const { data, error } = await this.updateEmployee(employeeId, {
        status: "active",
        updated_at: new Date().toISOString(),
        password: HmacSHA1(password, "salt").toString(),
        activation_token: null,
      });

      return { data, error };
    } catch (err) {
      return { data: null, error: { message: "Failed to activate employee" } };
    }
  },

  async getProjectsByEmployee(employeeId: string) {
    if (!supabase) {
      return { data: [], error: { message: "Supabase not configured" } };
    }

    try {
      const { data, error } = await supabase
        .from("project_assignments")
        .select("*, projects(*)")
        .eq("employee_id", employeeId);

      // We want to return the projects, not the assignments
      const projects = data?.map((assignment) => assignment.projects);

      return { data: projects, error };
    } catch (err) {
      return { data: [], error: { message: "Failed to fetch projects" } };
    }
  },

  async signInWithEmployee(email: string, password: string) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };

    try {
      // First get the employee by email
      const { data: employee, error: fetchError } = await supabase
        .from("employees")
        .select("*")
        .eq("email", email)
        .single();

      if (fetchError || !employee) {
        return { data: null, error: { message: "Invalid email or password" } };
      }

      // Check if employee is active
      if (employee.status !== "active") {
        return { data: null, error: { message: "Account is not active" } };
      }

      // Check password
      const hashedPassword = HmacSHA1(password, "salt").toString();
      if (employee.password !== hashedPassword) {
        return { data: null, error: { message: "Invalid email or password" } };
      }

      return { data: employee, error: null };
    } catch (err) {
      console.error("Sign in error:", err);
      return { data: null, error: { message: "Failed to sign in" } };
    }
  },

  // Projects
  async getProjects() {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async getProject(id: string) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();
    return { data, error };
  },

  async createProject(project: {
    name: string;
    description?: string;
    hourly_rate?: number;
  }) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("projects")
      .insert([project])
      .select();
    return { data, error };
  },

  async updateProject(id: string, updates: any) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select();
    return { data, error };
  },

  async deleteProject(id: string) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);
    return { data, error };
  },

  // Tasks
  async getTasks(projectId?: string) {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };
    let query = supabase
      .from("tasks")
      .select("*, projects(*)")
      .order("created_at", { ascending: false });

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data, error } = await query;
    return { data, error };
  },

  async getTask(id: string) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("tasks")
      .select("*, projects(*)")
      .eq("id", id)
      .single();
    return { data, error };
  },

  async createTask(task: {
    name: string;
    project_id: string;
    status?: "Pending" | "Completed";
  }) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("tasks")
      .insert([task])
      .select();
    return { data, error };
  },

  async updateTask(id: string, updates: any) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select();
    return { data, error };
  },

  async deleteTask(id: string) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase.from("tasks").delete().eq("id", id);
    return { data, error };
  },

  async updateTaskStatus(id: string, status: "Pending" | "Completed") {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("tasks")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select();
    return { data, error };
  },

  // Time Entries
  async getTimeEntries(employeeId?: string) {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };
    let query = supabase
      .from("time_entries")
      .select("*, employees(*), projects(*), tasks(*)")
      .order("started_at", { ascending: false });

    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }

    const { data, error } = await query;
    return { data, error };
  },

  async createTimeEntry(timeEntry: {
    employee_id: string;
    project_id: string;
    task_id: string;
    started_at: string;
  }) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("time_entries")
      .insert([timeEntry])
      .select();
    return { data, error };
  },

  async updateTimeEntry(id: string, updates: any) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("time_entries")
      .update(updates)
      .eq("id", id)
      .select();
    return { data, error };
  },

  // Screenshots
  async getScreenshots(employeeId?: string) {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };

    let query = supabase
      .from("screenshots")
      .select("*, employees(*), time_entries(*)")
      .order("captured_at", { ascending: false });

    // Only filter by employee if provided
    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }

    const { data, error } = await query;

    return { data, error };
  },

  async createScreenshot(screenshot: {
    employee_id: string;
    file_path: string;
    time_entry_id?: string;
    has_permission?: boolean;
  }) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("screenshots")
      .insert([screenshot])
      .select();
    return { data, error };
  },

  // Project Assignments
  async assignEmployeesToProject(projectId: string, employeeIds: string[]) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };

    // First remove existing assignments
    await supabase
      .from("project_assignments")
      .delete()
      .eq("project_id", projectId);

    // Then add new assignments
    const assignments = employeeIds.map((employeeId) => ({
      project_id: projectId,
      employee_id: employeeId,
    }));

    const { data, error } = await supabase
      .from("project_assignments")
      .insert(assignments)
      .select();
    return { data, error };
  },

  async getProjectAssignments(projectId: string) {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("project_assignments")
      .select("*, employees(*)")
      .eq("project_id", projectId);
    return { data, error };
  },

  // Task Assignments
  async assignEmployeesToTask(taskId: string, employeeIds: string[]) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };

    // First remove existing assignments
    await supabase.from("task_assignments").delete().eq("task_id", taskId);

    // Then add new assignments
    const assignments = employeeIds.map((employeeId) => ({
      task_id: taskId,
      employee_id: employeeId,
    }));

    const { data, error } = await supabase
      .from("task_assignments")
      .insert(assignments)
      .select();
    return { data, error };
  },

  async getTaskAssignments(taskId: string) {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("task_assignments")
      .select("*, employees(*)")
      .eq("task_id", taskId);
    return { data, error };
  },

  async getProjectEmployees(projectId: string) {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("project_assignments")
      .select("employee_id, employees(*)")
      .eq("project_id", projectId);
    return { data, error };
  },

  // Task-related functions
  async getTasksByProject(projectId: string) {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    return { data, error };
  },

  async assignTaskToEmployee(taskId: string, employeeId: string) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };

    // Check if assignment already exists
    const { data: existing } = await supabase
      .from("task_assignments")
      .select("*")
      .eq("task_id", taskId)
      .eq("employee_id", employeeId)
      .single();

    if (existing) {
      return { data: existing, error: null };
    }

    // Create new assignment
    const { data, error } = await supabase
      .from("task_assignments")
      .insert([{ task_id: taskId, employee_id: employeeId }])
      .select();

    return { data, error };
  },

  async getProjectTaskAssignments(projectId: string) {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };

    const { data, error } = await supabase
      .from("task_assignments")
      .select("*, employees(*), tasks!inner(*)")
      .eq("tasks.project_id", projectId);

    return { data, error };
  },

  // Employee-specific APIs
  async getEmployeeProjects(employeeId: string) {
    if (!supabase) {
      console.error("Supabase client not configured - check environment variables");
      return { data: [], error: { message: "Supabase not configured" } };
    }

    try {
      console.log("Fetching projects for employee:", employeeId);
      
      // Get projects assigned to the employee through project_assignments
      const { data, error } = await supabase
        .from("project_assignments")
        .select(`
          project_id,
          projects (
            id,
            name,
            description,
            hourly_rate,
            status,
            created_at,
            updated_at
          )
        `)
        .eq("employee_id", employeeId);

      console.log("Raw query result:", { data, error });

      if (error) {
        console.error("Error fetching employee projects:", error);
        return { data: [], error };
      }

      // Extract just the project data
      const projects = data?.map(assignment => assignment.projects).filter(Boolean) || [];
      
      console.log("Processed projects:", projects);
      return { data: projects, error: null };
    } catch (err) {
      console.error("Exception in getEmployeeProjects:", err);
      return { data: [], error: { message: "Failed to fetch projects" } };
    }
  },

  async getEmployeeTasks(employeeId: string) {
    if (!supabase) {
      console.error("Supabase client not configured - check environment variables");
      return { data: [], error: { message: "Supabase not configured" } };
    }

    try {
      console.log("Fetching tasks for employee:", employeeId);
      
      // Get tasks assigned to the employee through task_assignments
      const { data, error } = await supabase
        .from("task_assignments")
        .select(`
          task_id,
          tasks (
            id,
            name,
            project_id,
            status,
            created_at,
            updated_at
          )
        `)
        .eq("employee_id", employeeId);

      console.log("Raw task query result:", { data, error });

      if (error) {
        console.error("Error fetching employee tasks:", error);
        return { data: [], error };
      }

      // Extract just the task data
      const tasks = data?.map(assignment => assignment.tasks).filter(Boolean) || [];
      
      console.log("Processed tasks:", tasks);
      return { data: tasks, error: null };
    } catch (err) {
      console.error("Exception in getEmployeeTasks:", err);
      return { data: [], error: { message: "Failed to fetch tasks" } };
    }
  },

  // Time tracking APIs
  async startTimeEntry(employeeId: string, projectId: string, taskId: string) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };

    try {
      console.log("Starting time entry for:", { employeeId, projectId, taskId });

      // Check if there's already an active time entry
      const { data: activeEntry } = await supabase
        .from("time_entries")
        .select("*")
        .eq("employee_id", employeeId)
        .is("ended_at", null)
        .single();

      if (activeEntry) {
        console.log("Found existing active entry:", activeEntry);
        return {
          data: null,
          error: { message: "Already have an active time entry" },
        };
      }

      // Create new time entry
      const { data, error } = await supabase
        .from("time_entries")
        .insert({
          employee_id: employeeId,
          project_id: projectId,
          task_id: taskId,
          started_at: new Date().toISOString(),
        })
        .select("*, projects(*), tasks(*)")
        .single();

      console.log("Created time entry:", { data, error });
      return { data, error };
    } catch (err) {
      console.error("Exception in startTimeEntry:", err);
      return { data: null, error: { message: "Failed to start time entry" } };
    }
  },

  async stopTimeEntry(employeeId: string) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };

    try {
      console.log("Stopping time entry for employee:", employeeId);

      const now = new Date();
      const { data: activeEntry } = await supabase
        .from("time_entries")
        .select("*")
        .eq("employee_id", employeeId)
        .is("ended_at", null)
        .single();

      if (!activeEntry) {
        console.log("No active entry found for employee:", employeeId);
        return { data: null, error: { message: "No active entry found" } };
      }

      const startedAt = new Date(activeEntry.started_at);
      const durationInSeconds = Math.floor(
        (now.getTime() - startedAt.getTime()) / 1000
      );

      console.log("Updating time entry with duration:", durationInSeconds);

      const { data, error } = await supabase
        .from("time_entries")
        .update({
          ended_at: now.toISOString(),
          duration: durationInSeconds,
        })
        .eq("id", activeEntry.id)
        .select("*, projects(*), tasks(*)")
        .single();

      console.log("Updated time entry:", { data, error });
      return { data, error };
    } catch (err) {
      console.error("Exception in stopTimeEntry:", err);
      return { data: null, error: { message: "Failed to stop time entry" } };
    }
  },

  async getActiveTimeEntry(employeeId: string) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };

    try {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*, projects(*), tasks(*)")
        .eq("employee_id", employeeId)
        .is("ended_at", null)
        .maybeSingle();

      // maybeSingle() returns null when no records found instead of error
      return { data, error };
    } catch (err) {
      console.error("Exception in getActiveTimeEntry:", err);
      return { data: null, error: { message: "Failed to get active time entry" } };
    }
  },

  async getTodayTimeEntries(employeeId: string) {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };

    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).toISOString();
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59
    ).toISOString();

    const { data, error } = await supabase
      .from("time_entries")
      .select("*, projects(*), tasks(*)")
      .eq("employee_id", employeeId)
      .gte("started_at", startOfDay)
      .lte("started_at", endOfDay)
      .order("started_at", { ascending: false });

    return { data, error };
  },

  // Teams
  async getTeams() {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("name", { ascending: true });
    return { data, error };
  },

  async createTeam(team: { name: string; description?: string }) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("teams")
      .insert([team])
      .select();
    return { data, error };
  },

  async assignEmployeeToTeam(employeeId: string, teamId: string, role: string = "member") {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("team_assignments")
      .insert([{ employee_id: employeeId, team_id: teamId, role }])
      .select("*, employee:employees(*), team:teams(*)");
    return { data, error };
  },

  async getEmployeeTeams(employeeId: string) {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("team_assignments")
      .select("*, team:teams(*)")
      .eq("employee_id", employeeId);
    return { data, error };
  },

  async getTeamAssignments(teamId: string) {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("team_assignments")
      .select("*, employee:employees(*)")
      .eq("team_id", teamId);
    return { data, error };
  },

  // Team-based project operations
  async getTeamProjects(teamId: string) {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("projects")
      .select("*, team:teams(*)")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async createTeamProject(project: { name: string; description?: string; hourly_rate?: number; team_id: string }) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("projects")
      .insert([project])
      .select("*, team:teams(*)");
    return { data, error };
  },

  async getTeamTasks(teamId: string) {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("tasks")
      .select("*, project:projects(*), team:teams(*)")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async createTeamTask(task: { name: string; project_id: string; team_id: string }) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("tasks")
      .insert([task])
      .select("*, project:projects(*), team:teams(*)");
    return { data, error };
  },

  async getEmployeeTeamProjects(employeeId: string) {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };
    
    // First get team IDs for the employee
    const { data: teamAssignments, error: teamError } = await supabase
      .from("team_assignments")
      .select("team_id")
      .eq("employee_id", employeeId);
    
    if (teamError || !teamAssignments || teamAssignments.length === 0) {
      return { data: [], error: teamError };
    }
    
    const teamIds = teamAssignments.map(ta => ta.team_id);
    
    // Then get projects for those teams
    const { data, error } = await supabase
      .from("projects")
      .select("*, team:teams(*)")
      .in("team_id", teamIds)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async getEmployeeTeamTasks(employeeId: string) {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };
    
    // First get team IDs for the employee
    const { data: teamAssignments, error: teamError } = await supabase
      .from("team_assignments")
      .select("team_id")
      .eq("employee_id", employeeId);
    
    if (teamError || !teamAssignments || teamAssignments.length === 0) {
      return { data: [], error: teamError };
    }
    
    const teamIds = teamAssignments.map(ta => ta.team_id);
    
    // Then get tasks for those teams
    const { data, error } = await supabase
      .from("tasks")
      .select("*, project:projects(*), team:teams(*)")
      .in("team_id", teamIds)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  // Time Off Requests
  async createTimeOffRequest(request: {
    employee_id: string;
    type: string;
    start_date: string;
    end_date: string;
    reason?: string;
  }) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("time_off_requests")
      .insert([request])
      .select("*, employee:employees(*)");
    return { data, error };
  },

  async getTimeOffRequests(employeeId?: string) {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };
    let query = supabase
      .from("time_off_requests")
      .select("*, employee:employees(*)")
      .order("created_at", { ascending: false });

    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }

    const { data, error } = await query;
    return { data, error };
  },

  async updateTimeOffRequest(requestId: string, updates: { status: string; approved_by?: string }) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("time_off_requests")
      .update(updates)
      .eq("id", requestId)
      .select("*, employee:employees(*)");
    return { data, error };
  },

  // Productivity Tracking
  async logAppUsage(log: {
    employee_id: string;
    app_name: string;
    window_title?: string;
    url?: string;
    start_time: string;
    end_time?: string;
    duration?: number;
    productivity_type?: string;
  }) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("app_usage_logs")
      .insert([log])
      .select();
    return { data, error };
  },

  async logIdleTime(log: {
    employee_id: string;
    start_time: string;
    end_time?: string;
    duration?: number;
  }) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("idle_time_logs")
      .insert([log])
      .select();
    return { data, error };
  },

  async updateProductivityScore(score: {
    employee_id: string;
    date: string;
    productive_time: number;
    unproductive_time: number;
    neutral_time: number;
    total_time: number;
    productivity_score: number;
  }) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("productivity_scores")
      .upsert([score], { onConflict: "employee_id,date" })
      .select("*, employee:employees(*)");
    return { data, error };
  },

  async getProductivityScores(employeeId?: string, startDate?: string, endDate?: string) {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };
    let query = supabase
      .from("productivity_scores")
      .select("*, employee:employees(*)")
      .order("date", { ascending: false });

    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }
    if (startDate) {
      query = query.gte("date", startDate);
    }
    if (endDate) {
      query = query.lte("date", endDate);
    }

    const { data, error } = await query;
    return { data, error };
  },

  async getAppUsageLogs(employeeId?: string, startDate?: string, endDate?: string) {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };
    let query = supabase
      .from("app_usage_logs")
      .select("*, employee:employees(*)")
      .order("start_time", { ascending: false });

    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }
    if (startDate) {
      query = query.gte("start_time", startDate);
    }
    if (endDate) {
      query = query.lte("start_time", endDate);
    }

    const { data, error } = await query;
    return { data, error };
  },

  // Reports
  async generateReport(report: {
    name: string;
    type: string;
    filters?: any;
    generated_by: string;
  }) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const { data, error } = await supabase
      .from("reports")
      .insert([report])
      .select();
    return { data, error };
  },

  async getReports(generatedBy?: string) {
    if (!supabase)
      return { data: [], error: { message: "Supabase not configured" } };
    let query = supabase
      .from("reports")
      .select("*, employee:employees(*)")
      .order("created_at", { ascending: false });

    if (generatedBy) {
      query = query.eq("generated_by", generatedBy);
    }

    const { data, error } = await query;
    return { data, error };
  },

  async updateReportStatus(reportId: string, status: string, filePath?: string) {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };
    const updates: any = { status };
    if (status === "completed") {
      updates.completed_at = new Date().toISOString();
    }
    if (filePath) {
      updates.file_path = filePath;
    }

    const { data, error } = await supabase
      .from("reports")
      .update(updates)
      .eq("id", reportId)
      .select("*, employee:employees(*)");
    return { data, error };
  },

  // Productivity Calculation
  async calculateProductivityScore(employeeId: string, date: string) {
    if (!supabase) return { data: null, error: { message: "Supabase not configured" } };

    try {
      // Get all time entries for the employee on the specified date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: timeEntries, error: timeError } = await supabase
        .from("time_entries")
        .select("*")
        .eq("employee_id", employeeId)
        .gte("started_at", startOfDay.toISOString())
        .lte("started_at", endOfDay.toISOString());

      if (timeError) throw timeError;

      // Get app usage logs for the same period
      const { data: appLogs, error: appError } = await supabase
        .from("app_usage_logs")
        .select("*")
        .eq("employee_id", employeeId)
        .gte("start_time", startOfDay.toISOString())
        .lte("start_time", endOfDay.toISOString());

      if (appError) throw appError;

      // Get idle time logs for the same period
      const { data: idleLogs, error: idleError } = await supabase
        .from("idle_time_logs")
        .select("*")
        .eq("employee_id", employeeId)
        .gte("start_time", startOfDay.toISOString())
        .lte("start_time", endOfDay.toISOString());

      if (idleError) throw idleError;

      // Calculate productivity metrics
      let totalWorkTime = 0;
      let productiveTime = 0;
      let unproductiveTime = 0;
      let neutralTime = 0;
      let totalIdleTime = 0;

      // Calculate total work time from time entries
      timeEntries?.forEach(entry => {
        if (entry.ended_at && entry.duration) {
          totalWorkTime += entry.duration;
        }
      });

      // Calculate app usage productivity
      appLogs?.forEach(log => {
        const duration = log.duration || 0;
        switch (log.productivity_type) {
          case 'productive':
            productiveTime += duration;
            break;
          case 'unproductive':
            unproductiveTime += duration;
            break;
          case 'neutral':
          default:
            neutralTime += duration;
            break;
        }
      });

      // Calculate idle time
      idleLogs?.forEach(log => {
        if (log.duration) {
          totalIdleTime += log.duration;
        }
      });

      // Calculate productivity score
      const totalActiveTime = productiveTime + unproductiveTime + neutralTime;
      const productivityScore = totalActiveTime > 0 
        ? Math.round((productiveTime / totalActiveTime) * 100)
        : 0;

      // Update or create productivity score record
      const scoreData = {
        employee_id: employeeId,
        date: date,
        productive_time: productiveTime,
        unproductive_time: unproductiveTime,
        neutral_time: neutralTime,
        total_time: totalWorkTime,
        productivity_score: productivityScore
      };

      const { data, error } = await supabase
        .from("productivity_scores")
        .upsert([scoreData], { onConflict: "employee_id,date" })
        .select("*, employee:employees(*)");

      return { data, error };
    } catch (error) {
      console.error("Error calculating productivity score:", error);
      return { data: null, error: { message: "Failed to calculate productivity score" } };
    }
  },

  async calculateAllProductivityScores(startDate?: string, endDate?: string) {
    if (!supabase) return { data: null, error: { message: "Supabase not configured" } };

    try {
      // Get all active employees
      const { data: employees, error: empError } = await supabase
        .from("employees")
        .select("id")
        .eq("status", "active");

      if (empError) throw empError;

      const results = [];
      const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = endDate || new Date().toISOString().split('T')[0];

      if (!start || !end) {
        return { data: null, error: { message: "Invalid date range" } };
      }

      // Calculate scores for each employee for each day in the range
      for (const employee of employees || []) {
        if (!employee.id) continue; // Skip if no ID
        
        const currentDate = new Date(start);
        const endDateObj = new Date(end);

        while (currentDate <= endDateObj) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const result = await this.calculateProductivityScore(employee.id as string, dateStr);
          if (result.data) {
            results.push(result.data[0]);
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      return { data: results, error: null };
    } catch (error) {
      console.error("Error calculating all productivity scores:", error);
      return { data: null, error: { message: "Failed to calculate productivity scores" } };
    }
  },

  // Generate realistic productivity data from time entries
  async generateProductivityDataFromTimeEntries(employeeId: string, date: string) {
    if (!supabase) return { data: null, error: { message: "Supabase not configured" } };

    try {
      // Get time entries for the employee on the specified date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: timeEntries, error: timeError } = await supabase
        .from("time_entries")
        .select("*")
        .eq("employee_id", employeeId)
        .gte("started_at", startOfDay.toISOString())
        .lte("started_at", endOfDay.toISOString());

      if (timeError) throw timeError;

      if (!timeEntries || timeEntries.length === 0) {
        return { data: null, error: { message: "No time entries found for this date" } };
      }

      // Calculate total work time
      let totalWorkTime = 0;
      timeEntries.forEach(entry => {
        if (entry.ended_at && entry.duration) {
          totalWorkTime += entry.duration;
        }
      });

      if (totalWorkTime === 0) {
        return { data: null, error: { message: "No completed time entries found" } };
      }

      // Generate realistic app usage data based on work time
      const appUsageData = [
        {
          app_name: "Visual Studio Code",
          productivity_type: "productive",
          duration: Math.floor(totalWorkTime * 0.6), // 60% productive
          window_title: "Coding - Project Files"
        },
        {
          app_name: "Google Chrome",
          productivity_type: "neutral",
          duration: Math.floor(totalWorkTime * 0.25), // 25% neutral
          window_title: "Documentation & Research"
        },
        {
          app_name: "Slack",
          productivity_type: "productive",
          duration: Math.floor(totalWorkTime * 0.1), // 10% productive
          window_title: "Team Communication"
        },
        {
          app_name: "Spotify",
          productivity_type: "neutral",
          duration: Math.floor(totalWorkTime * 0.05), // 5% neutral
          window_title: "Background Music"
        }
      ];

      // Insert app usage logs
      for (const appData of appUsageData) {
        if (appData.duration > 0) {
          await this.logAppUsage({
            employee_id: employeeId,
            app_name: appData.app_name,
            window_title: appData.window_title,
            start_time: startOfDay.toISOString(),
            end_time: endOfDay.toISOString(),
            duration: appData.duration,
            productivity_type: appData.productivity_type as any
          });
        }
      }

      // Generate some idle time (10% of work time)
      const idleTime = Math.floor(totalWorkTime * 0.1);
      if (idleTime > 0) {
        await this.logIdleTime({
          employee_id: employeeId,
          start_time: startOfDay.toISOString(),
          end_time: endOfDay.toISOString(),
          duration: idleTime
        });
      }

      // Calculate productivity metrics
      let productiveTime = 0;
      let unproductiveTime = 0;
      let neutralTime = 0;

      appUsageData.forEach(app => {
        switch (app.productivity_type) {
          case 'productive':
            productiveTime += app.duration;
            break;
          case 'unproductive':
            unproductiveTime += app.duration;
            break;
          case 'neutral':
          default:
            neutralTime += app.duration;
            break;
        }
      });

      // Calculate productivity score
      const totalActiveTime = productiveTime + unproductiveTime + neutralTime;
      const productivityScore = totalActiveTime > 0 
        ? Math.round((productiveTime / totalActiveTime) * 100)
        : 0;

      // Update or create productivity score record
      const scoreData = {
        employee_id: employeeId,
        date: date,
        productive_time: productiveTime,
        unproductive_time: unproductiveTime,
        neutral_time: neutralTime,
        total_time: totalWorkTime,
        productivity_score: productivityScore
      };

      const { data, error } = await supabase
        .from("productivity_scores")
        .upsert([scoreData], { onConflict: "employee_id,date" })
        .select("*, employee:employees(*)");

      return { data, error };
    } catch (error) {
      console.error("Error generating productivity data:", error);
      return { data: null, error: { message: "Failed to generate productivity data" } };
    }
  },

  async generateAllProductivityDataFromTimeEntries(startDate?: string, endDate?: string) {
    if (!supabase) return { data: null, error: { message: "Supabase not configured" } };

    try {
      // Get all active employees
      const { data: employees, error: empError } = await supabase
        .from("employees")
        .select("id")
        .eq("status", "active");

      if (empError) throw empError;

      const results = [];
      const start = startDate || new Date().toISOString().split('T')[0];
      const end = endDate || new Date().toISOString().split('T')[0];

      if (!start || !end) {
        return { data: null, error: { message: "Invalid date range" } };
      }

      // Generate data for each employee for each day in the range
      for (const employee of employees || []) {
        if (!employee.id) continue;
        
        const currentDate = new Date(start);
        const endDateObj = new Date(end);

        while (currentDate <= endDateObj) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const result = await this.generateProductivityDataFromTimeEntries(employee.id, dateStr);
          if (result.data) {
            results.push(result.data[0]);
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      return { data: results, error: null };
    } catch (error) {
      console.error("Error generating all productivity data:", error);
      return { data: null, error: { message: "Failed to generate productivity data" } };
    }
  },

  // Background Information Collection
  async collectBackgroundInfo(employeeId: string): Promise<{ data: DeviceInfo | null; error: any }> {
    try {
      const deviceInfo = await collectAndLogBackgroundInfo();
      
      // Store device info in the devices table
      const { data, error } = await supabase
        .from("devices")
        .upsert({
          employee_id: employeeId,
          mac_address: deviceInfo.macAddress,
          hostname: deviceInfo.hostname,
          last_seen: new Date().toISOString(),
          // Store additional info as JSON
          device_info: {
            localIP: deviceInfo.localIP,
            publicIP: deviceInfo.publicIP,
            os: deviceInfo.os,
            platform: deviceInfo.platform,
            arch: deviceInfo.arch,
            nodeVersion: deviceInfo.nodeVersion,
            networkInterfaces: deviceInfo.networkInterfaces,
            userAgent: deviceInfo.userAgent,
            screenResolution: deviceInfo.screenResolution,
            timezone: deviceInfo.timezone,
            collectedAt: deviceInfo.collectedAt
          }
        }, {
          onConflict: 'employee_id,mac_address'
        });

      if (error) {
        console.error("Error storing device info:", error);
        return { data: deviceInfo, error };
      }

      return { data: deviceInfo, error: null };
    } catch (error) {
      console.error("Error collecting background info:", error);
      return { data: null, error: { message: "Failed to collect background information" } };
    }
  },

  async getDeviceInfo(employeeId: string): Promise<{ data: any; error: any }> {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };

    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .eq("employee_id", employeeId)
      .order("last_seen", { ascending: false })
      .limit(1);

    return { data: data?.[0] || null, error };
  },

  async updateDeviceInfo(employeeId: string, deviceInfo: Partial<DeviceInfo>): Promise<{ data: any; error: any }> {
    if (!supabase)
      return { data: null, error: { message: "Supabase not configured" } };

    const { data, error } = await supabase
      .from("devices")
      .upsert({
        employee_id: employeeId,
        mac_address: deviceInfo.macAddress || '00:00:00:00:00:00',
        hostname: deviceInfo.hostname || 'unknown',
        last_seen: new Date().toISOString(),
        device_info: deviceInfo
      }, {
        onConflict: 'employee_id,mac_address'
      });

    return { data, error };
  },
};
