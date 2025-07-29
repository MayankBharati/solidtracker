import { NextRequest, NextResponse } from "next/server";
import { database } from "@time-tracker/api";
import { supabase } from "@time-tracker/db";

// PUT /api/v1/window/{id} - Update time entry (stop timer)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Time entry ID is required" },
        { status: 400 }
      );
    }

    const { end } = await request.json();
    
    // Get the existing time entry to calculate duration
    const { data: existingEntry, error: fetchError } = await supabase
      .from("time_entries")
      .select("*")
      .eq("id", id)
      .single();
    
    if (fetchError || !existingEntry) {
      return NextResponse.json(
        { error: "Time entry not found" },
        { status: 404 }
      );
    }

    const startTime = new Date(existingEntry.started_at);
    const endTime = new Date(end || Date.now());
    const durationInSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    const { data, error } = await database.updateTimeEntry(id, {
      ended_at: endTime.toISOString(),
      duration: durationInSeconds,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to update time entry" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Time entry not found" },
        { status: 404 }
      );
    }

    // Transform to Insightful format (data is an array, take first element)
    const timeEntry = data[0];
    const insightfulWindow = {
      id: timeEntry.id,
      employeeId: timeEntry.employee_id,
      projectId: timeEntry.project_id,
      taskId: timeEntry.task_id,
      start: new Date(timeEntry.started_at).getTime(),
      end: timeEntry.ended_at ? new Date(timeEntry.ended_at).getTime() : undefined,
      duration: timeEntry.duration || 0,
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
      organizationId: process.env.ORGANIZATION_ID || "default",
      startTranslated: new Date(timeEntry.started_at).getTime(),
      endTranslated: timeEntry.ended_at ? new Date(timeEntry.ended_at).getTime() : undefined,
    };

    return NextResponse.json(insightfulWindow);
  } catch (error: any) {
    console.error("Time entry update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update time entry" },
      { status: 500 }
    );
  }
}

// GET /api/v1/window/{id} - Get specific time entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { data: timeEntry, error } = await supabase
      .from("time_entries")
      .select("*, employees(*), projects(*), tasks(*)")
      .eq("id", id)
      .single();
    
    if (error || !timeEntry) {
      return NextResponse.json(
        { error: "Time entry not found" },
        { status: 404 }
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
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset() * 60000,
      paid: true,
      billable: true,
      overtime: false,
      type: "manual",
      name: timeEntry.employees?.name || "Unknown",
      user: timeEntry.employees?.email || "unknown@company.com",
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

    return NextResponse.json(insightfulWindow);
  } catch (error: any) {
    console.error("Time entry fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch time entry" },
      { status: 500 }
    );
  }
} 