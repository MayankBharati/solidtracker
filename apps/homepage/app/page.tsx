"use client";

import { Button } from "@time-tracker/ui";
import { Clock, Users, Monitor, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-20">
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
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 rounded-lg border border-gray-200 p-6">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Real-time Tracking</h3>
              <p className="text-gray-600">Monitor time and productivity in real-time with automatic screenshots</p>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 rounded-lg border border-gray-200 p-6">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Team Management</h3>
              <p className="text-gray-600">Manage employees, projects, and tasks from a centralized dashboard</p>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 rounded-lg border border-gray-200 p-6">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Secure & Private</h3>
              <p className="text-gray-600">End-to-end encryption with secure data storage and privacy controls</p>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="py-12 bg-gray-900 text-white mt-20">
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