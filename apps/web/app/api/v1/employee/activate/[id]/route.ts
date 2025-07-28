import { NextRequest, NextResponse } from "next/server";
import { database } from "@time-tracker/api";

// GET /api/v1/employee/activate/[id] - Activate employee (Insightful API format)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Update employee status to active
    const { data, error } = await database.updateEmployee(id, {
      status: 'active'
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to activate employee" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Transform to Insightful format
    const insightfulEmployee = {
      id: data[0].id,
      name: data[0].name,
      organizationId: process.env.ORGANIZATION_ID || "default",
      projects: [],
      deactivated: undefined, // Clear deactivation timestamp
      createdAt: new Date(data[0].created_at).getTime(),
      type: "personal",
    };

    return NextResponse.json(insightfulEmployee);
  } catch (error: any) {
    console.error("Employee activation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to activate employee" },
      { status: 500 }
    );
  }
} 