import { NextRequest, NextResponse } from "next/server";
import { database } from "@time-tracker/api";

// GET /api/v1/task - Get all tasks (optionally filtered by project) (Insightful API format)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    
    const { data, error } = await database.getTasks(projectId || undefined);
    
    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to fetch tasks" },
        { status: 500 }
      );
    }

    // Transform to Insightful format
    const insightfulTasks = data?.map(task => ({
      id: task.id,
      name: task.name,
      projectId: task.project_id,
      description: task.description,
      billable: true, // Default to billable
      status: task.status || "Pending",
      priority: "normal", // Default priority
      employees: [], // Will be populated from task assignments
      teams: [],
      organizationId: process.env.ORGANIZATION_ID || "default",
      createdAt: new Date(task.created_at).getTime(),
    })) || [];

    return NextResponse.json(insightfulTasks);
  } catch (error: any) {
    console.error("Task fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/v1/task - Create new task (Insightful API format)
export async function POST(request: NextRequest) {
  try {
    const { name, projectId, description, billable, employees, status, priority } = await request.json();
    
    if (!name || !projectId) {
      return NextResponse.json(
        { error: "Task name and project ID are required" },
        { status: 400 }
      );
    }

    const { data, error } = await database.createTask({
      name,
      project_id: projectId,
      status: status || "Pending",
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to create task" },
        { status: 500 }
      );
    }

    // Transform to Insightful format
    const insightfulTask = {
      id: data[0].id,
      name: data[0].name,
      projectId: data[0].project_id,
      description: description || "",
      billable: billable !== false, // Default to true
      status: data[0].status,
      priority: priority || "normal",
      employees: employees || [],
      teams: [],
      organizationId: process.env.ORGANIZATION_ID || "default",
      createdAt: new Date(data[0].created_at).getTime(),
    };

    return NextResponse.json(insightfulTask, { status: 201 });
  } catch (error: any) {
    console.error("Task creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create task" },
      { status: 500 }
    );
  }
} 