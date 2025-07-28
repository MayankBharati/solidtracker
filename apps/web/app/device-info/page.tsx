"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "@time-tracker/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@time-tracker/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@time-tracker/ui";
import { database } from "@time-tracker/api";
import { Device } from "@time-tracker/db";
import Link from "next/link";
import {
  Monitor,
  Network,
  HardDrive,
  Globe,
  ArrowLeft,
  LogOut,
  RefreshCw,
  Activity,
  Wifi,
  Server,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

interface DeviceInfo {
  localIP: string;
  publicIP?: string;
  macAddress: string;
  hostname: string;
  os: string;
  platform: string;
  arch: string;
  nodeVersion: string;
  networkInterfaces: any[];
  userAgent?: string;
  screenResolution?: string;
  timezone?: string;
  collectedAt: string;
}

export default function DeviceInfoPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDeviceInfo();
  }, []);

  const loadDeviceInfo = async () => {
    try {
      setLoading(true);
      const { data: employees, error } = await database.getEmployees();
      
      if (error) {
        console.error("Error loading employees:", error);
        toast.error("Failed to load employees");
        return;
      }

      if (employees && employees.length > 0) {
        const devicePromises = employees.map(async (employee) => {
          try {
            const deviceResult = await database.getDeviceInfo(employee.id);
            return {
              ...employee,
              deviceInfo: deviceResult.data
            };
          } catch (err) {
            console.error(`Error loading device info for ${employee.name}:`, err);
            return {
              ...employee,
              deviceInfo: null
            };
          }
        });
        
        const devicesWithInfo = await Promise.all(devicePromises);
        setDevices(devicesWithInfo);
        console.log('📱 Loaded device info for', devicesWithInfo.length, 'employees');
        console.log('📊 Device info summary:', devicesWithInfo.map(d => ({
          name: d.name,
          hasDeviceInfo: !!d.deviceInfo,
          deviceInfo: d.deviceInfo ? 'Present' : 'None'
        })));
      } else {
        setDevices([]);
        console.log('📱 No employees found');
      }
    } catch (err) {
      console.error("Failed to load device info:", err);
      toast.error("Failed to load device information");
    } finally {
      setLoading(false);
    }
  };

  const triggerBackgroundCollection = async () => {
    let loadingToast: string | undefined;
    
    try {
      setRefreshing(true);
      loadingToast = toast.loading('Triggering background info collection...');
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      );
      
      // Call the test endpoint to trigger collection
      const fetchPromise = fetch('/api/test-background-info');
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Dismiss loading toast and show success
        if (loadingToast) toast.dismiss(loadingToast);
        toast.success('Background info collection completed!');
        console.log('✅ Background collection result:', result);
        
        // Reload device info
        await loadDeviceInfo();
      } else {
        // Dismiss loading toast and show error
        if (loadingToast) toast.dismiss(loadingToast);
        toast.error(`Failed to trigger background collection: ${result.error || 'Unknown error'}`);
        console.error('❌ Background collection failed:', result);
      }
    } catch (error) {
      // Dismiss loading toast and show error
      if (loadingToast) toast.dismiss(loadingToast);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Error triggering background collection: ${errorMessage}`);
      console.error('❌ Error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const refreshDeviceInfo = async () => {
    setRefreshing(true);
    await loadDeviceInfo();
    setRefreshing(false);
    toast.success("Device information refreshed");
  };

  const formatDeviceInfo = (device: any) => {
    if (!device.deviceInfo) return null;
    
    // Handle both deviceInfo and device_info structures
    const info = device.deviceInfo.device_info || device.deviceInfo;
    
    if (!info) return null;
    
    return {
      localIP: info.localIP || 'Unknown',
      publicIP: info.publicIP || 'Unknown',
      macAddress: info.macAddress || device.deviceInfo.mac_address || 'Unknown',
      hostname: info.hostname || device.deviceInfo.hostname || 'Unknown',
      os: info.os || 'Unknown',
      platform: info.platform || 'Unknown',
      arch: info.arch || 'Unknown',
      nodeVersion: info.nodeVersion || 'Unknown',
      networkInterfaces: info.networkInterfaces || [],
      userAgent: info.userAgent || 'Unknown',
      screenResolution: info.screenResolution || 'Unknown',
      timezone: info.timezone || 'Unknown',
      collectedAt: info.collectedAt || device.deviceInfo.last_seen || 'Unknown'
    };
  };

  const getOSIcon = (os: string) => {
    switch (os.toLowerCase()) {
      case 'windows':
        return <Monitor className="h-4 w-4 text-blue-600" />;
      case 'macos':
        return <Monitor className="h-4 w-4 text-gray-600" />;
      case 'linux':
        return <Monitor className="h-4 w-4 text-orange-600" />;
      default:
        return <Monitor className="h-4 w-4 text-gray-400" />;
    }
  };

  const getNetworkIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'wifi':
        return <Wifi className="h-4 w-4 text-green-600" />;
      case 'ethernet':
        return <Network className="h-4 w-4 text-blue-600" />;
      default:
        return <Network className="h-4 w-4 text-gray-400" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading device information...</p>
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
              <div className="p-2 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg">
                <Monitor className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Device Information
                </h1>
                <p className="text-sm text-gray-600">
                  Background information collection • {devices.length} devices tracked
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
              <Button 
                onClick={refreshDeviceInfo} 
                disabled={refreshing}
                variant="outline" 
                className="hover:bg-green-50 hover:border-green-200"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={triggerBackgroundCollection} disabled={refreshing} className="hover:bg-purple-50 hover:border-purple-200">
                <Activity className="h-4 w-4 mr-2" />
                Trigger Collection
              </Button>
              <Button variant="outline" onClick={logout} className="hover:bg-red-50 hover:border-red-200">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Device Information */}
      <div className="container mx-auto px-4 py-8">
        {devices.length === 0 && (
          <div className="text-center py-12">
            <Monitor className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-500 mb-4">
              Add employees first, then trigger background information collection
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/employees">
                <Button>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Employees
                </Button>
              </Link>
            </div>
          </div>
        )}

        {devices.length > 0 && devices.every(d => !d.deviceInfo) && (
          <div className="text-center py-12">
            <Monitor className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No device information collected yet</h3>
            <p className="text-gray-500 mb-4">
              Background information hasn't been collected for any employees. Click the button below to trigger collection.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={triggerBackgroundCollection} disabled={refreshing}>
                <Activity className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Trigger Collection
              </Button>
              <Button onClick={refreshDeviceInfo} disabled={refreshing} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        )}

        {devices.length > 0 && devices.some(d => d.deviceInfo) && (
          <div className="grid gap-6">
            {/* Success Banner */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-800 font-medium">Device Information Available</span>
              </div>
              <p className="text-green-600 text-sm mt-1">
                Background information has been collected for {devices.filter(d => d.deviceInfo).length} employee(s)
              </p>
            </div>
            
            {devices.map((device) => {
              const deviceInfo = formatDeviceInfo(device);
              
              return (
                <Card key={device.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          {deviceInfo ? getOSIcon(deviceInfo.os) : <Monitor className="h-6 w-6 text-gray-400" />}
                          {device.name} - {deviceInfo?.hostname || 'No device info'}
                        </CardTitle>
                        <p className="text-gray-600 mt-1">
                          {device.email} • Last seen: {device.deviceInfo?.last_seen ? new Date(device.deviceInfo.last_seen).toLocaleString() : 'Never'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {deviceInfo && (
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Device Info</div>
                            <div className="text-xs text-green-600">✓ Available</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {deviceInfo ? (
                      <div className="grid gap-4">
                        {/* Network Information */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <Network className="h-4 w-4" />
                            Network Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Local IP:</span>
                              <span className="font-mono">{deviceInfo.localIP}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Public IP:</span>
                              <span className="font-mono">{deviceInfo.publicIP}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">MAC Address:</span>
                              <span className="font-mono">{deviceInfo.macAddress}</span>
                            </div>
                          </div>
                        </div>

                        {/* System Information */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <HardDrive className="h-4 w-4" />
                            System Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">OS:</span>
                              <span>{deviceInfo.os}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Platform:</span>
                              <span>{deviceInfo.platform}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Architecture:</span>
                              <span>{deviceInfo.arch}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Node Version:</span>
                              <span>{deviceInfo.nodeVersion}</span>
                            </div>
                          </div>
                        </div>

                        {/* Additional Information */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Additional Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Screen Resolution:</span>
                              <span>{deviceInfo.screenResolution}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Timezone:</span>
                              <span>{deviceInfo.timezone}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Collected At:</span>
                              <span>{new Date(deviceInfo.collectedAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Network Interfaces */}
                        {deviceInfo.networkInterfaces && deviceInfo.networkInterfaces.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                              <Wifi className="h-4 w-4" />
                              Network Interfaces
                            </h4>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Interface</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>MAC</TableHead>
                                    <TableHead>Family</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {deviceInfo.networkInterfaces.map((iface: any, index: number) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-mono text-sm">{iface.name}</TableCell>
                                      <TableCell className="font-mono text-sm">{iface.address}</TableCell>
                                      <TableCell className="font-mono text-sm">{iface.mac}</TableCell>
                                      <TableCell className="text-sm">{iface.family}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Monitor className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No device information available for this employee</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Device info will be collected when the employee logs in
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 