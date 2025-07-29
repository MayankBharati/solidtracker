import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@time-tracker/db";

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Get settings from database
    const { data: settingsData, error } = await supabase
      .from("insightful_settings")
      .select("key, value")
      .in("key", ["api_token", "sync_enabled", "sync_interval_minutes", "organization_id"]);

    if (error) {
      throw error;
    }

    // Transform array of key-value pairs to object
    const settings = {
      apiToken: "",
      syncEnabled: false,
      syncIntervalMinutes: 15,
      organizationId: "",
    };

    settingsData?.forEach((item) => {
      switch (item.key) {
        case "api_token":
          settings.apiToken = item.value;
          break;
        case "sync_enabled":
          settings.syncEnabled = item.value === "true";
          break;
        case "sync_interval_minutes":
          settings.syncIntervalMinutes = parseInt(item.value);
          break;
        case "organization_id":
          settings.organizationId = item.value;
          break;
      }
    });

    // Don't send the actual token to the frontend, just indicate if it's set
    const responseSettings = {
      ...settings,
      apiToken: settings.apiToken ? "••••••••" : "",
      hasApiToken: !!settings.apiToken,
    };

    return NextResponse.json(responseSettings);
  } catch (error: any) {
    console.error("Failed to get settings:", error);
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { apiToken, syncEnabled, syncIntervalMinutes, organizationId } = body;

    // Update settings in database
    const updates = [
      { key: "sync_enabled", value: syncEnabled.toString() },
      { key: "sync_interval_minutes", value: syncIntervalMinutes.toString() },
      { key: "organization_id", value: organizationId },
    ];

    // Only update API token if it's not the masked value
    if (apiToken && apiToken !== "••••••••") {
      updates.push({ key: "api_token", value: apiToken });
    }

    // Upsert settings
    for (const update of updates) {
      const { error } = await supabase
        .from("insightful_settings")
        .upsert(
          {
            key: update.key,
            value: update.value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );

      if (error) {
        throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
} 