# SolidTracker Release Preparation Guide

## 📦 Creating a GitHub Release with Desktop Apps

### Step 1: Build Desktop Apps

1. **Navigate to desktop app directory:**
   ```bash
   cd apps/desktop
   ```

2. **Build Windows App:**
   ```bash
   npm run build:win
   ```
   - Output: `dist/SolidTracker Setup 1.0.0.exe` (77.7 MB)

3. **Build Mac App (if on macOS):**
   ```bash
   npm run build:mac
   ```
   - Output: `dist/SolidTracker-1.0.0.dmg`

4. **Build Linux App (if on Linux):**
   ```bash
   npm run build:linux
   ```
   - Output: `dist/SolidTracker-1.0.0.AppImage`

### Step 2: Create GitHub Release

1. **Go to GitHub Repository:**
   - Visit: https://github.com/MayankBharati/solidtracker

2. **Create New Release:**
   - Click "Releases" → "Create a new release"
   - Tag version: `v1.0.0`
   - Release title: `SolidTracker v1.0.0 - Initial Release`

3. **Add Release Notes:**
   ```markdown
   # SolidTracker v1.0.0 🚀

   ## 🎉 First Official Release!

   ### ✨ Features
   - **Admin Dashboard** - Complete employee and project management
   - **Employee Time Tracking** - Desktop and web interfaces
   - **Screenshot Monitoring** - Automatic productivity tracking
   - **Real-time Sync** - Live updates across all devices
   - **Modern UI** - Beautiful orange theme with responsive design

   ### 📱 Desktop Apps
   - **Windows** - Full support with automatic screenshots
   - **macOS** - Coming soon in next release
   - **Linux** - Coming soon in next release

   ### 🛠️ System Requirements
   - **Windows**: Windows 10/11, 4GB RAM, 200MB storage
   - **Browser**: Chrome, Firefox, Safari, Edge (latest versions)
   - **Internet**: Required for real-time sync

   ### 🚀 Quick Start
   1. Download the desktop app for your platform
   2. Admin: Visit the web dashboard to set up projects
   3. Employees: Use desktop app or web interface for time tracking

   ### 📖 Documentation
   - [Setup Guide](https://github.com/MayankBharati/solidtracker#readme)
   - [Supabase Configuration](https://github.com/MayankBharati/solidtracker/blob/main/SUPABASE_SETUP.md)
   ```

4. **Upload Desktop App Files:**
   - Drag and drop: `SolidTracker Setup 1.0.0.exe`
   - Rename to: `SolidTracker-Setup-1.0.0.exe` (for consistency)
   - Add other platform files when available

5. **Publish Release:**
   - Click "Publish release"

### Step 3: Update Download URLs

After creating the release, update the download URLs in:

**File: `apps/web/app/api/download-app/route.ts`**

```typescript
const DESKTOP_APPS = {
  windows: {
    fileName: 'SolidTracker-Setup-1.0.0.exe',
    fileSize: '77.7 MB',
    supported: true,
    // Update this URL after creating the release
    downloadUrl: 'https://github.com/MayankBharati/solidtracker/releases/download/v1.0.0/SolidTracker-Setup-1.0.0.exe'
  },
  // ... other platforms
};
```

### Step 4: Test Downloads

1. **Visit your deployed site:** `https://yourapp.vercel.app/download`
2. **Test Windows download** - should redirect to GitHub release
3. **Verify file downloads correctly**
4. **Test installation on clean Windows machine**

## 🔧 Automation (Optional)

For future releases, consider using GitHub Actions to automatically build and upload desktop apps:

```yaml
# .github/workflows/release.yml
name: Build and Release Desktop Apps

on:
  release:
    types: [created]

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd apps/desktop
          npm install
      
      - name: Build desktop app
        run: |
          cd apps/desktop
          npm run build
      
      - name: Upload Release Assets
        uses: actions/upload-release-asset@v1
        # ... upload logic
```

## 📝 Notes

- **File Size Limits**: GitHub releases support files up to 2GB
- **Download Analytics**: GitHub provides basic download statistics
- **CDN**: Files are served via GitHub's CDN for fast downloads
- **Security**: Files are scanned by GitHub's security systems 