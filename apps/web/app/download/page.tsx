"use client";

import { useState, useEffect } from "react";
import { Button } from "@time-tracker/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@time-tracker/ui";
import { Download, Monitor, Apple, Zap, Shield, Users } from "lucide-react";

interface Platform {
  name: string;
  icon: React.ReactNode;
  downloadUrl: string;
  fileSize: string;
  supported: boolean;
  comingSoon?: boolean;
}

export default function DownloadPage() {
  const [detectedOS, setDetectedOS] = useState<string>("");

  useEffect(() => {
    // Detect user's operating system
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Win")) {
      setDetectedOS("Windows");
    } else if (userAgent.includes("Mac")) {
      setDetectedOS("macOS");
    } else if (userAgent.includes("Linux")) {
      setDetectedOS("Linux");
    }
  }, []);

  const platforms: Platform[] = [
    {
      name: "Windows",
      icon: <Monitor className="h-8 w-8" />,
      downloadUrl: "/api/download-app?platform=windows",
      fileSize: "77.7 MB",
      supported: true,
    },
    {
      name: "macOS",
      icon: <Apple className="h-8 w-8" />,
      downloadUrl: "/api/download-app?platform=mac",
      fileSize: "92 MB",
      supported: true,
    },
    {
      name: "Linux",
      icon: <Monitor className="h-8 w-8" />,
      downloadUrl: "/api/download-app?platform=linux",
      fileSize: "~80 MB",
      supported: false,
      comingSoon: true,
    },
  ];

  const handleDownload = (platform: Platform) => {
    if (!platform.supported) {
      alert(`${platform.name} version coming soon! Stay tuned for updates.`);
      return;
    }

    // Track download
    window.open(platform.downloadUrl, '_blank');
  };

  const getRecommendedPlatform = (): Platform => {
    const found = platforms.find(p => p.name === detectedOS);
    return found ? found : platforms[0]!;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl mb-6">
            <Download className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-4">
            Download SolidTracker
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Get the desktop app for seamless time tracking with automatic screenshots, 
            offline capabilities, and real-time synchronization.
          </p>
          
                     {detectedOS && (
             <div className="mb-8">
               {(() => {
                 const recommendedPlatform = getRecommendedPlatform();
                 return (
                   <>
                     <Button 
                       onClick={() => handleDownload(recommendedPlatform)}
                       className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                       disabled={!recommendedPlatform.supported}
                     >
                       <Download className="h-5 w-5 mr-2" />
                       Download for {detectedOS}
                       {recommendedPlatform.comingSoon && " (Coming Soon)"}
                     </Button>
                     <p className="text-sm text-gray-500 mt-2">
                       {recommendedPlatform.fileSize} • Free Download
                     </p>
                   </>
                 );
               })()}
             </div>
           )}
        </div>

        {/* Platform Downloads */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
          {platforms.map((platform) => (
            <Card key={platform.name} className="border-0 bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                  platform.supported 
                    ? 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {platform.icon}
                </div>
                <CardTitle className="text-xl font-bold">{platform.name}</CardTitle>
                <p className="text-sm text-gray-500">{platform.fileSize}</p>
              </CardHeader>
              <CardContent className="text-center">
                <Button
                  onClick={() => handleDownload(platform)}
                  variant={platform.supported ? "default" : "outline"}
                  className={`w-full ${
                    platform.supported 
                      ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                      : 'text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!platform.supported}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {platform.comingSoon ? "Coming Soon" : "Download"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* macOS Installation Instructions */}
        <Card className="max-w-4xl mx-auto border-0 bg-white/70 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center">
              <Apple className="h-6 w-6 mr-2 text-orange-600" />
              macOS Installation Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800 mb-3 font-medium">
                <strong>Important:</strong> Due to macOS security features, you may see an "app is damaged" warning. This is normal for unsigned apps.
              </p>
              <div className="text-sm text-gray-700 space-y-2">
                <p className="font-semibold">To install on macOS:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Download the DMG file</li>
                  <li>Double-click the DMG file to mount it</li>
                  <li>Drag SolidTracker.app to your Applications folder</li>
                  <li>If you see "app is damaged" warning:</li>
                  <li className="ml-4">• <strong>Method 1:</strong> Right-click on SolidTracker.app and select "Open"</li>
                  <li className="ml-4">• <strong>Method 2:</strong> Open Terminal and run: <code className="bg-gray-100 px-1 rounded">xattr -cr /Applications/SolidTracker.app</code></li>
                  <li>Click "Open" in the security dialog if prompted</li>
                  <li>The app will run normally after the first approval</li>
                </ol>
                <p className="text-xs text-gray-500 mt-3">
                  This happens because the app isn't code-signed by Apple, which is common for Electron apps. The app is safe to use.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl mb-4">
              <Zap className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-600 text-sm">
              Native desktop performance with instant startup and real-time tracking.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl mb-4">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
            <p className="text-gray-600 text-sm">
              End-to-end encryption with secure screenshot storage and data protection.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl mb-4">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Team Ready</h3>
            <p className="text-gray-600 text-sm">
              Perfect for teams with multi-user support and admin oversight.
            </p>
          </div>
        </div>

        {/* System Requirements */}
        <Card className="max-w-2xl mx-auto border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center">System Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Windows</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Windows 10/11</li>
                  <li>• 4 GB RAM</li>
                  <li>• 200 MB storage</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">macOS</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• macOS 10.15+</li>
                  <li>• 4 GB RAM</li>
                  <li>• 200 MB storage</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Linux</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Ubuntu 18.04+</li>
                  <li>• 4 GB RAM</li>
                  <li>• 200 MB storage</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Need help? Check our{" "}
            <a href="#" className="text-orange-600 hover:text-orange-700 font-semibold">
              installation guide
            </a>{" "}
            or{" "}
            <a href="#" className="text-orange-600 hover:text-orange-700 font-semibold">
              contact support
            </a>
          </p>
          <p className="text-sm text-gray-500">
            Version 1.0.0 • Updated today • Free for teams up to 5 members
          </p>
        </div>
      </div>
    </div>
  );
} 