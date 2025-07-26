"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "@time-tracker/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@time-tracker/ui";
import { database } from "@time-tracker/api";
import Link from "next/link";
import {
  Users,
  FolderOpen,
  Camera,
  Clock,
  TrendingUp,
  Activity,
  Target,
  CheckCircle2,
  ArrowRight,
  Timer,
  UserCheck,
  BarChart3,
  Download,
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalProjects: 0,
    activeProjects: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardStats();
    }
  }, [user]);

  const loadDashboardStats = async () => {
    try {
      // Load employees
      const { data: employees } = await database.getEmployees();
      const activeEmployees = employees?.filter(emp => emp.status === 'active').length || 0;
      
      // Load projects
      const { data: projects } = await database.getProjects();
      const activeProjects = projects?.filter(proj => proj.status === 'active').length || 0;

      setStats({
        totalEmployees: employees?.length || 0,
        activeEmployees,
        totalProjects: projects?.length || 0,
        activeProjects,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  SolidTracker Admin
                </h1>
                <p className="text-sm text-gray-600">
                  {currentDate} • {currentTime}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={logout} className="hover:bg-red-50 hover:border-red-200">
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-4 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
              <p className="text-blue-100 text-lg">
                Manage your team and track productivity across all projects
              </p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 right-8 w-20 h-20 bg-white/5 rounded-full translate-y-10"></div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-all duration-200 border-0 bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Employees</p>
                  <div className="text-3xl font-bold text-gray-900">
                    {loadingStats ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                    ) : (
                      stats.totalEmployees
                    )}
                  </div>
                  <p className="text-xs text-green-600 font-medium mt-1">
                    {stats.activeEmployees} active
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 border-0 bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Projects</p>
                  <div className="text-3xl font-bold text-gray-900">
                    {loadingStats ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                    ) : (
                      stats.totalProjects
                    )}
                  </div>
                  <p className="text-xs text-green-600 font-medium mt-1">
                    {stats.activeProjects} active
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <FolderOpen className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 border-0 bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">This Month</p>
                  <div className="text-3xl font-bold text-gray-900">--</div>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Total hours tracked
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Timer className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 border-0 bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Productivity</p>
                  <div className="text-3xl font-bold text-gray-900">--</div>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Average score
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/employees" className="group">
            <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm group-hover:scale-[1.02]">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Employee Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Manage your team members, invite new employees, and control access to the system.
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center text-green-600">
                    <UserCheck className="h-4 w-4 mr-1" />
                    {stats.activeEmployees} Active
                  </span>
                  <span className="flex items-center text-gray-500">
                    <Users className="h-4 w-4 mr-1" />
                    {stats.totalEmployees} Total
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/projects" className="group">
            <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm group-hover:scale-[1.02]">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                    <FolderOpen className="h-6 w-6 text-white" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Project Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Create and manage projects, assign team members, and track project progress.
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center text-green-600">
                    <Target className="h-4 w-4 mr-1" />
                    {stats.activeProjects} Active
                  </span>
                  <span className="flex items-center text-gray-500">
                    <FolderOpen className="h-4 w-4 mr-1" />
                    {stats.totalProjects} Total
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/screenshots" className="group">
            <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm group-hover:scale-[1.02]">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Screenshots & Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  View employee productivity screenshots and monitor work activity across all projects.
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center text-blue-600">
                    <Activity className="h-4 w-4 mr-1" />
                    Live Monitoring
                  </span>
                  <span className="flex items-center text-gray-500">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Analytics
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-blue-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Link href="/employees">
                <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                  <Users className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </Link>
              <Link href="/projects">
                <Button variant="outline" className="w-full justify-start hover:bg-purple-50 hover:border-purple-200">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </Link>
              <Link href="/screenshots">
                <Button variant="outline" className="w-full justify-start hover:bg-green-50 hover:border-green-200">
                  <Activity className="h-4 w-4 mr-2" />
                  View Activity
                </Button>
              </Link>
              <Link href="/download">
                <Button variant="outline" className="w-full justify-start hover:bg-orange-50 hover:border-orange-200">
                  <Download className="h-4 w-4 mr-2" />
                  Download App
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start hover:bg-gray-50 hover:border-gray-200">
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
