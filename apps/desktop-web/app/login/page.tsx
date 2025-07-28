"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@time-tracker/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@time-tracker/ui";
import { Input } from "@time-tracker/ui";
import { Label } from "@time-tracker/ui";
import { database } from "@time-tracker/api";
import { Clock, Lock, Mail, User, Timer, BarChart3, Database } from "lucide-react";
import Cookies from "js-cookie";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await database.signInWithEmployee(
        email,
        password
      );

      if (!data || authError) {
        setError(
          authError?.message || "Invalid email or password. Please try again."
        );
        setLoading(false);
        return;
      }

      // Store employee data in cookies
      Cookies.set("employee-data", JSON.stringify(data), {
        expires: 1, // Expires in 1 day
        secure: process.env.NODE_ENV === "production",
      });

      setLoading(false);
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login. Please try again.");
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setSeeding(true);
    setError(null);

    try {
      // Step 1: Seed the database with sample data
      const seedResponse = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!seedResponse.ok) {
        throw new Error('Failed to seed database');
      }

      const seedResult = await seedResponse.json();
      console.log('Seed result:', seedResult);

      // Step 2: Login with the demo employee
      const { data, error: authError } = await database.signInWithEmployee(
        'john.doe@example.com',
        'hashed_password_here'
      );

      if (!data || authError) {
        setError("Demo login failed. Please try manual login.");
        setSeeding(false);
        return;
      }

      // Store employee data in cookies
      Cookies.set("employee-data", JSON.stringify(data), {
        expires: 1, // Expires in 1 day
        secure: process.env.NODE_ENV === "production",
      });

      setSeeding(false);
      router.push("/dashboard");
    } catch (error) {
      console.error("Demo login error:", error);
      setError("Demo setup failed. Please try manual login.");
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-200/30 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-200/30 rounded-full translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-purple-200/20 rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-2xl mb-4">
            <Timer className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
            SolidTracker
          </h1>
          <p className="text-gray-600">
            Employee Portal
          </p>
        </div>

        <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center">
              <User className="h-5 w-5 mr-2 text-indigo-600" />
              Employee Sign In
            </CardTitle>
            <p className="text-gray-600">
              Access your time tracking dashboard
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                {error}
              </div>
            )}

            {/* Demo Login Button */}
            <div className="mb-6">
              <Button 
                onClick={handleDemoLogin} 
                className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-medium text-lg mb-4" 
                disabled={seeding || loading}
              >
                {seeding ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Setting up demo...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Database className="h-5 w-5 mr-2" />
                    Demo Login (Auto Setup)
                  </div>
                )}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Creates sample projects and tasks automatically
              </p>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or sign in manually</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your.email@company.com"
                    className="pl-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="pl-10 h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 font-medium text-lg" 
                disabled={loading || seeding}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Sign In to Dashboard
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Secure employee access • SolidTracker v2.0
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features preview */}
        <div className="mt-8 text-center">
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
                <Clock className="h-4 w-4 text-indigo-600" />
              </div>
              <span>Time Tracking</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center mb-2">
                <Timer className="h-4 w-4 text-cyan-600" />
              </div>
              <span>Project Timer</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </div>
              <span>Daily Reports</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
