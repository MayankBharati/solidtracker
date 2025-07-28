import { NextRequest, NextResponse } from "next/server";
import { database } from "@time-tracker/api";

// GET /api/v1/screenshot - Get all screenshots (Insightful API format)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const limit = searchParams.get("limit");
    const employeeId = searchParams.get("employeeId");
    const teamId = searchParams.get("teamId");
    const projectId = searchParams.get("projectId");
    
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
    const limitedScreenshots = limit 
      ? filteredScreenshots.slice(0, parseInt(limit))
      : filteredScreenshots;

    // Transform to Insightful format
    const insightfulScreenshots = limitedScreenshots.map(screenshot => ({
      id: screenshot.id,
      employeeId: screenshot.employee_id,
      site: "desktop", // Default site
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
    }));

    return NextResponse.json(insightfulScreenshots);
  } catch (error: any) {
    console.error("Screenshot fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch screenshots" },
      { status: 500 }
    );
  }
}

// POST /api/v1/screenshot - Upload screenshot (Insightful API format)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const employeeId = formData.get("employeeId") as string;
    const screenshot = formData.get("screenshot") as File;
    const metadata = formData.get("metadata") as string;
    
    if (!employeeId || !screenshot) {
      return NextResponse.json(
        { error: "Employee ID and screenshot are required" },
        { status: 400 }
      );
    }

    // Save screenshot to file system (simplified)
    const fileName = `screenshot-${Date.now()}.png`;
    const filePath = `/screenshots/${fileName}`;

    const { data, error } = await database.createScreenshot({
      employee_id: employeeId,
      file_path: filePath,
      has_permission: true, // Default to true
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to create screenshot" },
        { status: 500 }
      );
    }

    // Transform to Insightful format
    const insightfulScreenshot = {
      id: data[0].id,
      employeeId: data[0].employee_id,
      site: "desktop",
      productivity: 1,
      appId: "unknown",
      appOrgId: "unknown",
      appTeamId: "unknown",
      teamId: "default",
      organizationId: process.env.ORGANIZATION_ID || "default",
      timestampTranslated: new Date(data[0].captured_at).getTime(),
      systemPermissions: {
        accessibility: "authorized",
        screenAndSystemAudioRecording: "authorized",
      },
    };

    return NextResponse.json(insightfulScreenshot, { status: 201 });
  } catch (error: any) {
    console.error("Screenshot creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create screenshot" },
      { status: 500 }
    );
  }
} 