import { NextRequest, NextResponse } from 'next/server';
import { database } from '@time-tracker/api';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { employeeId } = await request.json();

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    // Verify that the employee exists and is active
    const { data: employees, error } = await database.getEmployees();
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to verify employee' }, { status: 500 });
    }

    const employee = employees?.find(emp => emp.id === employeeId);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    if (employee.status !== 'active') {
      return NextResponse.json({ error: 'Employee account is not activated' }, { status: 403 });
    }

    // Determine the platform and file extension
    const userAgent = request.headers.get('user-agent') || '';
    let platform = 'win';
    let fileExtension = '.exe';
    
    if (userAgent.includes('Mac')) {
      platform = 'mac';
      fileExtension = '.dmg';
    } else if (userAgent.includes('Linux')) {
      platform = 'linux';
      fileExtension = '.AppImage';
    }

    // Check if the build already exists
    const desktopPath = path.resolve(process.cwd(), '../../apps/desktop');
    const distPath = path.join(desktopPath, 'dist');
    
    // Look for existing build files
    let buildFile = null;
    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(distPath);
      buildFile = files.find(file => file.endsWith(fileExtension));
    }

    if (!buildFile) {
      // Build doesn't exist, create one
      console.log(`Building Electron app for ${platform}...`);
      
      try {
        // Change to desktop directory and build
        process.chdir(desktopPath);
        
        // Install dependencies if needed
        if (!fs.existsSync(path.join(desktopPath, 'node_modules'))) {
          execSync('npm install', { stdio: 'inherit' });
        }
        
        // Build the app
        execSync(`npm run build:${platform}`, { stdio: 'inherit' });
        
        // Check for the built file again
        if (fs.existsSync(distPath)) {
          const files = fs.readdirSync(distPath);
          buildFile = files.find(file => file.endsWith(fileExtension));
        }
        
        if (!buildFile) {
          throw new Error('Build file not found after building');
        }
        
      } catch (error) {
        console.error('Build failed:', error);
        return NextResponse.json({ 
          error: 'Failed to build application', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
      }
    }

    // Create download URL
    const downloadUrl = `/api/download-file?file=${encodeURIComponent(buildFile)}&employee=${employeeId}`;
    
    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName: buildFile,
      platform,
      message: 'App is ready for download'
    });

  } catch (error) {
    console.error('Download app API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
