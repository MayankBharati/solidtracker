"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "@time-tracker/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@time-tracker/ui";
import { Input } from "@time-tracker/ui";
import { Label } from "@time-tracker/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@time-tracker/ui";
import { database } from "@time-tracker/api";
import { Screenshot, TimeEntry, Employee } from "@time-tracker/db";
import Link from "next/link";
import {
  Monitor,
  ArrowLeft,
  LogOut,
  Filter,
  Calendar,
  Users,
  Activity,
  BarChart3,
  Clock,
  CheckCircle,
  Camera,
  Timer,
  User,
  RefreshCw,
  Eye,
  Play,
  Square,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";

interface CombinedEntry {
  id: string;
  type: 'time_entry' | 'screenshot';
  employee_id: string;
  employee_name: string;
  timestamp: string;
  project_name?: string;
  task_name?: string;
  duration?: number;
  status?: string;
  file_path?: string;
  has_permission?: boolean;
  time_entry_id?: string;
}

export default function MonitoringPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [combinedData, setCombinedData] = useState<CombinedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<'combined' | 'time_entries' | 'screenshots'>('combined');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAndCombineData();
  }, [selectedEmployee, dateFilter, viewMode, employees, timeEntries, screenshots]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load employees first
      const { data: employeesData, error: employeesError } = await database.getEmployees();
      if (employeesData) {
        const activeEmployees = employeesData.filter((emp) => emp.status === "active");
        setEmployees(activeEmployees);
        
        // Load data for each employee since API requires employeeId
        const allTimeEntries: TimeEntry[] = [];
        const allScreenshots: Screenshot[] = [];
        
        for (const employee of activeEmployees) {
          // Load time entries for each employee
          const { data: timeEntriesData } = await database.getTimeEntries(employee.id);
          if (timeEntriesData) {
            allTimeEntries.push(...timeEntriesData);
          }
          
          // Load screenshots for each employee
          const { data: screenshotsData } = await database.getScreenshots(employee.id);
          if (screenshotsData) {
            allScreenshots.push(...screenshotsData);
          }
        }
        
        setTimeEntries(allTimeEntries);
        setScreenshots(allScreenshots);
      }
    } catch (err) {
      console.error("Failed to load monitoring data:", err);
    }
    setLoading(false);
  };

  const filterAndCombineData = () => {
    let filteredTimeEntries = timeEntries;
    let filteredScreenshots = screenshots;

    // Apply employee filter
    if (selectedEmployee) {
      filteredTimeEntries = timeEntries.filter(entry => entry.employee_id === selectedEmployee);
      filteredScreenshots = screenshots.filter(screenshot => screenshot.employee_id === selectedEmployee);
    }

    // Apply date filter
    if (dateFilter) {
      filteredTimeEntries = filteredTimeEntries.filter(entry => {
        const entryDate = new Date(entry.started_at).toISOString().split('T')[0];
        return entryDate === dateFilter;
      });
      
      filteredScreenshots = filteredScreenshots.filter(screenshot => {
        const screenshotDate = new Date(screenshot.captured_at).toISOString().split('T')[0];
        return screenshotDate === dateFilter;
      });
    }

    // Combine and transform data
    const combined: CombinedEntry[] = [];

    // Add time entries
    if (viewMode === 'combined' || viewMode === 'time_entries') {
      filteredTimeEntries.forEach(entry => {
        const employee = employees.find(emp => emp.id === entry.employee_id);
        combined.push({
          id: `time_${entry.id}`,
          type: 'time_entry',
          employee_id: entry.employee_id,
          employee_name: employee?.name || 'Unknown Employee',
          timestamp: entry.started_at,
          project_name: entry.projects?.name,
          task_name: entry.tasks?.name,
          duration: entry.duration,
          status: entry.ended_at ? 'completed' : 'active',
        });
      });
    }

    // Add screenshots
    if (viewMode === 'combined' || viewMode === 'screenshots') {
      filteredScreenshots.forEach(screenshot => {
        const employee = employees.find(emp => emp.id === screenshot.employee_id);
        combined.push({
          id: `screenshot_${screenshot.id}`,
          type: 'screenshot',
          employee_id: screenshot.employee_id,
          employee_name: employee?.name || 'Unknown Employee',
          timestamp: screenshot.captured_at,
          file_path: screenshot.file_path,
          has_permission: screenshot.has_permission,
          time_entry_id: screenshot.time_entry_id,
        });
      });
    }

    // Sort by timestamp (most recent first)
    combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setCombinedData(combined);
  };

  const clearFilters = () => {
    setSelectedEmployee("");
    setDateFilter("");
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return "00:00:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalTimeEntries = timeEntries.length;
  const activeTimeEntries = timeEntries.filter(entry => !entry.ended_at).length;
  const totalScreenshots = screenshots.length;
  const screenshotsWithPermission = screenshots.filter(s => s.has_permission).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Monitor className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Employee Monitoring
                </h1>
                <p className="text-xs text-gray-600">
                  Real-time activity tracking • {combinedData.length} entries
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadData} size="sm" className="hover:bg-blue-50 hover:border-blue-200">
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-200">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Dashboard
                </Button>
              </Link>
              <Button variant="outline" onClick={logout} size="sm" className="hover:bg-red-50 hover:border-red-200">
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Time Entries</p>
                  <div className="text-2xl font-bold text-blue-600">{totalTimeEntries}</div>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Active Sessions</p>
                  <div className="text-2xl font-bold text-green-600">{activeTimeEntries}</div>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Screenshots</p>
                  <div className="text-2xl font-bold text-purple-600">{totalScreenshots}</div>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <Camera className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Active Employees</p>
                  <div className="text-2xl font-bold text-orange-600">{employees.length}</div>
                </div>
                <div className="p-2 bg-orange-100 rounded-full">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and View Mode */}
        <Card className="mb-4">
          <CardContent className="p-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Label htmlFor="employee" className="text-sm font-medium whitespace-nowrap">Employee:</Label>
                <select
                  id="employee"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="px-2 py-1 border border-input bg-background rounded text-sm w-32"
                >
                  <option value="">All</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="date" className="text-sm font-medium whitespace-nowrap">Date:</Label>
                <Input
                  id="date"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-36 h-8 text-sm"
                />
              </div>
              <div className="flex gap-1">
                <Button
                  variant={viewMode === 'combined' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('combined')}
                  className="h-8 px-2 text-xs"
                >
                  Combined
                </Button>
                <Button
                  variant={viewMode === 'time_entries' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('time_entries')}
                  className="h-8 px-2 text-xs"
                >
                  Time
                </Button>
                <Button
                  variant={viewMode === 'screenshots' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('screenshots')}
                  className="h-8 px-2 text-xs"
                >
                  Screenshots
                </Button>
                <Button variant="outline" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs">
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Data Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Activity Monitor ({combinedData.length} entries)</span>
              <div className="text-xs text-gray-500 flex items-center space-x-4">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1 text-blue-600" />
                  Time Entries
                </span>
                <span className="flex items-center">
                  <Camera className="h-3 w-3 mr-1 text-purple-600" />
                  Screenshots
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {combinedData.length === 0 ? (
              <div className="text-center py-8">
                <Monitor className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No activity found for the selected filters</p>
                <p className="text-gray-400 text-sm">Try adjusting your filters or refresh the data</p>
              </div>
            ) : (
              <div className="overflow-auto max-h-[calc(100vh-400px)] border rounded-md">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="py-3">Type</TableHead>
                      <TableHead className="py-3">Employee</TableHead>
                      <TableHead className="py-3">Timestamp</TableHead>
                      <TableHead className="py-3">Project/Task</TableHead>
                      <TableHead className="py-3">Duration/Status</TableHead>
                      <TableHead className="py-3">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combinedData.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-gray-50/50">
                        <TableCell className="py-3">
                          <div className="flex items-center space-x-2">
                            {entry.type === 'time_entry' ? (
                              <>
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-600">Time Entry</span>
                              </>
                            ) : (
                              <>
                                <Camera className="h-4 w-4 text-purple-600" />
                                <span className="text-sm font-medium text-purple-600">Screenshot</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-sm">{entry.employee_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {format(new Date(entry.timestamp), "MMM dd, yyyy")}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(entry.timestamp), "hh:mm:ss a")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          {entry.type === 'time_entry' ? (
                            <div className="space-y-1">
                              {entry.project_name && (
                                <div className="text-sm font-medium text-gray-900">
                                  {entry.project_name}
                                </div>
                              )}
                              {entry.task_name && (
                                <div className="text-xs text-gray-500">
                                  {entry.task_name}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">
                              {entry.time_entry_id ? "With Time Entry" : "General Activity"}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          {entry.type === 'time_entry' ? (
                            <div className="flex items-center space-x-2">
                              {entry.status === 'active' ? (
                                <>
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <span className="text-sm text-green-600 font-medium">Active</span>
                                </>
                              ) : (
                                <>
                                  <Timer className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm font-mono">
                                    {formatDuration(entry.duration)}
                                  </span>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              {entry.has_permission ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-sm text-green-600">Allowed</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                                  <span className="text-sm text-gray-500">Pending</span>
                                </>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          {entry.type === 'screenshot' && entry.file_path ? (
                            <div className="flex items-center space-x-2">
                              <img
                                src={entry.file_path}
                                alt="Screenshot"
                                className="w-16 h-10 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => window.open(entry.file_path, "_blank")}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(entry.file_path, "_blank")}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </div>
                          ) : entry.type === 'time_entry' ? (
                            <div className="text-sm text-gray-500">
                              Time tracking session
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">
                              No preview available
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
