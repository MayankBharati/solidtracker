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
import { Team, Employee, TeamAssignment } from "@time-tracker/db";
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
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

export default function TeamsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teamAssignments, setTeamAssignments] = useState<{ [teamId: string]: TeamAssignment[] }>({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("member");

  useEffect(() => {
    loadTeams();
    loadEmployees();
  }, []);

  const loadTeams = async () => {
    try {
      const { data, error } = await database.getTeams();
      if (data) {
        setTeams(data);
        // Load team assignments for each team
        const assignments: { [teamId: string]: TeamAssignment[] } = {};
        for (const team of data) {
          const { data: teamAssignments } = await database.getTeamAssignments(team.id);
          if (teamAssignments) {
            assignments[team.id] = teamAssignments;
          }
        }
        setTeamAssignments(assignments);
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
      // Update team assignments
      const currentAssignments = teamAssignments[teamId] || [];
      setTeamAssignments({
        ...teamAssignments,
        [teamId]: [...currentAssignments, data[0]]
      });
      setSelectedEmployee("");
      setSelectedRole("member");
      setShowAssignForm(null);
      toast.success("Employee assigned to team successfully!");
    } else {
      toast.error("Failed to assign employee to team");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "manager":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "lead":
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <UserCheck className="h-4 w-4 text-gray-600" />;
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
                  Team Management
                </h1>
                <p className="text-sm text-gray-600">
                  Manage teams and assignments • {teams.length} total teams
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
              <Link href="/teams/enhanced">
                <Button variant="outline" className="hover:bg-green-50 hover:border-green-200 text-green-700 border-green-300">
                  <Users className="h-4 w-4 mr-2" />
                  Enhanced Teams
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
                  <Button
                    onClick={() => setShowAssignForm(team.id)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Employee
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Team Members</h4>
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
              </CardContent>
            </Card>
          ))}
        </div>

        {teams.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teams created yet</h3>
            <p className="text-gray-500 mb-4">Create your first team to start organizing employees</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Team
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 