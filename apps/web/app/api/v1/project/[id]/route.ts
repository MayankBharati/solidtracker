import { NextRequest, NextResponse } from "next/server";
import { database } from "@time-tracker/api";

// GET /api/v1/project/[id] - Get specific project (Insightful API format)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await database.getProject(id);
    
    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to fetch project" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { 
          type: "NOT_FOUND",
          message: "Not found" 
        },
        { status: 404 }
      );
    }

    // Transform to Insightful format
    const insightfulProject = {
      id: data.id,
      name: data.name,
      description: data.description,
      billable: true, // Default to billable
      archived: data.status === 'inactive',
      organizationId: process.env.ORGANIZATION_ID || "default",
      employees: [], // Would be populated from project_assignments
      teams: [],
      createdAt: new Date(data.created_at).getTime(),
      screenshotSettings: {
        screenshotEnabled: true,
      },
    };

    return NextResponse.json(insightfulProject);
  } catch (error: any) {
    console.error("Project fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PUT /api/v1/project/[id] - Update project (Insightful API format)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, description, billable, archived, employees } = await request.json();
    
    // Check if project exists
    const { data: existingProject, error: fetchError } = await database.getProject(id);
    
    if (fetchError || !existingProject) {
      return NextResponse.json(
        { 
          type: "NOT_FOUND",
          message: "Not found" 
        },
        { status: 404 }
      );
    }

    // Transform Insightful format to our database format
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (archived !== undefined) updateData.status = archived ? 'inactive' : 'active';

    const { data, error } = await database.updateProject(id, updateData);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to update project" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Project not found after update" },
        { status: 404 }
      );
    }

    // Transform back to Insightful format
    const insightfulProject = {
      id: data[0].id,
      name: data[0].name,
      description: data[0].description,
      billable: billable || true,
      archived: data[0].status === 'inactive',
      organizationId: process.env.ORGANIZATION_ID || "default",
      employees: employees || [],
      teams: [],
      createdAt: new Date(data[0].created_at).getTime(),
      screenshotSettings: {
        screenshotEnabled: true,
      },
    };

    return NextResponse.json(insightfulProject);
  } catch (error: any) {
    console.error("Project update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/project/[id] - Delete project (Insightful API format)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if project exists
    const { data: existingProject, error: fetchError } = await database.getProject(id);
    
    if (fetchError || !existingProject) {
      return NextResponse.json(
        { 
          type: "NOT_FOUND",
          message: "Not found" 
        },
        { status: 404 }
      );
    }

    const { error } = await database.deleteProject(id);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to delete project" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error: any) {
    console.error("Project deletion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete project" },
      { status: 500 }
    );
  }
} 