import { NextRequest, NextResponse } from "next/server";
import { getInsightfulClient } from "@time-tracker/api";

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();
    
    if (!process.env.INSIGHTFUL_API_TOKEN) {
      return NextResponse.json(
        { error: "Insightful API token not configured" },
        { status: 500 }
      );
    }

    const client = getInsightfulClient();
    let result;

    switch (action) {
      case "start":
        // Start time tracking
        result = await client.startTimeEntry({
          employeeId: data.employeeId,
          projectId: data.projectId,
          taskId: data.taskId,
        });
        break;
        
      case "stop":
        // Stop time tracking
        result = await client.stopTimeEntry(data.timeEntryId);
        break;
        
      case "manual":
        // Create manual time entry
        result = await client.createManualTimeEntry({
          employeeId: data.employeeId,
          projectId: data.projectId,
          taskId: data.taskId,
          start: data.start,
          end: data.end,
          timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        break;
        
      case "fetch":
        // Fetch time entries
        result = await client.getTimeEntries(data.params);
        break;
        
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Time tracking error:", error);
    return NextResponse.json(
      { error: error.message || "Time tracking operation failed" },
      { status: 500 }
    );
  }
} 