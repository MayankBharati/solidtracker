import { NextRequest, NextResponse } from 'next/server';
import { database } from '@time-tracker/api';
import { collectAndLogBackgroundInfo } from '@time-tracker/api/background-info';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing background information collection...');
    
    // Test 1: Collect background info
    const deviceInfo = await collectAndLogBackgroundInfo();
    console.log('✅ Background info collected:', {
      localIP: deviceInfo.localIP,
      publicIP: deviceInfo.publicIP,
      macAddress: deviceInfo.macAddress,
      hostname: deviceInfo.hostname,
      os: deviceInfo.os
    });

    // Test 2: Get all employees
    const { data: employees, error: empError } = await database.getEmployees();
    if (empError) {
      console.error('❌ Error getting employees:', empError);
      return NextResponse.json({ error: 'Failed to get employees' }, { status: 500 });
    }

    console.log(`📋 Found ${employees?.length || 0} employees`);

    // Test 3: Store device info for each employee (for testing)
    const results = [];
    for (const employee of employees || []) {
      try {
        const result = await database.collectBackgroundInfo(employee.id);
        if (result.data) {
          results.push({
            employeeId: employee.id,
            employeeName: employee.name,
            success: true,
            deviceInfo: {
              localIP: result.data.localIP,
              publicIP: result.data.publicIP,
              macAddress: result.data.macAddress,
              hostname: result.data.hostname,
              os: result.data.os
            }
          });
        } else {
          results.push({
            employeeId: employee.id,
            employeeName: employee.name,
            success: false,
            error: result.error
          });
        }
      } catch (error) {
        results.push({
          employeeId: employee.id,
          employeeName: employee.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Test 4: Check if device_info column exists
    console.log('🔍 Checking database schema...');
    
    return NextResponse.json({
      success: true,
      message: 'Background info collection test completed',
      deviceInfo,
      employeesCount: employees?.length || 0,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 