"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@time-tracker/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@time-tracker/ui";
import { Input } from "@time-tracker/ui";
import { Label } from "@time-tracker/ui";
import { auth } from "@time-tracker/api";
import { Clock, Lock, Mail, Shield, Timer } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await auth.signInWithEmail(
        email,
        password
      );

      if (authError) {
        setError(authError.message || "Login failed");
        setLoading(false);
        return;
      }

      if (data?.user) {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-200/30 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200/30 rounded-full translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-indigo-200/20 rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
            <Clock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
            SolidTracker
          </h1>
          <p className="text-gray-600">
            Admin Portal
          </p>
        </div>

        <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              Admin Sign In
            </CardTitle>
            <p className="text-gray-600">
              Access your management dashboard
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                {error}
              </div>
            )}

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
                    placeholder="admin@company.com"
                    className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
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
                    className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-medium text-lg" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Timer className="h-5 w-5 mr-2" />
                    Sign In to Dashboard
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Secure admin access • SolidTracker v2.0
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features preview */}
        <div className="mt-8 text-center">
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <span>Time Tracking</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <Shield className="h-4 w-4 text-purple-600" />
              </div>
              <span>Team Management</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Timer className="h-4 w-4 text-green-600" />
              </div>
              <span>Analytics</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
