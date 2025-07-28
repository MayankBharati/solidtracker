import { NextRequest, NextResponse } from "next/server";
import { database } from "@time-tracker/api";

// GET /api/v1/employee/deactivate/[id] - Deactivate employee (Insightful API format)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // First check if employee exists and their current status
    const { data: existingEmployee, error: fetchError } = await database.getEmployee(id);
    
    if (fetchError || !existingEmployee) {
      return NextResponse.json(
        { 
          type: "NOT_FOUND",
          message: "Not found" 
        },
        { status: 404 }
      );
    }
    
    // Check if already deactivated
    if (existingEmployee.status === 'inactive') {
      return NextResponse.json(
        { message: "Employee is already deactivated" },
        { status: 409 }
      );
    }
    
    // Update employee status to inactive
    const { data, error } = await database.updateEmployee(id, {
      status: 'inactive'
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to deactivate employee" },
        { status: 500 }
      );
    }

    // Transform to Insightful format - return full employee object
    const insightfulEmployee = {
      id: data[0].id,
      name: data[0].name,
      email: data[0].email,
      organizationId: process.env.ORGANIZATION_ID || "default",
      projects: [], // Would be populated from project_assignments
      deactivated: Date.now(), // Set deactivation timestamp
      createdAt: new Date(data[0].created_at).getTime(),
      type: "personal",
      teamsId: undefined, // Would come from team_assignments
      sharedSettingsId: undefined,
      accountId: undefined,
      identifier: data[0].email, // Using email as identifier
    };

    return NextResponse.json(insightfulEmployee);
  } catch (error: any) {
    console.error("Employee deactivation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to deactivate employee" },
      { status: 500 }
    );
  }
} 