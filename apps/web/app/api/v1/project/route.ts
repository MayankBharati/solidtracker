import { NextRequest, NextResponse } from "next/server";
import { database } from "@time-tracker/api";

// GET /api/v1/project - Get all projects (Insightful API format)
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await database.getProjects();
    
    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to fetch projects" },
        { status: 500 }
      );
    }

    // Transform to Insightful format
    const insightfulProjects = data?.map(proj => ({
      id: proj.id,
      name: proj.name,
      description: proj.description,
      billable: true, // Default to billable
      archived: proj.status === 'inactive',
      organizationId: process.env.ORGANIZATION_ID || "default",
      employees: [], // Will be populated from project assignments
      teams: [],
      createdAt: new Date(proj.created_at).getTime(),
      screenshotSettings: {
        screenshotEnabled: true,
      },
    })) || [];

    return NextResponse.json(insightfulProjects);
  } catch (error: any) {
    console.error("Project fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/v1/project - Create new project (Insightful API format)
export async function POST(request: NextRequest) {
  try {
    const { name, description, billable, employees, teams, screenshotSettings } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await database.createProject({
      name,
      description,
      hourly_rate: 0, // Default hourly rate
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to create project" },
        { status: 500 }
      );
    }

    // Transform to Insightful format
    const insightfulProject = {
      id: data[0].id,
      name: data[0].name,
      description: data[0].description,
      billable: billable !== false, // Default to true
      archived: false,
      organizationId: process.env.ORGANIZATION_ID || "default",
      employees: employees || [],
      teams: teams || [],
      createdAt: new Date(data[0].created_at).getTime(),
      screenshotSettings: screenshotSettings || {
        screenshotEnabled: true,
      },
    };

    return NextResponse.json(insightfulProject, { status: 201 });
  } catch (error: any) {
    console.error("Project creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create project" },
      { status: 500 }
    );
  }
} 