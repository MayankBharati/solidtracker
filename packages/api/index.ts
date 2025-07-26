import { supabase } from "@time-tracker/db";
import crypto from "crypto";
import { HmacSHA1 } from "crypto-js";

export const auth = {
  generateActivationToken: (): string => {
    return crypto.randomBytes(32).toString("hex");
  },

  // Supabase handles authentication, but we can add helper methods
  getCurrentUser: async () => {
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

  async createEmployee(employee: {
    email: string;
    name: string;
    activation_token?: string;
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

    if (!employeeId) {
      return { data: [], error: { message: "Employee ID is required" } };
    }

    let query = supabase
      .from("screenshots")
      .select("*, employees(*), time_entries(*)")
      .order("captured_at", { ascending: false });

    query = query.eq("employee_id", employeeId);

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
};
