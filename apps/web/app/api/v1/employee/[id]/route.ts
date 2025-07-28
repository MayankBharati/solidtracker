import { NextRequest, NextResponse } from "next/server";
import { database } from "@time-tracker/api";

// GET /api/v1/employee/[id] - Get specific employee (Insightful API format)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await database.getEmployee(id);
    
    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to fetch employee" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Transform to Insightful format
    const insightfulEmployee = {
      id: data.id,
      name: data.name,
      organizationId: process.env.ORGANIZATION_ID || "default",
      projects: [], // Will be populated from project assignments
      deactivated: data.status === 'inactive' ? Date.now() : undefined,
      invited: data.status === 'pending' ? Date.now() : undefined,
      createdAt: new Date(data.created_at).getTime(),
      type: "personal",
    };

    return NextResponse.json(insightfulEmployee);
  } catch (error: any) {
    console.error("Employee fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

// PUT /api/v1/employee/[id] - Update employee (Insightful API format)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, email, title, teamId, sharedSettingsId, projects } = await request.json();
    
    // Check if employee exists
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
    
    // Transform Insightful format to our database format
    const dbUpdates: any = {};
    if (name) dbUpdates.name = name;
    if (email) dbUpdates.email = email;
    // Note: title, teamId, sharedSettingsId would be stored in separate tables in a full implementation
    
    const { data, error } = await database.updateEmployee(id, dbUpdates);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to update employee" },
        { status: 500 }
      );
    }

    // Transform back to Insightful format
    const insightfulEmployee = {
      id: data[0].id,
      name: data[0].name,
      email: data[0].email,
      title: title || undefined, // Would come from employee_details table
      teamId: teamId || undefined,
      sharedSettingsId: sharedSettingsId || undefined,
      organizationId: process.env.ORGANIZATION_ID || "default",
      projects: projects || [],
      deactivated: data[0].status === 'inactive' ? Date.now() : undefined,
      invited: data[0].status === 'pending' ? Date.now() : undefined,
      createdAt: new Date(data[0].created_at).getTime(),
      type: "personal",
    };

    return NextResponse.json(insightfulEmployee);
  } catch (error: any) {
    console.error("Employee update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update employee" },
      { status: 500 }
    );
  }
} 