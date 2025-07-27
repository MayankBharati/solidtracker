"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@time-tracker/ui";
import { Button } from "@time-tracker/ui";
import { database } from "@time-tracker/api";
import { Employee, Project, Task, TimeEntry } from "@time-tracker/db";
import Cookies from "js-cookie";
import {
  Clock,
  Play,
  Square,
  Calendar,
  Target,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  FileText,
  LogOut,
  Timer,
  BarChart3,
  RefreshCw,
  Bell,
} from "lucide-react";
import { format } from "date-fns";

// Check if we're in Electron environment
const isElectron = typeof window !== 'undefined' && window.require;
const ipcRenderer = isElectron ? window.require('electron').ipcRenderer : null;

interface ProjectWithTasks extends Project {
  tasks: Task[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [projectsWithTasks, setProjectsWithTasks] = useState<ProjectWithTasks[]>([]);
  const [activeTimeEntry, setActiveTimeEntry] = useState<TimeEntry | null>(null);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timer, setTimer] = useState<number>(0);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [newTasksCount, setNewTasksCount] = useState<number>(0);
  const [previousTasksCount, setPreviousTasksCount] = useState<number>(0);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (employee) {
      loadDashboardData();
    }
  }, [employee]);

  // Real-time polling effect - refresh data every 30 seconds
  useEffect(() => {
    if (!employee) return;

    const pollInterval = setInterval(() => {
      console.log("🔄 Auto-refreshing dashboard data...");
      refreshDashboardData();
    }, 30000); // 30 seconds

    return () => clearInterval(pollInterval);
  }, [employee]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimeEntry) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimeEntry]);

  const checkAuth = () => {
    const employeeCookie = Cookies.get("employee-data");

    if (!employeeCookie) {
      router.push("/login");
      return;
    }

    try {
      const employeeData = JSON.parse(employeeCookie);
      setEmployee(employeeData);
    } catch (error) {
      console.error("Error parsing employee cookie:", error);
      router.push("/login");
    }
  };

  const loadDashboardData = async () => {
    if (!employee) return;

    try {
      console.log("Loading dashboard data for employee:", employee.id);

      // Load employee's projects
      const { data: projectsData, error: projectsError } = await database.getEmployeeProjects(employee.id);
      console.log("Projects response:", { projectsData, projectsError });

      // Load employee's tasks
      const { data: tasksData, error: tasksError } = await database.getEmployeeTasks(employee.id);
      console.log("Tasks response:", { tasksData, tasksError });

      // Combine projects with their tasks
      if (projectsData && Array.isArray(projectsData) && tasksData && Array.isArray(tasksData)) {
        const projectsWithTasksData: ProjectWithTasks[] = projectsData.map((project: any) => {
          const projectTasks = tasksData.filter((task: any) => task.project_id === project.id) as any[];
          return {
            ...project,
            tasks: projectTasks as unknown as Task[]
          } as ProjectWithTasks;
        });

        setProjectsWithTasks(projectsWithTasksData);

        // Check for new tasks
        const currentTasksCount = tasksData.length;
        if (previousTasksCount > 0 && currentTasksCount > previousTasksCount) {
          const newTasks = currentTasksCount - previousTasksCount;
          setNewTasksCount(newTasks);
          console.log(`🎉 ${newTasks} new task(s) detected!`);
          
          // Show notification if in Electron
          if (ipcRenderer) {
            ipcRenderer.send('show-notification', {
              title: 'New Tasks Assigned',
              body: `You have ${newTasks} new task(s) assigned to you!`,
              icon: '🎯'
            });
          } else {
            // Show toast notification for web users
            showToastNotification(`🎉 You have ${newTasks} new task(s) assigned to you!`);
          }
        }
        setPreviousTasksCount(currentTasksCount);

        // Set default selections
        if (projectsWithTasksData.length > 0) {
          const firstProject = projectsWithTasksData[0];
          if (firstProject) {
            setSelectedProject(firstProject.id);
            if (firstProject.tasks && firstProject.tasks.length > 0 && firstProject.tasks[0]) {
              setSelectedTask(firstProject.tasks[0].id);
            }
          }
        }
      } else {
        console.log("No projects or tasks found for employee");
        setProjectsWithTasks([]);
      }

      // Load active time entry
      const { data: activeEntry, error: activeError } = await database.getActiveTimeEntry(employee.id);
      console.log("Active entry response:", { activeEntry, activeError });

      if (activeEntry) {
        setActiveTimeEntry(activeEntry);
        const startTime = new Date(activeEntry.started_at).getTime();
        const now = new Date().getTime();
        setTimer(Math.floor((now - startTime) / 1000));
      } else {
        setActiveTimeEntry(null);
        setTimer(0);
      }

      // Load today's entries
      const { data: todayData, error: todayError } = await database.getTodayTimeEntries(employee.id);
      console.log("Today entries response:", { todayData, todayError });

      if (todayData) {
        setTodayEntries(todayData);
      } else {
        setTodayEntries([]);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Separate function for refreshing data (used by polling and manual refresh)
  const refreshDashboardData = useCallback(async () => {
    if (!employee) return;

    setRefreshing(true);
    try {
      console.log("🔄 Refreshing dashboard data for employee:", employee.id);

      // Load employee's projects
      const { data: projectsData, error: projectsError } = await database.getEmployeeProjects(employee.id);

      // Load employee's tasks
      const { data: tasksData, error: tasksError } = await database.getEmployeeTasks(employee.id);

      // Combine projects with their tasks
      if (projectsData && Array.isArray(projectsData) && tasksData && Array.isArray(tasksData)) {
        const projectsWithTasksData: ProjectWithTasks[] = projectsData.map((project: any) => {
          const projectTasks = tasksData.filter((task: any) => task.project_id === project.id) as any[];
          return {
            ...project,
            tasks: projectTasks as unknown as Task[]
          } as ProjectWithTasks;
        });

        setProjectsWithTasks(projectsWithTasksData);

        // Check for new tasks
        const currentTasksCount = tasksData.length;
        if (previousTasksCount > 0 && currentTasksCount > previousTasksCount) {
          const newTasks = currentTasksCount - previousTasksCount;
          setNewTasksCount(newTasks);
          console.log(`🎉 ${newTasks} new task(s) detected!`);
          
          // Show notification if in Electron
          if (ipcRenderer) {
            ipcRenderer.send('show-notification', {
              title: 'New Tasks Assigned',
              body: `You have ${newTasks} new task(s) assigned to you!`,
              icon: '🎯'
            });
          } else {
            // Show toast notification for web users
            showToastNotification(`🎉 You have ${newTasks} new task(s) assigned to you!`);
          }
        }
        setPreviousTasksCount(currentTasksCount);
      }

      // Load active time entry
      const { data: activeEntry, error: activeError } = await database.getActiveTimeEntry(employee.id);

      if (activeEntry) {
        setActiveTimeEntry(activeEntry);
        const startTime = new Date(activeEntry.started_at).getTime();
        const now = new Date().getTime();
        setTimer(Math.floor((now - startTime) / 1000));
      } else {
        setActiveTimeEntry(null);
        setTimer(0);
      }

      // Load today's entries
      const { data: todayData, error: todayError } = await database.getTodayTimeEntries(employee.id);

      if (todayData) {
        setTodayEntries(todayData);
      } else {
        setTodayEntries([]);
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [employee, previousTasksCount, ipcRenderer]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    console.log("🔄 Manual refresh triggered");
    await refreshDashboardData();
  };

  // Clear new tasks notification
  const clearNewTasksNotification = () => {
    setNewTasksCount(0);
  };

  // Show toast notification
  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000); // Hide after 5 seconds
  };

  const handleStartTimer = async () => {
    if (!employee) {
      showToastNotification('❌ Please log in to start timer');
      return;
    }

    if (!selectedProject) {
      showToastNotification('❌ Please select a project first');
      return;
    }

    if (!selectedTask) {
      showToastNotification('❌ Please select a task first');
      return;
    }

    try {
      const { data, error } = await database.startTimeEntry(
        employee.id,
        selectedProject,
        selectedTask
      );
      if (data && !error) {
        setActiveTimeEntry(data);
        setTimer(0);
        await loadDashboardData(); // Refresh today's entries
        
        // Show success notification
        showToastNotification('✅ Timer started successfully!');
        
        // Start screenshots in Electron
        if (ipcRenderer) {
          console.log('🎬 Sending start-screenshots message to Electron for employee:', employee.id);
          ipcRenderer.send('start-screenshots', employee.id);
        } else {
          console.log('⚠️ Not running in Electron environment');
        }
      } else {
        console.error("Error starting timer:", error);
        showToastNotification('❌ Failed to start timer. Please try again.');
      }
    } catch (error) {
      console.error("Error starting timer:", error);
    }
  };

  const handleStopTimer = async () => {
    if (!employee) return;

    try {
      const { data, error } = await database.stopTimeEntry(employee.id);
      if (data && !error) {
        setActiveTimeEntry(null);
        setTimer(0);
        await loadDashboardData(); // Refresh today's entries
        
        // Stop screenshots in Electron
        if (ipcRenderer) {
          console.log('🛑 Sending stop-screenshots message to Electron');
          ipcRenderer.send('stop-screenshots');
        } else {
          console.log('⚠️ Not running in Electron environment');
        }
      } else {
        console.error("Error stopping timer:", error);
      }
    } catch (error) {
      console.error("Error stopping timer:", error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateTodayTotal = () => {
    return todayEntries.reduce((total, entry) => {
      if (entry.duration) {
        return total + entry.duration;
      }
      return total;
    }, 0);
  };

  const handleLogout = () => {
    Cookies.remove("employee-data");
    router.push("/login");
  };

  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const handleProjectTaskSelection = (projectId: string, taskId: string) => {
    setSelectedProject(projectId);
    setSelectedTask(taskId);
  };

  const handleTaskStatusToggle = async (taskId: string, currentStatus: "Pending" | "Completed") => {
    try {
      const newStatus = currentStatus === "Pending" ? "Completed" : "Pending";
      const { data, error } = await database.updateTaskStatus(taskId, newStatus);
      
      if (data && !error) {
        // Refresh the dashboard data to show the updated status
        await loadDashboardData();
      } else {
        console.error("Error updating task status:", error);
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Timer className="h-6 w-6 text-indigo-600" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  SolidTracker
                </h1>
              </div>
              {employee && (
                <div className="flex flex-col">
                  <span className="text-sm text-gray-600">
                    Welcome, {employee.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    Auto-refresh: {lastRefresh.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {/* New Tasks Notification */}
              {newTasksCount > 0 && (
                <div 
                  className="flex items-center space-x-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:bg-orange-200 transition-colors"
                  onClick={clearNewTasksNotification}
                  title="Click to dismiss notification"
                >
                  <Bell className="h-4 w-4" />
                  <span>{newTasksCount} new task{newTasksCount > 1 ? 's' : ''}</span>
                </div>
              )}
              
              {/* Refresh Button */}
              <Button 
                variant="outline" 
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                title={`Last refreshed: ${lastRefresh.toLocaleTimeString()}`}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container - Now matches header width */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-hidden flex flex-col w-full">
        {/* First Row: Today's Summary and Active Timer */}
        <div className="flex gap-6 mb-6 h-80">
          {/* Today's Summary */}
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg h-full flex flex-col flex-1">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="flex items-center space-x-2 text-indigo-900 text-lg">
                <BarChart3 className="h-5 w-5" />
                <span>Today's Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex flex-col justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-4 p-4 bg-green-50 rounded-lg">
                  {formatDuration(calculateTodayTotal())}
                </div>
                <p className="text-sm text-gray-600 mb-4">Total hours today</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <div className="text-xl font-semibold text-indigo-900">{todayEntries.length}</div>
                    <div className="text-indigo-600 text-sm">Entries</div>
                  </div>
                  <div className="bg-cyan-50 p-3 rounded-lg">
                    <div className="text-xl font-semibold text-cyan-900">{projectsWithTasks.length}</div>
                    <div className="text-cyan-600 text-sm">Projects</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Timer Section */}
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg h-full flex flex-col flex-1">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="flex items-center space-x-2 text-indigo-900 text-lg">
                <Clock className="h-5 w-5" />
                <span>Active Timer</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex flex-col justify-center min-h-[200px]">
              {activeTimeEntry ? (
                <div className="text-center flex flex-col justify-center h-full">
                  <div className="text-3xl font-mono font-bold text-indigo-600 mb-3 p-4 bg-indigo-50 rounded-lg">
                    {formatDuration(timer)}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    Started at {format(new Date(activeTimeEntry.started_at), "HH:mm")}
                  </div>
                  <div className="h-[120px] flex items-center justify-center">
                    <Button
                      onClick={handleStopTimer}
                      className="bg-red-600 hover:bg-red-700 text-white shadow-lg px-4 py-2"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop Timer
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center flex flex-col justify-center h-full">
                  <div className="text-3xl font-mono font-bold text-gray-400 mb-3 p-4 bg-gray-50 rounded-lg">
                    00:00:00
                  </div>
                  <div className="text-sm text-gray-600 mb-4">No active timer</div>
                  <div className="h-[120px] flex items-center justify-center">
                    {projectsWithTasks.length > 0 ? (
                      <div className="space-y-4 w-full max-w-sm">
                        <div className="space-y-3">
                          <div>
                            <select
                              value={selectedProject}
                              onChange={(e) => {
                                setSelectedProject(e.target.value);
                                // Clear the task selection when project changes
                                setSelectedTask("");
                              }}
                              className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm w-full transition-colors ${
                                selectedProject 
                                  ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <option value="">Select Project</option>
                              {projectsWithTasks.map((project) => (
                                <option key={project.id} value={project.id}>
                                  {project.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <select
                              value={selectedTask}
                              onChange={(e) => setSelectedTask(e.target.value)}
                              className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm w-full transition-colors ${
                                selectedTask 
                                  ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                                  : 'border-gray-300 hover:border-gray-400'
                              } ${!selectedProject ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={!selectedProject}
                            >
                              <option value="">Select Task</option>
                              {selectedProject && 
                                projectsWithTasks
                                  .find(p => p.id === selectedProject)?.tasks
                                  ?.map((task) => (
                                    <option key={task.id} value={task.id}>
                                      {task.name}
                                    </option>
                                  ))
                              }
                            </select>
                          </div>
                        </div>
                        

                        
                        <Button
                          onClick={handleStartTimer}
                          disabled={!selectedProject || !selectedTask}
                          className={`w-full px-4 py-3 font-medium transition-all duration-200 ${
                            selectedProject && selectedTask
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                          }`}
                        >
                          <Play className={`h-4 w-4 mr-2 ${selectedProject && selectedTask ? 'animate-pulse' : ''}`} />
                          {!selectedProject && !selectedTask
                            ? 'Select Project & Task'
                            : !selectedProject
                            ? 'Select Project'
                            : !selectedTask
                            ? 'Select Task'
                            : 'Start Timer'
                          }
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-gray-500 text-sm">No projects available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Second Row: Today's Time Entries and My Projects & Tasks */}
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Today's Time Entries */}
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg h-full flex flex-col flex-1">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="flex items-center space-x-2 text-indigo-900 text-lg">
                <Calendar className="h-5 w-5" />
                <span>Today's Time Entries</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex flex-col min-h-0">
              {todayEntries.length > 0 ? (
                <div 
                  className="flex-1 overflow-y-scroll space-y-3 pr-2" 
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#d1d5db #f3f4f6'
                  }}
                >
                  {todayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">
                          {entry.projects?.name} - {entry.tasks?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(entry.started_at), "HH:mm")} -
                          {entry.ended_at
                            ? format(new Date(entry.ended_at), " HH:mm")
                            : " Active"}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="font-mono font-semibold text-indigo-600 text-sm">
                          {entry.duration ? formatDuration(entry.duration) : "00:00:00"}
                        </p>
                        {!entry.ended_at && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-1 inline-block">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No time entries for today</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Projects & Tasks */}
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg h-full flex flex-col flex-1">
            <CardHeader className="pb-4 flex-shrink-0">
              <CardTitle className="flex items-center space-x-2 text-indigo-900 text-lg">
                <FolderOpen className="h-5 w-5" />
                <span>My Projects & Tasks</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {projectsWithTasks.length > 0 ? (
                  projectsWithTasks.map((project) => (
                    <div key={project.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Project Header */}
                      <div
                        className="p-4 bg-gradient-to-r from-indigo-50 to-cyan-50 cursor-pointer hover:from-indigo-100 hover:to-cyan-100 transition-colors"
                        onClick={() => toggleProjectExpansion(project.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {expandedProjects.has(project.id) ? (
                                <ChevronDown className="h-5 w-5 text-indigo-600" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-indigo-600" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-indigo-900">{project.name}</h3>
                              <p className="text-sm text-gray-600">{project.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                              {project.tasks.length} task{project.tasks.length !== 1 ? 's' : ''}
                            </span>
                            {project.hourly_rate && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                ${project.hourly_rate}/hr
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tasks List */}
                      {expandedProjects.has(project.id) && (
                        <div className="bg-white border-t border-gray-100">
                          {project.tasks.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                              {project.tasks.map((task) => (
                                <div
                                  key={task.id}
                                  className={`p-3 cursor-pointer transition-colors ${
                                    selectedProject === project.id && selectedTask === task.id
                                      ? 'bg-indigo-50 border-l-4 border-indigo-500'
                                      : 'hover:bg-gray-50'
                                  }`}
                                  onClick={() => handleProjectTaskSelection(project.id, task.id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <FileText className="h-4 w-4 text-gray-400" />
                                      <span className="font-medium text-gray-900">{task.name}</span>
                                    </div>
                                    <div className="flex space-x-2">
                                      <select
                                        value={task.status}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          const newStatus = e.target.value as "Pending" | "Completed";
                                          handleTaskStatusToggle(task.id, newStatus === "Completed" ? "Pending" : "Completed");
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className={`text-xs px-2 py-1 rounded border-0 font-medium cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                          task.status === 'Completed'
                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                        }`}
                                      >
                                        <option value="Pending" className="bg-white text-gray-900">Pending</option>
                                        <option value="Completed" className="bg-white text-gray-900">Completed</option>
                                      </select>
                                      {selectedProject === project.id && selectedTask === task.id && (
                                        <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                                          Selected
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 text-center text-gray-500">
                              No tasks available for this project
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No projects assigned</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-right duration-300">
          <span className="text-lg">🎉</span>
          <span className="font-medium">{toastMessage}</span>
          <button
            onClick={() => setShowToast(false)}
            className="ml-2 text-white hover:text-gray-200 transition-colors"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
