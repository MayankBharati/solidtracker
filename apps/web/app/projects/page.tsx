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
import { Project } from "@time-tracker/db";
import Link from "next/link";
import {
  FolderOpen,
  Plus,
  Edit3,
  Trash2,
  Users,
  ArrowLeft,
  LogOut,
  DollarSign,
  Target,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  FileText,
  User,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function ProjectsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [assigningProject, setAssigningProject] = useState<Project | null>(
    null
  );
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<{
    [key: string]: any[];
  }>({});
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    hourly_rate: 0,
  });

  useEffect(() => {
    loadProjects();
    loadEmployees();
  }, []);

  const loadProjectAssignments = async () => {
    const assignments: { [key: string]: any[] } = {};

    for (const project of projects) {
      const { data, error } = await database.getProjectAssignments(project.id);
      if (data) {
        assignments[project.id] = data;
      }
    }

    setProjectAssignments(assignments);
  };

  useEffect(() => {
    if (projects.length > 0) {
      loadProjectAssignments();
    }
  }, [projects]);

  const loadEmployees = async () => {
    const { data, error } = await database.getEmployees();
    if (data) {
      setAvailableEmployees(data.filter((emp) => emp.status === "active"));
    }
  };

  const loadProjects = async () => {
    try {
      const { data, error } = await database.getProjects();
      if (data) {
        setProjects(data);
      }
      if (error) {
        console.error("Error loading projects:", error);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
    setLoading(false);
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await database.createProject(newProject);

    if (data) {
      setProjects([data[0], ...projects]);
      setNewProject({ name: "", description: "", hourly_rate: 0 });
      setShowAddForm(false);
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    const { data, error } = await database.updateProject(editingProject.id, {
      name: editingProject.name,
      description: editingProject.description,
      hourly_rate: editingProject.hourly_rate,
    });

    if (data) {
      setProjects(
        projects.map((proj) => (proj.id === editingProject.id ? data[0] : proj))
      );
      setEditingProject(null);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      const { error } = await database.deleteProject(id);
      if (!error) {
        setProjects(projects.filter((proj) => proj.id !== id));
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { data, error } = await database.updateProject(id, {
      status: newStatus,
    });
    if (data) {
      setProjects(
        projects.map((proj) =>
          proj.id === id ? { ...proj, status: newStatus as any } : proj
        )
      );
    }
  };

  const handleAssignEmployees = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningProject) return;

    const { data, error } = await database.assignEmployeesToProject(
      assigningProject.id,
      selectedEmployees
    );

    if (!error) {
      // Reload assignments for this project
      const { data: assignmentData } = await database.getProjectAssignments(
        assigningProject.id
      );
      if (assignmentData) {
        setProjectAssignments((prev) => ({
          ...prev,
          [assigningProject.id]: assignmentData,
        }));
      }

      setAssigningProject(null);
      setSelectedEmployees([]);
      toast.success("Employees assigned successfully!")
    } else {
      toast.error("Failed to assign employees. Please try again.");
    }
  };

  const handleEmployeeSelection = (employeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    } else {
      setSelectedEmployees(selectedEmployees.filter((id) => id !== employeeId));
    }
  };

  const assignments = (project: any) => {
    const assignments = projectAssignments[project.id];
    return assignments && assignments.length > 2 && (
      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
        +{assignments.length - 2} more
      </span>
    )
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const activeProjects = projects.filter(proj => proj.status === 'active').length;
  const completedProjects = projects.filter(proj => proj.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Toaster
        position="top-center"
        reverseOrder={false}
      />
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <FolderOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Project Management
                </h1>
                <p className="text-sm text-gray-600">
                  Create and manage projects • {projects.length} total projects
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
                Add Project
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Projects</p>
                  <div className="text-3xl font-bold text-gray-900">{projects.length}</div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FolderOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active</p>
                  <div className="text-3xl font-bold text-green-600">{activeProjects}</div>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <PlayCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                  <div className="text-3xl font-bold text-blue-600">{completedProjects}</div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Project</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddProject} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      value={newProject.name}
                      onChange={(e) =>
                        setNewProject({ ...newProject, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      step="0.01"
                      value={newProject.hourly_rate || ""}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          hourly_rate: e.target.value
                            ? parseFloat(e.target.value)
                            : 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    rows={3}
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Add Project</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {editingProject && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Edit Project</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditProject} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Project Name</Label>
                    <Input
                      id="edit-name"
                      value={editingProject.name}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-hourly_rate">Hourly Rate ($)</Label>
                    <Input
                      id="edit-hourly_rate"
                      type="number"
                      step="0.01"
                      value={editingProject.hourly_rate || ""}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          hourly_rate: e.target.value
                            ? parseFloat(e.target.value)
                            : 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <textarea
                    id="edit-description"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    rows={3}
                    value={editingProject.description || ""}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Update Project</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingProject(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {assigningProject && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Assign Employees to {assigningProject.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignEmployees} className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Employees</Label>
                  <div className="grid md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-4">
                    {availableEmployees.map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          id={`emp-${employee.id}`}
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={(e) =>
                            handleEmployeeSelection(
                              employee.id,
                              e.target.checked
                            )
                          }
                          className="rounded cursor-pointer"
                        />
                        <Label
                          htmlFor={`emp-${employee.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {employee.name} ({employee.email})
                        </Label>
                      </div>
                    ))}
                  </div>
                  {availableEmployees.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No active employees available
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={selectedEmployees.length === 0}
                  >
                    Assign Selected ({selectedEmployees.length})
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAssigningProject(null);
                      setSelectedEmployees([]);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Projects ({projects.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No projects found. Add your first project to get started.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Hourly Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Employees</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        {project.name}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {project.description || "No description"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {project.hourly_rate
                          ? `$${project.hourly_rate}/hr`
                          : "Not set"}
                      </TableCell>
                      <TableCell>
                        <select
                          value={project.status}
                          onChange={(e) =>
                            handleStatusChange(project.id, e.target.value)
                          }
                          className="px-2 py-1 rounded text-xs border"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="completed">Completed</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {projectAssignments[project.id]?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {projectAssignments[project.id]
                                ?.slice(0, 2)
                                .map((assignment) => (
                                  <span
                                    key={assignment.id}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                  >
                                    {assignment.employees?.name}
                                  </span>
                                ))}
                              {assignments(project)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              No employees assigned
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(project.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingProject(project);
                              setShowAddForm(false);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setAssigningProject(project);
                              setEditingProject(null);
                              setShowAddForm(false);
                              // Pre-select already assigned employees
                              const currentAssignments =
                                projectAssignments[project.id] || [];
                              const assignedEmployeeIds =
                                currentAssignments.map(
                                  (assignment) => assignment.employee_id
                                );
                              setSelectedEmployees(assignedEmployeeIds);
                            }}
                          >
                            Assign
                          </Button>
                          <Link href={`/projects/${project.id}/tasks`}>
                            <Button variant="outline" size="sm">
                              Tasks
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
