import { NextRequest, NextResponse } from 'next/server';
import { database } from '@time-tracker/api';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');
    const employeeId = searchParams.get('employee');

    if (!fileName || !employeeId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
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

    // Construct file path
    const desktopPath = path.resolve(process.cwd(), '../../apps/desktop');
    const filePath = path.join(desktopPath, 'dist', fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    const fileStats = fs.statSync(filePath);

    // Determine content type based on file extension
    let contentType = 'application/octet-stream';
    if (fileName.endsWith('.exe')) {
      contentType = 'application/vnd.microsoft.portable-executable';
    } else if (fileName.endsWith('.dmg')) {
      contentType = 'application/x-apple-diskimage';
    } else if (fileName.endsWith('.AppImage')) {
      contentType = 'application/x-executable';
    }

    // Create response with file
    const response = new NextResponse(fileBuffer);
    
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Length', fileStats.size.toString());
    response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return response;

  } catch (error) {
    console.error('Download file API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
