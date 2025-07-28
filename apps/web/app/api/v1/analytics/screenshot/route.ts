import { NextRequest, NextResponse } from "next/server";
import { database } from "@time-tracker/api";

// GET /api/v1/analytics/screenshot - Get screenshots analytics (Insightful API format)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const limit = searchParams.get("limit") || "15"; // Default limit
    const employeeId = searchParams.get("employeeId");
    const teamId = searchParams.get("teamId");
    const projectId = searchParams.get("projectId");
    const taskId = searchParams.get("taskId");
    const sort = searchParams.get("sort");
    
    // Validate required parameters
    if (!start || !end) {
      return NextResponse.json(
        { error: "start and end parameters are required" },
        { status: 400 }
      );
    }
    
    // Convert timestamps to dates
    const startDate = new Date(parseInt(start));
    const endDate = new Date(parseInt(end));
    
    // Get screenshots with optional filters
    const { data, error } = await database.getScreenshots(employeeId || undefined);
    
    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to fetch screenshots" },
        { status: 500 }
      );
    }

    // Filter by date range
    const filteredScreenshots = data?.filter(screenshot => {
      const capturedAt = new Date(screenshot.captured_at).getTime();
      return capturedAt >= startDate.getTime() && capturedAt <= endDate.getTime();
    }) || [];

    // Apply limit if specified
    const limitedScreenshots = filteredScreenshots.slice(0, parseInt(limit));

    // Transform to Insightful format
    const insightfulScreenshots = limitedScreenshots.map(screenshot => ({
      id: screenshot.id,
      employeeId: screenshot.employee_id,
      site: "desktop",
      productivity: 1, // Default productivity (productive)
      appId: "unknown",
      appOrgId: "unknown", 
      appTeamId: "unknown",
      teamId: teamId || "default",
      organizationId: process.env.ORGANIZATION_ID || "default",
      timestampTranslated: new Date(screenshot.captured_at).getTime(),
      systemPermissions: {
        accessibility: "authorized",
        screenAndSystemAudioRecording: "authorized",
      },
      // Optional fields based on filters
      ...(projectId && { projectId }),
      ...(taskId && { taskId }),
    }));

    // Add pagination support
    const response: any = insightfulScreenshots;
    
    // If there are more results, add a next token
    if (filteredScreenshots.length > parseInt(limit)) {
      response.next = Buffer.from(`${endDate.getTime()}`).toString('base64');
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Screenshot analytics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch screenshot analytics" },
      { status: 500 }
    );
  }
} 