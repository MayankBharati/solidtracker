import { NextRequest, NextResponse } from "next/server";
import { database } from "@time-tracker/api";

// GET /api/v1/window - Get time entries (Insightful API format)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    
    const { data, error } = await database.getTimeEntries(employeeId || undefined);
    
    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to fetch time entries" },
        { status: 500 }
      );
    }

    // Transform to Insightful format (Window = Time Entry)
    const insightfulWindows = data?.map(entry => ({
      id: entry.id,
      employeeId: entry.employee_id,
      projectId: entry.project_id,
      taskId: entry.task_id,
      start: new Date(entry.started_at).getTime(),
      end: entry.ended_at ? new Date(entry.ended_at).getTime() : undefined,
      duration: entry.duration || 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset() * 60000, // Convert to milliseconds
      paid: true, // Default to paid
      billable: true, // Default to billable
      overtime: false, // Default to false
      type: "manual", // Default type
      name: entry.employees?.name || "Unknown",
      user: entry.employees?.email || "unknown@company.com",
      domain: "company.com",
      computer: "unknown",
      hwid: "unknown",
      os: "unknown",
      osVersion: "unknown",
      teamId: "default",
      organizationId: process.env.ORGANIZATION_ID || "default",
      startTranslated: new Date(entry.started_at).getTime(),
      endTranslated: entry.ended_at ? new Date(entry.ended_at).getTime() : undefined,
    })) || [];

    return NextResponse.json(insightfulWindows);
  } catch (error: any) {
    console.error("Time entry fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch time entries" },
      { status: 500 }
    );
  }
}

// POST /api/v1/window - Create time entry (Insightful API format)
export async function POST(request: NextRequest) {
  try {
    const { employeeId, projectId, taskId, start, end, timezone } = await request.json();
    
    if (!employeeId || !projectId || !taskId) {
      return NextResponse.json(
        { error: "Employee ID, project ID, and task ID are required" },
        { status: 400 }
      );
    }

    let data, error;

    // Check if this is a manual entry (has both start and end) or a timer start (only start)
    if (end) {
      // Manual time entry with predefined start and end times
      const startTime = new Date(start || Date.now());
      const endTime = new Date(end);
      const durationInSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      // Create the time entry first
      const createResult = await database.createTimeEntry({
        employee_id: employeeId,
        project_id: projectId,
        task_id: taskId,
        started_at: startTime.toISOString(),
      });
      
      if (createResult.error) {
        data = createResult.data;
        error = createResult.error;
      } else {
        // Update it immediately with end time and duration
        const timeEntryId = createResult.data[0].id;
        const updateResult = await database.updateTimeEntry(timeEntryId, {
          ended_at: endTime.toISOString(),
          duration: durationInSeconds,
        });
        
        data = updateResult.data;
        error = updateResult.error;
      }
    } else {
      // Timer start - use the more robust startTimeEntry function that checks for existing active entries
      const result = await database.startTimeEntry(employeeId, projectId, taskId);
      data = result.data;
      error = result.error;
    }

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to create time entry" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "No data returned from time entry creation" },
        { status: 500 }
      );
    }

    // Handle both array (from updateTimeEntry) and object (from startTimeEntry) responses
    const timeEntry = Array.isArray(data) ? data[0] : data;
    
    if (!timeEntry) {
      return NextResponse.json(
        { error: "No time entry data found" },
        { status: 500 }
      );
    }

    // Transform to Insightful format
    const insightfulWindow = {
      id: timeEntry.id,
      employeeId: timeEntry.employee_id,
      projectId: timeEntry.project_id,
      taskId: timeEntry.task_id,
      start: new Date(timeEntry.started_at).getTime(),
      end: timeEntry.ended_at ? new Date(timeEntry.ended_at).getTime() : undefined,
      duration: timeEntry.duration || 0,
      timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
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
      organizationId: process.env.ORGANIZATION_ID || "default",
      startTranslated: new Date(timeEntry.started_at).getTime(),
      endTranslated: timeEntry.ended_at ? new Date(timeEntry.ended_at).getTime() : undefined,
    };

    return NextResponse.json(insightfulWindow, { status: 201 });
  } catch (error: any) {
    console.error("Time entry creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create time entry" },
      { status: 500 }
    );
  }
} 