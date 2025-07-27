import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Desktop app download information
const DESKTOP_APPS = {
  windows: {
    fileName: 'SolidTracker-Setup-1.3.0.exe',
    fileSize: '85.2 MB',
    supported: true,
    downloadUrl: 'https://github.com/MayankBharati/solidtracker/releases/download/v1.3.0/SolidTracker-Setup-1.3.0.exe'
  },
  mac: {
    fileName: 'SolidTracker-1.3.0-arm64-mac.zip',
    fileSize: '229 MB',
    supported: true,
    downloadUrl: 'https://github.com/MayankBharati/solidtracker/releases/download/v1.3.1/SolidTracker-1.3.0-arm64-mac.zip'
  },
  linux: {
    fileName: 'SolidTracker.1.2.0.AppImage', 
    fileSize: '~80 MB',
    supported: false,
    downloadUrl: 'https://github.com/MayankBharati/solidtracker/releases/download/v1.2.0/SolidTracker.1.2.0.AppImage'
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') || 'windows';
    
    // Validate platform
    if (!DESKTOP_APPS[platform as keyof typeof DESKTOP_APPS]) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    const appInfo = DESKTOP_APPS[platform as keyof typeof DESKTOP_APPS];

    // Check if platform is supported
    if (!appInfo.supported) {
      return NextResponse.json({ 
        error: 'Platform not supported yet',
        message: `${platform} version is coming soon!`,
        supported: false
      }, { status: 404 });
    }

    // For now, redirect to the download URL
    if (appInfo.downloadUrl) {
      // Log the download for analytics
      console.log(`Download requested: ${platform} - ${appInfo.fileName}`);
      
      // For production, you might want to:
      // 1. Track downloads in database
      // 2. Serve files from cloud storage (AWS S3, etc.)
      // 3. Add authentication if needed
      
      return NextResponse.redirect(appInfo.downloadUrl);
    }

    // If no download URL is available
    return NextResponse.json({
      error: 'Download not available',
      message: 'Desktop app is currently being prepared. Please try again later.',
      appInfo: {
        fileName: appInfo.fileName,
        fileSize: appInfo.fileSize,
        platform: platform
      }
    }, { status: 503 });

  } catch (error) {
    console.error('Download app API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Alternative endpoint to get download information without triggering download
export async function POST(request: NextRequest) {
  try {
    const { platform } = await request.json();
    
    if (!platform || !DESKTOP_APPS[platform as keyof typeof DESKTOP_APPS]) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    const appInfo = DESKTOP_APPS[platform as keyof typeof DESKTOP_APPS];
    
    return NextResponse.json({
      success: true,
      platform,
      ...appInfo,
      downloadEndpoint: `/api/download-app?platform=${platform}`
    });

  } catch (error) {
    console.error('Download app info API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
