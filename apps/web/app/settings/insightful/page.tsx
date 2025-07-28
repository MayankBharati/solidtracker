"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@time-tracker/ui";

export default function InsightfulSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [settings, setSettings] = useState({
    apiToken: "",
    syncEnabled: false,
    syncIntervalMinutes: 15,
    organizationId: "",
  });
  const [syncStatus, setSyncStatus] = useState({
    employees: { synced: 0, failed: 0 },
    projects: { synced: 0, failed: 0 },
    lastSync: null as Date | null,
  });

  useEffect(() => {
    loadSettings();
    loadSyncStatus();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings/insightful");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const response = await fetch("/api/insightful/sync?type=all");
      if (response.ok) {
        const data = await response.json();
        // Process sync logs to get status
        const employeeSync = data.logs.filter((log: any) => log.entity_type === "all_employees")[0];
        const projectSync = data.logs.filter((log: any) => log.entity_type === "all_projects")[0];
        
        setSyncStatus({
          employees: employeeSync?.response_data || { synced: 0, failed: 0 },
          projects: projectSync?.response_data || { synced: 0, failed: 0 },
          lastSync: employeeSync?.created_at ? new Date(employeeSync.created_at) : null,
        });
      }
    } catch (error) {
      console.error("Failed to load sync status:", error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/settings/insightful", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert("Settings saved successfully!");
      } else {
        alert("Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Error saving settings");
    }
    setLoading(false);
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/insightful/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiToken: settings.apiToken }),
      });

      if (response.ok) {
        alert("Connection successful!");
      } else {
        const error = await response.json();
        alert(`Connection failed: ${error.message}`);
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      alert("Connection test failed");
    }
    setLoading(false);
  };

  const syncAllData = async () => {
    setSyncing(true);
    try {
      // Sync employees
      const employeeResponse = await fetch("/api/insightful/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "all_employees" }),
      });

      // Sync projects
      const projectResponse = await fetch("/api/insightful/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "all_projects" }),
      });

      if (employeeResponse.ok && projectResponse.ok) {
        alert("Sync completed successfully!");
        loadSyncStatus();
      } else {
        alert("Sync completed with errors. Check sync logs for details.");
      }
    } catch (error) {
      console.error("Sync failed:", error);
      alert("Sync failed");
    }
    setSyncing(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Insightful API Settings</h1>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              API Bearer Token
            </label>
            <input
              type="password"
              value={settings.apiToken}
              onChange={(e) => setSettings({ ...settings, apiToken: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter your Insightful API token"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your API token from Insightful admin panel → API page
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Organization ID
            </label>
            <input
              type="text"
              value={settings.organizationId}
              onChange={(e) => setSettings({ ...settings, organizationId: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Your Insightful organization ID"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="syncEnabled"
              checked={settings.syncEnabled}
              onChange={(e) => setSettings({ ...settings, syncEnabled: e.target.checked })}
            />
            <label htmlFor="syncEnabled" className="text-sm font-medium">
              Enable automatic sync
            </label>
          </div>

          {settings.syncEnabled && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Sync Interval (minutes)
              </label>
              <input
                type="number"
                value={settings.syncIntervalMinutes}
                onChange={(e) => setSettings({ ...settings, syncIntervalMinutes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
                min="5"
                max="60"
              />
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={saveSettings}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Settings"}
            </button>
            
            <button
              onClick={testConnection}
              disabled={loading || !settings.apiToken}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Test Connection
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Sync Status</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Employees</h3>
              <p className="text-sm text-gray-600">
                Synced: {syncStatus.employees.synced} | Failed: {syncStatus.employees.failed}
              </p>
            </div>
            
            <div>
              <h3 className="font-medium">Projects</h3>
              <p className="text-sm text-gray-600">
                Synced: {syncStatus.projects.synced} | Failed: {syncStatus.projects.failed}
              </p>
            </div>
          </div>
          
          {syncStatus.lastSync && (
            <p className="text-sm text-gray-600">
              Last sync: {syncStatus.lastSync.toLocaleString()}
            </p>
          )}
          
          <button
            onClick={syncAllData}
            disabled={syncing || !settings.apiToken}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync All Data"}
          </button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Integration Guide</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Log in to your Insightful admin account</li>
          <li>Navigate to the API page</li>
          <li>Create a new API token and copy it</li>
          <li>Paste the token in the field above</li>
          <li>Test the connection to verify it works</li>
          <li>Enable automatic sync if desired</li>
          <li>Click "Sync All Data" to perform initial sync</li>
        </ol>
      </Card>
    </div>
  );
} 