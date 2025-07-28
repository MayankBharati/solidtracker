import { NextRequest, NextResponse } from 'next/server';
import { database } from '@time-tracker/api';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging device info...');
    
    // Test 1: Get all employees
    const { data: employees, error: empError } = await database.getEmployees();
    console.log('📋 Employees:', employees?.length || 0);
    
    if (empError) {
      console.error('❌ Employee error:', empError);
      return NextResponse.json({ error: 'Failed to get employees', details: empError }, { status: 500 });
    }

    // Test 2: Get device info for each employee
    const deviceResults = [];
    for (const employee of employees || []) {
      try {
        const deviceResult = await database.getDeviceInfo(employee.id);
        deviceResults.push({
          employeeId: employee.id,
          employeeName: employee.name,
          employeeEmail: employee.email,
          deviceInfo: deviceResult.data,
          deviceError: deviceResult.error,
          hasDeviceInfo: !!deviceResult.data,
          deviceInfoKeys: deviceResult.data ? Object.keys(deviceResult.data) : []
        });
      } catch (error) {
        deviceResults.push({
          employeeId: employee.id,
          employeeName: employee.name,
          employeeEmail: employee.email,
          deviceInfo: null,
          deviceError: error instanceof Error ? error.message : 'Unknown error',
          hasDeviceInfo: false,
          deviceInfoKeys: []
        });
      }
    }

    // Test 3: Check database structure
    console.log('📊 Device info summary:', deviceResults.map(d => ({
      name: d.employeeName,
      hasDeviceInfo: d.hasDeviceInfo,
      deviceInfoKeys: d.deviceInfoKeys
    })));

    return NextResponse.json({
      success: true,
      message: 'Device info debug completed',
      employeesCount: employees?.length || 0,
      deviceResults,
      summary: {
        totalEmployees: employees?.length || 0,
        employeesWithDeviceInfo: deviceResults.filter(d => d.hasDeviceInfo).length,
        employeesWithoutDeviceInfo: deviceResults.filter(d => !d.hasDeviceInfo).length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Debug failed:', error);
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 