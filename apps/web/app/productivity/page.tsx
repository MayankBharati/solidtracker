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
import { ProductivityScore, Employee, AppUsageLog } from "@time-tracker/db";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  ArrowLeft,
  LogOut,
  Calendar,
  BarChart3,
  Users,
  Monitor,
  Zap,
  Coffee,
  RefreshCw,
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function ProductivityPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [productivityScores, setProductivityScores] = useState<ProductivityScore[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [appUsageLogs, setAppUsageLogs] = useState<AppUsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0], // Today
    end: new Date().toISOString().split('T')[0]    // Today
  });

  useEffect(() => {
    loadData();
  }, [selectedEmployee, dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load employees
      const { data: employeesData } = await database.getEmployees();
      if (employeesData) {
        setEmployees(employeesData.filter(emp => emp.status === "active"));
      }

      // Generate realistic productivity data from time entries
      const employeeFilter = selectedEmployee === "all" ? undefined : selectedEmployee;
      
      if (employeeFilter && dateRange.start && dateRange.end) {
        // Generate for specific employee
        const currentDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        
        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          if (employeeFilter) {
            await database.generateProductivityDataFromTimeEntries(employeeFilter, dateStr);
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else if (dateRange.start && dateRange.end) {
        // Generate for all employees
        await database.generateAllProductivityDataFromTimeEntries(dateRange.start, dateRange.end);
      }

      // Load calculated productivity scores
      const { data: scoresData } = await database.getProductivityScores(
        employeeFilter,
        dateRange.start || '',
        dateRange.end || ''
      );
      if (scoresData) {
        setProductivityScores(scoresData);
      }

      // Load app usage logs
      const { data: appLogsData } = await database.getAppUsageLogs(
        employeeFilter,
        dateRange.start,
        dateRange.end
      );
      if (appLogsData) {
        setAppUsageLogs(appLogsData);
      }
    } catch (error) {
      console.error("Error loading productivity data:", error);
      toast.error("Failed to load productivity data");
    }
    setLoading(false);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getProductivityColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getProductivityIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (score >= 60) return <Activity className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const calculateOverallStats = () => {
    if (productivityScores.length === 0) return null;

    const totalProductive = productivityScores.reduce((sum, score) => sum + score.productive_time, 0);
    const totalUnproductive = productivityScores.reduce((sum, score) => sum + score.unproductive_time, 0);
    const totalNeutral = productivityScores.reduce((sum, score) => sum + score.neutral_time, 0);
    const totalTime = totalProductive + totalUnproductive + totalNeutral;
    const avgProductivity = totalTime > 0 ? (totalProductive / totalTime) * 100 : 0;

    return {
      totalProductive,
      totalUnproductive,
      totalNeutral,
      totalTime,
      avgProductivity: Math.round(avgProductivity)
    };
  };

  const getTopApps = () => {
    const appStats: { [key: string]: { name: string; duration: number; type: string } } = {};
    
    appUsageLogs.forEach(log => {
      const appName = log.app_name || 'Unknown App';
      if (!appStats[appName]) {
        appStats[appName] = {
          name: appName,
          duration: 0,
          type: log.productivity_type || 'neutral'
        };
      }
      appStats[appName].duration += (log.duration ?? 0);
    });

    return Object.values(appStats)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
  };

  const overallStats = calculateOverallStats();
  const topApps = getTopApps();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading productivity data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Productivity Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Track employee productivity and app usage • {employees.length} active employees
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard">
                <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-200">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Button 
                onClick={loadData} 
                className="bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Generating Data...' : 'Generate Real Data'}
              </Button>
              <Button variant="outline" onClick={logout} className="hover:bg-red-50 hover:border-red-200">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Filters & Date Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="employee">Employee</Label>
                <select
                  id="employee"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Employees</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Stats */}
      {overallStats && (
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Productivity</p>
                    <p className={`text-2xl font-bold ${getProductivityColor(overallStats.avgProductivity)}`}>
                      {overallStats.avgProductivity}%
                    </p>
                  </div>
                  {getProductivityIcon(overallStats.avgProductivity)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Productive Time</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatDuration(overallStats.totalProductive)}
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Unproductive Time</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatDuration(overallStats.totalUnproductive)}
                    </p>
                  </div>
                  <Coffee className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Time Tracked</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatDuration(overallStats.totalTime)}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Productivity Scores Table */}
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee Productivity Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productivityScores.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Productive Time</TableHead>
                    <TableHead>Unproductive Time</TableHead>
                    <TableHead>Neutral Time</TableHead>
                    <TableHead>Productivity Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productivityScores.map((score) => (
                    <TableRow key={score.id}>
                      <TableCell className="font-medium">
                        {score.employee?.name || "Unknown"}
                      </TableCell>
                      <TableCell>{new Date(score.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-green-600">
                        {formatDuration(score.productive_time)}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {formatDuration(score.unproductive_time)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDuration(score.neutral_time)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getProductivityIcon(score.productivity_score)}
                          <span className={`font-medium ${getProductivityColor(score.productivity_score)}`}>
                            {Math.round(score.productivity_score)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No productivity data available for the selected period</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Apps Usage */}
      {topApps.length > 0 && (
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Top Applications Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topApps.map((app, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{app.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{app.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatDuration(app.duration)}</p>
                      <p className="text-sm text-gray-500">
                        {Math.round((app.duration / (overallStats?.totalTime || 1)) * 100)}% of total time
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 