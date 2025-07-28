import { NextRequest, NextResponse } from "next/server";
import { InsightfulClient } from "@time-tracker/api";

export async function POST(request: NextRequest) {
  try {
    const { apiToken } = await request.json();
    
    if (!apiToken) {
      return NextResponse.json(
        { error: "API token is required" },
        { status: 400 }
      );
    }

    // Create a temporary client with the provided token
    const client = new InsightfulClient(apiToken);
    
    // Test the connection by fetching employees
    try {
      const employees = await client.getEmployees();
      
      return NextResponse.json({
        success: true,
        message: "Connection successful",
        employeeCount: employees.length,
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        return NextResponse.json(
          { error: "Invalid API token" },
          { status: 401 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Connection test error:", error);
    return NextResponse.json(
      { error: error.message || "Connection test failed" },
      { status: 500 }
    );
  }
} 