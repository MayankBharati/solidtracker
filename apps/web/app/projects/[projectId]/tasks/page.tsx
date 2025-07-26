"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../../hooks/useAuth";
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
import { Employee, Task, Project, TaskAssignment } from "@time-tracker/db";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CheckSquare,
  Plus,
  Edit3,
  Trash2,
  UserPlus,
  ArrowLeft,
  LogOut,
  Target,
  Users,
  CheckCircle,
  AlertCircle,
  User,
  FileText,
  Star,
  Clock,
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function TasksPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<{ [taskId: string]: Employee }>({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [assigningTask, setAssigningTask] = useState<Task | null>(null);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [newTask, setNewTask] = useState({
    name: "",
    project_id: projectId,
    status: "Pending" as "Pending" | "Completed",
  });

  useEffect(() => {
    loadProject();
    loadTasks();
    loadEmployees();
    loadTaskAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadProject = async () => {
    const { data, error } = await database.getProjects();
    if (data) {
      const foundProject = data.find((p: Project) => p.id === projectId);
      setProject(foundProject || null);
    }
  };

  const loadTasks = async () => {
    try {
      const { data, error } = await database.getTasks(projectId);
      if (data) {
        setTasks(data);
      }
      if (error) {
        console.error("Error loading tasks:", error);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    }
    setLoading(false);
  };

  const loadEmployees = async () => {
    const { data, error } = await database.getProjectAssignments(projectId);
    if (data) {
      // Get the employees assigned to this project
      const employeeIds = data.map((assignment: { employee_id: string }) => assignment.employee_id);
      const { data: allEmployees } = await database.getEmployees();
      if (allEmployees) {
        setAvailableEmployees(
          allEmployees.filter(
            (emp: Employee) => employeeIds.includes(emp.id) && emp.status === "active"
          )
        );
      }
    }
  };

  const loadTaskAssignments = async () => {
    const { data, error } = await database.getProjectTaskAssignments(projectId);
    if (data) {
      const assignments: { [taskId: string]: Employee } = {};
      data.forEach((assignment: any) => {
        if (assignment.employees) {
          assignments[assignment.task_id] = assignment.employees;
        }
      });
      setTaskAssignments(assignments);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await database.createTask({
      ...newTask,
      project_id: projectId,
    });

    if (data) {
      setTasks([data[0], ...tasks]);
      setNewTask({
        name: "",
        project_id: projectId,
        status: "Pending",
      });
      setShowAddForm(false);
    }
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    const { data, error } = await database.updateTask(editingTask.id, {
      name: editingTask.name,
      status: editingTask.status,
    });

    if (data) {
      setTasks(tasks.map((t) => (t.id === editingTask.id ? data[0] : t)));
      setEditingTask(null);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      const { error } = await database.deleteTask(id);
      if (!error) {
        setTasks(tasks.filter((task) => task.id !== id));
      }
    }
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTask || !selectedEmployee) return;

    const { data, error } = await database.assignTaskToEmployee(
      assigningTask.id,
      selectedEmployee
    );

    if (!error) {
      // Reload task assignments to update the table
      await loadTaskAssignments();
      setAssigningTask(null);
      setSelectedEmployee("");
      toast.success("Task assigned successfully!");
    } else {
      toast.error("Failed to assign task. Please try again.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const assignedTasks = Object.keys(taskAssignments).length;

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
                <CheckSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Task Management
                </h1>
                <p className="text-sm text-gray-600">
                  {project ? `${project.name} • ${tasks.length} tasks` : `${tasks.length} tasks`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/projects">
                <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-200">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Projects
                </Button>
              </Link>
              <Button variant="outline" onClick={logout} className="hover:bg-red-50 hover:border-red-200">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
              <Button onClick={() => setShowAddForm(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
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
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Tasks</p>
                  <div className="text-3xl font-bold text-gray-900">{tasks.length}</div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <CheckSquare className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Completed Tasks</p>
                  <div className="text-3xl font-bold text-green-600">{completedTasks}</div>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Assigned</p>
                  <div className="text-3xl font-bold text-green-600">{assignedTasks}</div>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Task</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Task Name</Label>
                  <Input
                    id="name"
                    value={newTask.name}
                    onChange={(e) =>
                      setNewTask({ ...newTask, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Task Status</Label>
                  <select
                    id="status"
                    value={newTask.status}
                    onChange={(e) =>
                      setNewTask({ ...newTask, status: e.target.value as "Pending" | "Completed" })
                    }
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Add Task</Button>
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

        {editingTask && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Edit Task</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Task Name</Label>
                  <Input
                    id="edit-name"
                    value={editingTask.name}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Task Status</Label>
                  <select
                    id="edit-status"
                    value={editingTask.status}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        status: e.target.value as "Pending" | "Completed",
                      })
                    }
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Update Task</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingTask(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {assigningTask && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Assign Task: {assigningTask.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employee">Select Employee</Label>
                  <select
                    id="employee"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    required
                  >
                    <option value="">Choose an employee</option>
                    {availableEmployees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.email})
                      </option>
                    ))}
                  </select>
                  {availableEmployees.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No employees assigned to this project
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={!selectedEmployee}>
                    Assign Task
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAssigningTask(null);
                      setSelectedEmployee("");
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
            <CardTitle>Tasks ({tasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No tasks found. Add your first task to get started.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Employee</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        {task.name}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded ${
                          task.status === 'Completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {task.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {taskAssignments[task.id] ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {taskAssignments[task.id]?.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Not assigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(task.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingTask(task);
                              setShowAddForm(false);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setAssigningTask(task);
                              setEditingTask(null);
                              setShowAddForm(false);
                              // Set the currently assigned employee as default
                              setSelectedEmployee(taskAssignments[task.id]?.id || "");
                            }}
                          >
                            Assign
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
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
