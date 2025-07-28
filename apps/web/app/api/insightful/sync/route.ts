import { NextRequest, NextResponse } from "next/server";
import { getInsightfulIntegration } from "@time-tracker/api";
import { supabase } from "@time-tracker/db";

export async function POST(request: NextRequest) {
  try {
    const { type, entityId } = await request.json();
    
    const apiToken = process.env.INSIGHTFUL_API_TOKEN || process.env.NEXT_PUBLIC_INSIGHTFUL_API_TOKEN;
    
    if (!apiToken) {
      return NextResponse.json(
        { error: "Insightful API token not configured" },
        { status: 500 }
      );
    }

    console.log("Creating Insightful integration...");
    const integration = getInsightfulIntegration();
    console.log("Integration created successfully");
    
    let result;

    switch (type) {
      case "employee":
        console.log("Syncing employee with ID:", entityId);
        result = await integration.syncEmployeeToInsightful(entityId);
        console.log("Employee sync result:", result);
        break;
      
      case "project":
        result = await integration.syncProjectToInsightful(entityId);
        break;
        
      case "time_entry":
        result = await integration.syncTimeEntryToInsightful(entityId);
        break;
        
      case "screenshot":
        result = await integration.syncScreenshotToInsightful(entityId);
        break;
        
      case "all_employees":
        result = await integration.syncAllEmployees();
        break;
        
      case "all_projects":
        result = await integration.syncAllProjects();
        break;
        
      default:
        return NextResponse.json(
          { error: "Invalid sync type" },
          { status: 400 }
        );
    }

    // Log sync operation
    await supabase.from("insightful_sync_log").insert({
      entity_type: type,
      entity_id: entityId || null,
      insightful_id: result.insightfulId || null,
      action: "sync",
      status: result.error ? "failed" : "success",
      error_message: result.error || null,
      response_data: result,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Sync error:", error);
    console.error("Error stack:", error.stack);
    
    // Log more detailed error information
    if (error.response) {
      console.error("API Response error:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    return NextResponse.json(
      { 
        error: error.message || "Sync failed",
        details: error.response?.data || error.toString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("type");
    const entityId = searchParams.get("id");
    
    let query = supabase
      .from("insightful_sync_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (entityType) {
      query = query.eq("entity_type", entityType);
    }
    
    if (entityId) {
      query = query.eq("entity_id", entityId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch sync logs" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ logs: data });
  } catch (error: any) {
    console.error("Fetch sync logs error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sync logs" },
      { status: 500 }
    );
  }
} 