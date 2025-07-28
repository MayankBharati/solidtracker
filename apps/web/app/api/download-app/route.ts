import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Desktop app download information
const DESKTOP_APPS = {
  windows: {
    fileName: 'SolidTracker-Setup-1.3.0.exe',
    fileSize: '74 MB',
    supported: true,
    downloadUrl: 'https://github.com/MayankBharati/solidtracker/releases/download/v1.3.0/SolidTracker-Setup-1.3.0.exe'
  },
  mac: {
    fileName: 'SolidTracker-1.3.0-arm64.dmg',
    fileSize: '92 MB',
    supported: true,
    downloadUrl: 'https://github.com/MayankBharati/solidtracker/releases/download/v1.3.0/SolidTracker-1.3.0-arm64.dmg',
    installationInstructions: [
      '1. Download the DMG file',
      '2. Double-click the DMG file to mount it',
      '3. Drag SolidTracker.app to your Applications folder',
      '4. If you see "app is damaged" warning:',
      '   • Right-click on SolidTracker.app and select "Open"',
      '   • OR: Open Terminal and run: xattr -cr /Applications/SolidTracker.app',
      '5. Click "Open" in the security dialog if prompted',
      '6. The app will run normally after the first approval'
    ]
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
