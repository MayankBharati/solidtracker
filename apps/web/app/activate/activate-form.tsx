"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@time-tracker/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@time-tracker/ui";
import { Input } from "@time-tracker/ui";
import { Label } from "@time-tracker/ui";
import { database } from "@time-tracker/api";
import { Employee } from "@time-tracker/db";
import toast, { Toaster } from 'react-hot-toast';

export function ActivateForm() {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [activated, setActivated] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  useEffect(() => {
    if (token && email) {
      verifyToken();
    } else {
      setError("Invalid activation link");
      setVerifying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, email]);

  const verifyToken = async () => {
    try {
      const { data, error } =
        await database.getEmployeeByActivationToken(token);

      if (error || !data || data.length === 0) {
        setError("Invalid or expired activation token");
        setVerifying(false);
        return;
      }

      const employeeData = data[0];

      if (employeeData.email !== email) {
        setError("Email does not match activation token");
        setVerifying(false);
        return;
      }

      if (employeeData.status === "active") {
        setError("This account has already been activated");
        setVerifying(false);
        return;
      }

      setEmployee(employeeData);
      setVerifying(false);
    } catch (err) {
      console.error("Token verification failed:", err);
      setError("Failed to verify activation token");
      setVerifying(false);
    }
  };

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      if (!employee) {
        setError("Employee not found");
        setLoading(false);
        return;
      }
      // Update employee status and clear activation token
      const { error } = await database.activateEmployee(employee.id, password);

      if (error) {
        setError("Failed to activate account. Please try again.");
        setLoading(false);
        return;
      }

      toast.success("Account activated successfully!");
      setActivated(true);
      setLoading(false);
    } catch (err) {
      console.error("Activation failed:", err);
      setError("Failed to activate account. Please try again.");
      setLoading(false);
    }
  };

  const handleDownloadApp = async () => {
    if (!employee) return;
    
    setDownloadLoading(true);
    try {
      const response = await fetch('/api/download-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: employee.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to prepare download');
      }

      // Trigger download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Desktop app download started!');
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Failed to download app. Please try again.');
    } finally {
      setDownloadLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p>Verifying activation token...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              Activation Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <p className="text-muted-foreground text-sm">
                Please contact your administrator for a new activation link.
              </p>
            </div>
            <div className="text-center">
              <Button onClick={() => router.push("/login")} variant="outline">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-green-600">
              🎉 Account Activated!
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Welcome to the team, {employee?.name}! Your account is now ready to use.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">
                  📱 Download Desktop App
                </h3>
                <p className="text-sm text-green-700 mb-3">
                  Get the Time Tracker desktop app to start tracking your work efficiently.
                </p>
                <Button 
                  onClick={handleDownloadApp}
                  disabled={downloadLoading}
                  className="w-full bg-green-600 hover:bg-green-700 mb-3"
                >
                  {downloadLoading ? "Preparing Download..." : "Download Desktop App"}
                </Button>
                
                <div className="text-xs text-green-700 bg-green-100 p-2 rounded border">
                  <p className="font-semibold mb-1">📋 macOS Installation Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>After download, open the DMG file</li>
                    <li>If you see "App is damaged" warning:</li>
                    <li className="ml-4">• Right-click the app and select "Open"</li>
                    <li className="ml-4">• OR: Go to System Settings → Privacy & Security → Allow app</li>
                    <li>The app will run normally after the first approval</li>
                  </ol>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  You can also access the web version anytime
                </p>
                <Button 
                  onClick={() => router.push("/login")} 
                  variant="outline"
                  className="w-full"
                >
                  Continue to Web Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Toaster position="top-center" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Activate Your Account</CardTitle>
          <p className="text-center text-muted-foreground">
            Welcome {employee?.name}! Set up your password to complete
            activation.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleActivation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={employee?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Activating..." : "Activate Account"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              By activating your account, you agree to our terms of service and
              privacy policy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
