"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
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
import { Team, Employee, TeamAssignment, Project, Task } from "@time-tracker/db";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Plus,
  Edit3,
  Trash2,
  ArrowLeft,
  LogOut,
  UserCheck,
  Crown,
  Shield,
  FolderOpen,
  Target,
  CheckCircle,
  Clock,
  Activity,
  FileText,
  User,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function EnhancedTeamsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teamAssignments, setTeamAssignments] = useState<{ [teamId: string]: TeamAssignment[] }>({});
  const [teamProjects, setTeamProjects] = useState<{ [teamId: string]: Project[] }>({});
  const [teamTasks, setTeamTasks] = useState<{ [teamId: string]: Task[] }>({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState<string | null>(null);
  const [showProjectForm, setShowProjectForm] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [newProject, setNewProject] = useState({ name: "", description: "", hourly_rate: 0 });
  const [newTask, setNewTask] = useState({ name: "", project_id: "" });
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("member");
  const [selectedProject, setSelectedProject] = useState<string>("");

  useEffect(() => {
    loadTeams();
    loadEmployees();
  }, []);

  const loadTeams = async () => {
    try {
      const { data, error } = await database.getTeams();
      if (data) {
        setTeams(data);
        // Load team assignments, projects, and tasks for each team
        const assignments: { [teamId: string]: TeamAssignment[] } = {};
        const projects: { [teamId: string]: Project[] } = {};
        const tasks: { [teamId: string]: Task[] } = {};
        
        for (const team of data) {
          // Load team assignments
          const { data: teamAssignments } = await database.getTeamAssignments(team.id);
          if (teamAssignments) {
            assignments[team.id] = teamAssignments;
          }
          
          // Load team projects
          const { data: teamProjects } = await database.getTeamProjects(team.id);
          if (teamProjects) {
            projects[team.id] = teamProjects;
          }
          
          // Load team tasks
          const { data: teamTasks } = await database.getTeamTasks(team.id);
          if (teamTasks) {
            tasks[team.id] = teamTasks;
          }
        }
        
        setTeamAssignments(assignments);
        setTeamProjects(projects);
        setTeamTasks(tasks);
      }
      if (error) {
        console.error("Error loading teams:", error);
      }
    } catch (err) {
      console.error("Failed to load teams:", err);
    }
    setLoading(false);
  };

  const loadEmployees = async () => {
    const { data, error } = await database.getEmployees();
    if (data) {
      setEmployees(data.filter((emp) => emp.status === "active"));
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await database.createTeam(newTeam);

    if (data) {
      setTeams([data[0], ...teams]);
      setNewTeam({ name: "", description: "" });
      setShowAddForm(false);
      toast.success("Team created successfully!");
      loadTeams(); // Reload to get fresh data
    } else {
      toast.error("Failed to create team");
    }
  };

  const handleAssignEmployee = async (teamId: string) => {
    if (!selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }

    const { data, error } = await database.assignEmployeeToTeam(selectedEmployee, teamId, selectedRole);

    if (data) {
      // Update local state
      const updatedAssignments = { ...teamAssignments };
      if (!updatedAssignments[teamId]) {
        updatedAssignments[teamId] = [];
      }
      updatedAssignments[teamId].push(data[0]);
      setTeamAssignments(updatedAssignments);
      
      setSelectedEmployee("");
      setSelectedRole("member");
      setShowAssignForm(null);
      toast.success("Employee assigned to team successfully!");
    } else {
      toast.error("Failed to assign employee to team");
    }
  };

  const handleAddProject = async (teamId: string) => {
    if (!newProject.name) {
      toast.error("Please enter project name");
      return;
    }

    const { data, error } = await database.createTeamProject({
      ...newProject,
      team_id: teamId
    });

    if (data) {
      // Update local state
      const updatedProjects = { ...teamProjects };
      if (!updatedProjects[teamId]) {
        updatedProjects[teamId] = [];
      }
      updatedProjects[teamId].unshift(data[0]);
      setTeamProjects(updatedProjects);
      
      setNewProject({ name: "", description: "", hourly_rate: 0 });
      setShowProjectForm(null);
      toast.success("Project created successfully!");
    } else {
      toast.error("Failed to create project");
    }
  };

  const handleAddTask = async (teamId: string) => {
    if (!newTask.name || !selectedProject) {
      toast.error("Please enter task name and select project");
      return;
    }

    const { data, error } = await database.createTeamTask({
      ...newTask,
      project_id: selectedProject,
      team_id: teamId
    });

    if (data) {
      // Update local state
      const updatedTasks = { ...teamTasks };
      if (!updatedTasks[teamId]) {
        updatedTasks[teamId] = [];
      }
      updatedTasks[teamId].unshift(data[0]);
      setTeamTasks(updatedTasks);
      
      setNewTask({ name: "", project_id: "" });
      setSelectedProject("");
      setShowTaskForm(null);
      toast.success("Task created successfully!");
    } else {
      toast.error("Failed to create task");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "manager":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "lead":
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "manager":
        return "Manager";
      case "lead":
        return "Team Lead";
      default:
        return "Member";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getProjectStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "active":
        return <PlayCircle className="h-4 w-4 text-blue-600" />;
      case "inactive":
        return <PauseCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading teams...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Enhanced Team Management
                </h1>
                <p className="text-sm text-gray-600">
                  Manage teams, projects, and tasks • {teams.length} total teams
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
              <Button variant="outline" onClick={logout} className="hover:bg-red-50 hover:border-red-200">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
              <Button onClick={() => setShowAddForm(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Team
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Team Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Team</h3>
            <form onSubmit={handleAddTeam}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Team Name</Label>
                  <Input
                    id="name"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder="Enter team name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                    placeholder="Enter team description"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button type="submit" className="flex-1">
                  Create Team
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teams List */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{team.name}</CardTitle>
                    {team.description && (
                      <p className="text-gray-600 mt-1">{team.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowProjectForm(team.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Add Project
                    </Button>
                    <Button
                      onClick={() => setShowTaskForm(team.id)}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                    <Button
                      onClick={() => setShowAssignForm(team.id)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign Employee
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Team Members */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Team Members
                      </h4>
                      <span className="text-sm text-gray-500">
                        {teamAssignments[team.id]?.length || 0} members
                      </span>
                    </div>
                    
                    {(() => {
                      const assignments = teamAssignments[team.id];
                      return assignments && assignments.length > 0 ? (
                        <div className="space-y-2">
                          {assignments.map((assignment) => (
                            <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                {getRoleIcon(assignment.role)}
                                <div>
                                  <p className="font-medium">{assignment.employee?.name}</p>
                                  <p className="text-sm text-gray-500">{assignment.employee?.email}</p>
                                </div>
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                {getRoleLabel(assignment.role)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p>No team members assigned yet</p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Team Projects */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <FolderOpen className="h-4 w-4 mr-2" />
                        Projects
                      </h4>
                      <span className="text-sm text-gray-500">
                        {teamProjects[team.id]?.length || 0} projects
                      </span>
                    </div>
                    
                    {(() => {
                      const projects = teamProjects[team.id];
                      return projects && projects.length > 0 ? (
                        <div className="space-y-2">
                          {projects.map((project) => (
                            <div key={project.id} className="p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-blue-900">{project.name}</h5>
                                {getProjectStatusIcon(project.status)}
                              </div>
                              {project.description && (
                                <p className="text-sm text-blue-700 mb-2">{project.description}</p>
                              )}
                              <div className="flex items-center justify-between text-xs text-blue-600">
                                <span>${project.hourly_rate}/hr</span>
                                <span className="capitalize">{project.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <FolderOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p>No projects created yet</p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Team Tasks */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        Tasks
                      </h4>
                      <span className="text-sm text-gray-500">
                        {teamTasks[team.id]?.length || 0} tasks
                      </span>
                    </div>
                    
                    {(() => {
                      const tasks = teamTasks[team.id];
                      return tasks && tasks.length > 0 ? (
                        <div className="space-y-2">
                          {tasks.map((task) => (
                            <div key={task.id} className="p-3 bg-purple-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-purple-900">{task.name}</h5>
                                {getStatusIcon(task.status)}
                              </div>
                              {task.project && (
                                <p className="text-sm text-purple-700 mb-1">
                                  Project: {task.project.name}
                                </p>
                              )}
                              <div className="text-xs text-purple-600">
                                <span className="capitalize">{task.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <Target className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p>No tasks created yet</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {teams.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teams created yet</h3>
            <p className="text-gray-500 mb-4">Create your first team to start organizing employees, projects, and tasks</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Team
            </Button>
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      {showProjectForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddProject(showProjectForm); }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="projectDescription">Description</Label>
                  <Input
                    id="projectDescription"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Enter project description"
                  />
                </div>
                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={newProject.hourly_rate}
                    onChange={(e) => setNewProject({ ...newProject, hourly_rate: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button type="submit" className="flex-1">
                  Create Project
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowProjectForm(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Task</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddTask(showTaskForm); }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="taskName">Task Name</Label>
                  <Input
                    id="taskName"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    placeholder="Enter task name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="projectSelect">Project</Label>
                  <select
                    id="projectSelect"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Project</option>
                    {teamProjects[showTaskForm]?.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button type="submit" className="flex-1">
                  Create Task
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowTaskForm(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Employee Modal */}
      {showAssignForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Assign Employee to Team</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="employee">Employee</Label>
                <select
                  id="employee"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="lead">Team Lead</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={() => handleAssignEmployee(showAssignForm)} className="flex-1">
                Assign Employee
              </Button>
              <Button variant="outline" onClick={() => setShowAssignForm(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 