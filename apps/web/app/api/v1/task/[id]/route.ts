import { NextRequest, NextResponse } from "next/server";
import { database } from "@time-tracker/api";

// GET /api/v1/task/[id] - Get specific task (Insightful API format)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await database.getTask(params.id);
    
    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to fetch task" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Transform to Insightful format
    const insightfulTask = {
      id: data.id,
      name: data.name,
      projectId: data.project_id,
      description: data.description || "",
      billable: true, // Default to billable
      status: data.status || "Pending",
      priority: "normal", // Default priority
      employees: [], // Will be populated from task assignments
      teams: [],
      organizationId: process.env.ORGANIZATION_ID || "default",
      createdAt: new Date(data.created_at).getTime(),
    };

    return NextResponse.json(insightfulTask);
  } catch (error: any) {
    console.error("Task fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PUT /api/v1/task/[id] - Update task (Insightful API format)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();
    
    // Transform Insightful format to our database format
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.status) dbUpdates.status = updates.status;
    
    const { data, error } = await database.updateTask(params.id, dbUpdates);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to update task" },
        { status: 500 }
      );
    }

    // Transform back to Insightful format
    const insightfulTask = {
      id: data[0].id,
      name: data[0].name,
      projectId: data[0].project_id,
      description: "",
      billable: true,
      status: data[0].status,
      priority: "normal",
      employees: [],
      teams: [],
      organizationId: process.env.ORGANIZATION_ID || "default",
      createdAt: new Date(data[0].created_at).getTime(),
    };

    return NextResponse.json(insightfulTask);
  } catch (error: any) {
    console.error("Task update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/task/[id] - Delete task (Insightful API format)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await database.deleteTask(params.id);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to delete task" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Task deletion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete task" },
      { status: 500 }
    );
  }
} 