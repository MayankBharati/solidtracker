"use client";

import { useState, useEffect } from "react";
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
import { Employee } from "@time-tracker/db";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import {
  Users,
  UserPlus,
  Mail,
  Edit3,
  Trash2,
  Send,
  ArrowLeft,
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  UserCheck,
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function EmployeesPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState({ name: "", email: "" });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const { data, error } = await database.getEmployees();
      if (data) {
        setEmployees(data);
      }
      if (error) {
        console.error("Error loading employees:", error);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    }
    setLoading(false);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingEmployee(true);

    const activationToken = crypto.randomUUID();
    const { data, error } = await database.createEmployee({
      ...newEmployee,
      activation_token: activationToken,
    });

    if (data) {
      // Send invitation email
      const activationLink = `${window.location.origin}/activate?token=${activationToken}&email=${encodeURIComponent(newEmployee.email)}`;

      try {
        const response = await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: newEmployee.email,
            subject: "Welcome to Mercor Time Tracker - Account Activation",
            name: newEmployee.name,
            html: `
              <h2>Welcome to Mercor Time Tracker!</h2>
              <p>Hello ${newEmployee.name},</p>
              <p>You have been invited to join our time tracking platform. Please click the link below to activate your account and set up your password:</p>
              <p><a href="${activationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Activate Account</a></p>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p>${activationLink}</p>
              <p>This link will expire in 24 hours.</p>
              <p>Best regards,<br>The Mercor Team</p>
            `,
          }),
        });

        if (response.ok) {
          toast.success("Employee added and invitation email sent successfully!");
        } else {
          const errorData = await response.json();
          console.error("Email error:", errorData);
          alert(
            `Employee added but failed to send invitation email: ${errorData.error || "Unknown error"}`
          );
        }
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        alert(
          "Employee added but failed to send invitation email. Please send the activation link manually."
        );
      }

      setEmployees([data[0], ...employees]);
      setNewEmployee({ name: "", email: "" });
      setShowAddForm(false);
    }
    setAddingEmployee(false);
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const { data, error } = await database.updateEmployee(editingEmployee.id, {
      name: editingEmployee.name,
      email: editingEmployee.email,
    });

    if (data) {
      setEmployees(
        employees.map((emp) => (emp.id === editingEmployee.id ? data[0] : emp))
      );
      setEditingEmployee(null);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      const { error } = await database.deleteEmployee(id);
      if (!error) {
        setEmployees(employees.filter((emp) => emp.id !== id));
      }
    }
  };

  const handleResendInvitation = async (
    e: React.MouseEvent,
    employee: Employee
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!employee.activation_token) {
      toast.error("No activation token found for this employee");
      return;
    }

    setResendingEmail(employee.id);
    const activationLink = `${window.location.origin}/activate?token=${employee.activation_token}&email=${encodeURIComponent(employee.email)}`;

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: employee.email,
          subject: "Reminder: Activate Your Mercor Time Tracker Account",
          name: employee.name,
          html: `
            <h2>Reminder: Activate Your Account</h2>
            <p>Hello ${employee.name},</p>
            <p>This is a reminder to activate your Mercor Time Tracker account. Please click the link below:</p>
            <p><a href="${activationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Activate Account</a></p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${activationLink}</p>
            <p>Best regards,<br>The Mercor Team</p>
          `,
        }),
      });

      if (response.ok) {
        toast.success("Invitation email sent successfully!");
      } else {
        const errorData = await response.json();
        console.error("Email error:", errorData);
        alert(
          `Failed to send invitation email: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      toast.error("Failed to send invitation email. Please try again.");
    }
    setResendingEmail(null);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading employees...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const pendingEmployees = employees.filter(emp => emp.status === 'pending').length;

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
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Employee Management
                </h1>
                <p className="text-sm text-gray-600">
                  Manage your team • {employees.length} total employees
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
                <UserPlus className="h-4 w-4 mr-2" />
                Add Employee
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
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Employees</p>
                  <div className="text-3xl font-bold text-gray-900">{employees.length}</div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active</p>
                  <div className="text-3xl font-bold text-green-600">{activeEmployees}</div>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                  <div className="text-3xl font-bold text-yellow-600">{pendingEmployees}</div>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newEmployee.name}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) =>
                        setNewEmployee({
                          ...newEmployee,
                          email: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={addingEmployee}>
                    {addingEmployee ? "Adding..." : "Add Employee"}
                  </Button>
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

        {editingEmployee && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Edit Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditEmployee} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      value={editingEmployee.name}
                      onChange={(e) =>
                        setEditingEmployee({
                          ...editingEmployee,
                          name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editingEmployee.email}
                      onChange={(e) =>
                        setEditingEmployee({
                          ...editingEmployee,
                          email: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Update Employee</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingEmployee(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Employee Directory ({employees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-lg font-medium mb-2">No employees yet</p>
                <p className="text-gray-500 mb-4">
                  Add your first team member to get started with time tracking
                </p>
                <Button onClick={() => setShowAddForm(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Employee
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="font-semibold text-gray-700">Name</TableHead>
                    <TableHead className="font-semibold text-gray-700">Email</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Created</TableHead>
                    <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium text-gray-900">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-sm font-medium">
                              {employee.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {employee.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {employee.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(employee.status)}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              employee.status === "active"
                                ? "bg-green-100 text-green-800"
                                : employee.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(employee.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingEmployee(employee);
                              setShowAddForm(false);
                            }}
                            className="hover:bg-blue-50 hover:border-blue-200"
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          {employee.status === "pending" && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={(e) =>
                                handleResendInvitation(e, employee)
                              }
                              disabled={resendingEmail === employee.id}
                              className="hover:bg-green-50"
                            >
                              {resendingEmail === employee.id ? (
                                <div className="flex items-center">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-1"></div>
                                  Sending...
                                </div>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-1" />
                                  Resend
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
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
