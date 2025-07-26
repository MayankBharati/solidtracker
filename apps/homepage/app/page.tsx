"use client";

import { Button } from "@time-tracker/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@time-tracker/ui";
import { 
  Clock, 
  Users, 
  Shield, 
  Zap, 
  BarChart3, 
  Download, 
  ArrowRight, 
  CheckCircle,
  Monitor,
  Smartphone,
  Globe,
  Star,
  TrendingUp,
  Activity
} from "lucide-react";

export default function HomePage() {
  const features = [
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Real-time Tracking",
      description: "Monitor time and productivity in real-time with automatic screenshots"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Team Management",
      description: "Manage employees, projects, and tasks from a centralized dashboard"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & Private",
      description: "End-to-end encryption with secure data storage and privacy controls"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Native performance with instant startup and seamless synchronization"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Analytics & Reports",
      description: "Comprehensive reports and insights for better decision making"
    },
    {
      icon: <Activity className="h-6 w-6" />,
      title: "Productivity Monitoring",
      description: "Track application usage, websites visited, and productivity metrics"
    }
  ];

  const platforms = [
    {
      icon: <Monitor className="h-8 w-8" />,
      title: "Desktop App",
      description: "Windows, Mac, Linux support with offline capabilities",
      status: "Available"
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Web Portal",
      description: "Access from any browser, no installation required",
      status: "Available"
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "Mobile App",
      description: "iOS and Android apps for on-the-go tracking",
      status: "Coming Soon"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl mb-8">
              <Clock className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-6">
              SolidTracker
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Professional time tracking platform with admin dashboard, employee portal, 
              and desktop apps. Boost productivity with real-time monitoring.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => window.open('https://solidtracker-admin.vercel.app', '_blank')}
              >
                <Users className="h-5 w-5 mr-2" />
                Admin Dashboard
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 font-semibold px-8 py-4 text-lg rounded-xl transition-all duration-300"
                onClick={() => window.open('https://solidtracker-employee.vercel.app', '_blank')}
              >
                <Monitor className="h-5 w-5 mr-2" />
                Employee Portal
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Free for teams up to 5
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Setup in 5 minutes
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need for time tracking
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From simple time tracking to advanced productivity monitoring, 
              SolidTracker has all the features your team needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-600 rounded-2xl mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Available on all platforms
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Access SolidTracker from anywhere. Choose the platform that works best for your workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {platforms.map((platform, index) => (
              <Card key={index} className="border-0 bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-600 rounded-3xl mb-4">
                    {platform.icon}
                  </div>
                  <CardTitle className="text-xl font-bold">{platform.title}</CardTitle>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      platform.status === 'Available' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {platform.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 mb-4">{platform.description}</p>
                  {platform.status === 'Available' && (
                    <Button 
                      variant="outline" 
                      className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                      onClick={() => {
                        if (platform.title === 'Desktop App') {
                          window.open('https://solidtracker-admin.vercel.app/download', '_blank');
                        } else if (platform.title === 'Web Portal') {
                          window.open('https://solidtracker-employee.vercel.app', '_blank');
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {platform.title === 'Desktop App' ? 'Download' : 'Access'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-amber-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to boost your team's productivity?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Join thousands of teams using SolidTracker to improve time management 
            and increase productivity.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              variant="secondary"
              className="bg-white text-orange-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => window.open('https://solidtracker-admin.vercel.app', '_blank')}
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              Start Free Trial
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-orange-600 font-semibold px-8 py-4 text-lg rounded-xl transition-all duration-300"
              onClick={() => window.open('https://solidtracker-employee.vercel.app', '_blank')}
            >
              <Monitor className="h-5 w-5 mr-2" />
              Try Employee Portal
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="h-6 w-6 text-orange-500" />
            <span className="text-xl font-bold">SolidTracker</span>
          </div>
          <p className="text-gray-400 mb-6">
            Professional time tracking platform for modern teams
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            <span>© 2024 SolidTracker. All rights reserved.</span>
            <span>•</span>
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
} 