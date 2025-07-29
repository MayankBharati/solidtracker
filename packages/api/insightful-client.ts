/**
 * Insightful API Client
 * This module provides integration with Insightful's REST API
 * API Documentation: https://app.insightful.io/api/docs
 */

import axios, { AxiosInstance } from 'axios';
import { database } from '@time-tracker/api';
import { supabase } from '@time-tracker/db';

// Types based on Insightful API documentation
export interface InsightfulEmployee {
  id: string;
  name: string;
  email?: string;  // Email field for employee
  teamsId?: string;
  sharedSettingsId?: string;
  accountId?: string;
  identifier?: string;
  type?: string;
  organizationId: string;
  projects?: string[];
  deactivated?: number;
  invited?: number;
  systemPermissions?: IEmployeeSystemPermissions[];
  createdAt: number;
}

export interface IEmployeeSystemPermissions {
  computer: string;
  permissions: ISystemPermissions;
  createdAt: number;
  updatedAt: number;
}

export interface ISystemPermissions {
  accessibility?: 'authorized' | 'denied' | 'undetermined';
  screenAndSystemAudioRecording?: 'authorized' | 'denied' | 'undetermined';
}

export interface InsightfulProject {
  id: string;
  archived: boolean;
  statuses?: string[];
  priorities?: string[];
  billable: boolean;
  payroll?: ProjectPayroll;
  name: string;
  description?: string;
  employees?: string[];
  creatorId?: string;
  organizationId: string;
  teams?: string[];
  createdAt: number;
  screenshotSettings?: ScreenshotSettings;
}

export interface ProjectPayroll {
  [employeeId: string]: Payroll;
}

export interface Payroll {
  billRate: number;
  overtimeBillRate?: number;
}

export interface ScreenshotSettings {
  screenshotEnabled: boolean;
}

export interface InsightfulTask {
  id: string;
  status?: string;
  priority?: string;
  billable: boolean;
  name: string;
  projectId: string;
  employees?: string[];
  description?: string;
  creatorId?: string;
  organizationId: string;
  teams?: string[];
  createdAt: string;
}

export interface InsightfulTimeEntry {
  id: string;
  employeeId: string;
  projectId: string;
  taskId: string;
  start: number;
  end?: number;
  duration?: number;
  timezone?: string;
  timezoneOffset?: number;
  paid?: boolean;
  billable?: boolean;
  overtime?: boolean;
  // Add more fields as needed
}

export interface InsightfulScreenshot {
  id: string;
  site?: string;
  productivity?: number;
  employeeId: string;
  appId?: string;
  appOrgId?: string;
  appTeamId?: string;
  teamId?: string;
  organizationId: string;
  srcEmployeeId?: string;
  srcTeamId?: string;
  timestampTranslated?: string;
  systemPermissions?: ISystemPermissions;
  next?: string;
}

export interface FilterParams {
  start: number; // Date in milliseconds
  end: number; // Date in milliseconds
  groupBy?: 'day' | 'week' | 'month' | 'employee' | 'team' | 'shift' | 'task' | 'project' | 'window';
  timezone?: string;
  employeeId?: string;
  teamId?: string;
  projectId?: string;
  taskId?: string;
  shiftId?: string;
  appId?: string;
  productivity?: string;
}

export class InsightfulClient {
  private client: AxiosInstance;
  private baseURL = 'https://app.insightful.io/api/v1';

  constructor(bearerToken: string) {
    if (!bearerToken) {
      throw new Error('Insightful API Bearer Token is required');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Maximum 200 requests per minute.');
        }
        throw error;
      }
    );
  }

  // Employee API
  async getEmployees() {
    const response = await this.client.get<InsightfulEmployee[]>('/employee');
    return response.data;
  }

  async getEmployee(id: string) {
    const response = await this.client.get<InsightfulEmployee>(`/employee/${id}`);
    return response.data;
  }

  async createEmployee(data: {
    name: string;
    email?: string;  // Email might be optional in Insightful API
    teamsId?: string;
    sharedSettingsId?: string;
    projects?: string[];
  }) {
    // Remove email if not provided to avoid validation errors
    const payload: any = { name: data.name };
    if (data.email) payload.email = data.email;
    if (data.teamsId) payload.teamsId = data.teamsId;
    if (data.sharedSettingsId) payload.sharedSettingsId = data.sharedSettingsId;
    if (data.projects) payload.projects = data.projects;
    
    console.log("Final payload for Insightful API:", payload);
    console.log("Request URL:", `${this.baseURL}/employee`);
    
    try {
      const response = await this.client.post<InsightfulEmployee>('/employee', payload);
      console.log("Insightful API response:", response.data);
      return response.data;
    } catch (error: any) {
      console.log("Insightful API error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  async updateEmployee(id: string, data: Partial<InsightfulEmployee>) {
    const response = await this.client.put<InsightfulEmployee>(`/employee/${id}`, data);
    return response.data;
  }

  async deactivateEmployee(id: string) {
    const response = await this.client.get<InsightfulEmployee>(`/employee/deactivate/${id}`);
    return response.data;
  }

  async activateEmployee(id: string) {
    const response = await this.client.get<InsightfulEmployee>(`/employee/activate/${id}`);
    return response.data;
  }

  // Project API
  async getProjects() {
    const response = await this.client.get<InsightfulProject[]>('/project');
    return response.data;
  }

  async getProject(id: string) {
    const response = await this.client.get<InsightfulProject>(`/project/${id}`);
    return response.data;
  }

  async createProject(data: {
    name: string;
    description?: string;
    billable?: boolean;
    employees?: string[];
    teams?: string[];
    screenshotSettings?: ScreenshotSettings;
  }) {
    const response = await this.client.post<InsightfulProject>('/project', data);
    return response.data;
  }

  async updateProject(id: string, data: Partial<InsightfulProject>) {
    const response = await this.client.put<InsightfulProject>(`/project/${id}`, data);
    return response.data;
  }

  async deleteProject(id: string) {
    const response = await this.client.delete(`/project/${id}`);
    return response.data;
  }

  async archiveProject(id: string) {
    const response = await this.client.get(`/project/archive/${id}`);
    return response.data;
  }

  async unarchiveProject(id: string) {
    const response = await this.client.get(`/project/unarchive/${id}`);
    return response.data;
  }

  // Task API
  async getTasks(projectId?: string) {
    const url = projectId ? `/task?projectId=${projectId}` : '/task';
    const response = await this.client.get<InsightfulTask[]>(url);
    return response.data;
  }

  async getTask(id: string) {
    const response = await this.client.get<InsightfulTask>(`/task/${id}`);
    return response.data;
  }

  async createTask(data: {
    name: string;
    projectId: string;
    description?: string;
    billable?: boolean;
    employees?: string[];
    status?: string;
    priority?: string;
  }) {
    const response = await this.client.post<InsightfulTask>('/task', data);
    return response.data;
  }

  async updateTask(id: string, data: Partial<InsightfulTask>) {
    const response = await this.client.put<InsightfulTask>(`/task/${id}`, data);
    return response.data;
  }

  async deleteTask(id: string) {
    const response = await this.client.delete(`/task/${id}`);
    return response.data;
  }

  // Time Tracking API
  async getTimeEntries(params: FilterParams) {
    const response = await this.client.get('/window', { params });
    return response.data;
  }

    async startTimeEntry(data: {
    employeeId: string;
    projectId: string;
    taskId: string;
  }) {
    // Directly call the database function instead of making HTTP requests
    // This avoids server-to-server communication issues in production
    
    const { data: result, error } = await database.startTimeEntry(
      data.employeeId, 
      data.projectId, 
      data.taskId
    );

    if (error) {
      throw new Error(error.message || "Failed to start time entry");
    }

    if (!result) {
      throw new Error("No data returned from time entry creation");
    }

    // Transform to Insightful format
    const insightfulWindow = {
      id: result.id,
      employeeId: result.employee_id,
      projectId: result.project_id,
      taskId: result.task_id,
      start: new Date(result.started_at).getTime(),
      end: result.ended_at ? new Date(result.ended_at).getTime() : undefined,
      duration: result.duration || 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset() * 60000,
      paid: true,
      billable: true,
      overtime: false,
      type: "manual",
      name: "Unknown",
      user: "unknown@company.com",
      domain: "company.com",
      computer: "unknown",
      hwid: "unknown",
      os: "unknown",
      osVersion: "unknown",
      teamId: "default",
      organizationId: "default",
      startTranslated: new Date(result.started_at).getTime(),
    };

    return { success: true, data: insightfulWindow };
  }

    async stopTimeEntry(id: string) {
    // Directly call the database function instead of making HTTP requests
    
    // Get the existing time entry to calculate duration
    const { data: existingEntry, error: fetchError } = await supabase
      .from("time_entries")
      .select("*")
      .eq("id", id)
      .single();
    
    if (fetchError || !existingEntry) {
      throw new Error("Time entry not found");
    }

    const startTime = new Date(existingEntry.started_at);
    const endTime = new Date();
    const durationInSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    const { data, error } = await database.updateTimeEntry(id, {
      ended_at: endTime.toISOString(),
      duration: durationInSeconds,
    });

    if (error) {
      throw new Error(error.message || "Failed to update time entry");
    }

    if (!data || data.length === 0) {
      throw new Error("No data returned from time entry update");
    }

    // Transform to Insightful format
    const insightfulWindow = {
      id: data[0].id,
      employeeId: data[0].employee_id,
      projectId: data[0].project_id,
      taskId: data[0].task_id,
      start: new Date(data[0].started_at).getTime(),
      end: new Date(data[0].ended_at).getTime(),
      duration: data[0].duration || 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset() * 60000,
      paid: true,
      billable: true,
      overtime: false,
      type: "manual",
      name: "Unknown",
      user: "unknown@company.com",
      domain: "company.com",
      computer: "unknown",
      hwid: "unknown",
      os: "unknown",
      osVersion: "unknown",
      teamId: "default",
      organizationId: "default",
      startTranslated: new Date(data[0].started_at).getTime(),
      endTranslated: new Date(data[0].ended_at).getTime(),
    };

    return { success: true, data: insightfulWindow };
  }

    async createManualTimeEntry(data: {
    employeeId: string;
    projectId: string;
    taskId: string;
    start: number;
    end: number;
    timezone?: string;
  }) {
    // Directly call the database function instead of making HTTP requests
    
    // Calculate duration
    const startTime = new Date(data.start);
    const endTime = new Date(data.end);
    const durationInSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Create the time entry first
    const { data: createResult, error: createError } = await database.createTimeEntry({
      employee_id: data.employeeId,
      project_id: data.projectId,
      task_id: data.taskId,
      started_at: startTime.toISOString(),
    });

    if (createError || !createResult || createResult.length === 0) {
      throw new Error(createError?.message || "Failed to create time entry");
    }

    // Update with end time and duration
    const { data: updateResult, error: updateError } = await database.updateTimeEntry(createResult[0].id, {
      ended_at: endTime.toISOString(),
      duration: durationInSeconds,
    });

    if (updateError || !updateResult || updateResult.length === 0) {
      throw new Error(updateError?.message || "Failed to update time entry");
    }

    // Transform to Insightful format
    const insightfulWindow = {
      id: updateResult[0].id,
      employeeId: updateResult[0].employee_id,
      projectId: updateResult[0].project_id,
      taskId: updateResult[0].task_id,
      start: new Date(updateResult[0].started_at).getTime(),
      end: new Date(updateResult[0].ended_at).getTime(),
      duration: updateResult[0].duration || 0,
      timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset() * 60000,
      paid: true,
      billable: true,
      overtime: false,
      type: "manual",
      name: "Unknown",
      user: "unknown@company.com",
      domain: "company.com",
      computer: "unknown",
      hwid: "unknown",
      os: "unknown",
      osVersion: "unknown",
      teamId: "default",
      organizationId: "default",
      startTranslated: new Date(updateResult[0].started_at).getTime(),
      endTranslated: new Date(updateResult[0].ended_at).getTime(),
    };

    return { success: true, data: insightfulWindow };
  }

  // Screenshots API
  async getScreenshots(params: FilterParams & { 
    sort?: 'productivity' | 'name' | 'user' | 'app' | 'title' | 'url' | 'shiftId' | 'projectId' | 'taskId' | 'WindowId' | 'appOrgId' | 'appTeamId' | 'employeeId' | 'teamId';
  }) {
    const response = await this.client.get<InsightfulScreenshot[]>('/screenshot', { params });
    return response.data;
  }

  async uploadScreenshot(data: {
    employeeId: string;
    screenshot: Buffer | Blob;
    metadata?: {
      projectId?: string;
      taskId?: string;
      systemPermissions?: ISystemPermissions;
    };
  }) {
    const formData = new FormData();
    formData.append('employeeId', data.employeeId);
    
    // Convert Buffer to Blob if necessary
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data.screenshot)) {
      const blob = new Blob([data.screenshot], { type: 'image/png' });
      formData.append('screenshot', blob, 'screenshot.png');
    } else if (data.screenshot instanceof Blob) {
      formData.append('screenshot', data.screenshot, 'screenshot.png');
    } else {
      // Handle ArrayBuffer or other types
      const blob = new Blob([data.screenshot as any], { type: 'image/png' });
      formData.append('screenshot', blob, 'screenshot.png');
    }
    
    if (data.metadata) {
      formData.append('metadata', JSON.stringify(data.metadata));
    }

    const response = await this.client.post('/screenshot', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteScreenshot(id: string) {
    const response = await this.client.delete(`/screenshot/${id}`);
    return response.data;
  }

  // Helper method to create default task for a project (1:1 mapping as recommended)
  async createDefaultTaskForProject(projectId: string, projectName: string) {
    return this.createTask({
      name: `Default Task - ${projectName}`,
      projectId,
      description: 'Default task for time tracking',
      billable: true,
      status: 'active',
      priority: 'normal',
    });
  }
}

// Export a singleton instance if API token is available
let insightfulClient: InsightfulClient | null = null;

export function initializeInsightfulClient(bearerToken: string): InsightfulClient {
  if (!insightfulClient || !bearerToken) {
    insightfulClient = new InsightfulClient(bearerToken);
  }
  return insightfulClient;
}

export function getInsightfulClient(): InsightfulClient {
  if (!insightfulClient) {
    throw new Error('Insightful client not initialized. Call initializeInsightfulClient first.');
  }
  return insightfulClient;
} 