# 🚀 SolidTracker Deployment Guide

## 📁 **Monorepo Structure**

```
SolidTracker/
├── apps/
│   ├── web/              # 🏢 Admin Dashboard (Managers/HR)
│   ├── desktop-web/      # 👨‍💻 Employee Interface (Web version)
│   └── desktop/          # 💻 Electron Desktop App
└── packages/             # 📦 Shared packages
```

## 🌐 **Three Separate Deployments**

### **1. 🏢 Admin Dashboard** (`apps/web`)
- **Purpose**: Admin portal for managers to track employees
- **Features**: Employee management, project oversight, reports
- **Deploy to**: `solidtracker-admin.vercel.app`

### **2. 👨‍💻 Employee Web App** (`apps/desktop-web`) 
- **Purpose**: Web interface for employees to track time
- **Features**: Time tracking, task management, screenshots
- **Deploy to**: `solidtracker-employee.vercel.app`

### **3. 💻 Desktop App** (`apps/desktop`)
- **Purpose**: Electron app for offline time tracking
- **Features**: Same as web app + offline support
- **Deploy to**: GitHub Releases (downloadable .exe/.dmg/.AppImage)

---

## 🚀 **Step 1: Deploy Admin Dashboard** 

### **A. Create New Vercel Project**
1. Go to [vercel.com](https://vercel.com) → **"Add New Project"**
2. Import: `MayankBharati/solidtracker`
3. **Configure:**
   - **Project Name**: `solidtracker-admin`
   - **Framework**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### **B. Environment Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://solidtracker-admin.vercel.app
EMAIL_FROM=admin@yourcompany.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### **C. Deploy**
- Click **"Deploy"** → Wait ~3 minutes
- **Result**: `https://solidtracker-admin.vercel.app`

---

## 👨‍💻 **Step 2: Deploy Employee Web App**

### **A. Create Second Vercel Project**
1. Go to Vercel → **"Add New Project"**
2. Import: `MayankBharati/solidtracker` (same repo!)
3. **Configure:**
   - **Project Name**: `solidtracker-employee`
   - **Framework**: Next.js
   - **Root Directory**: `apps/desktop-web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `out` (this app uses static export)
   - **Install Command**: `npm install`

### **B. Environment Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://solidtracker-employee.vercel.app
```

### **C. Deploy**
- Click **"Deploy"** → Wait ~3 minutes  
- **Result**: `https://solidtracker-employee.vercel.app`

---

## 💻 **Step 3: Build & Release Desktop App**

### **A. Build Desktop Apps**
```bash
# Navigate to project
cd apps/desktop

# Install dependencies
npm install

# Build Windows version
npm run build:win
# Output: dist/SolidTracker Setup 1.0.0.exe (77.7 MB)

# Build Mac version (if on macOS)
npm run build:mac
# Output: dist/SolidTracker-1.0.0.dmg

# Build Linux version (if on Linux)  
npm run build:linux
# Output: dist/SolidTracker-1.0.0.AppImage
```

### **B. Create GitHub Release**
1. **Go to**: https://github.com/MayankBharati/solidtracker/releases
2. **Click**: "Create a new release"
3. **Tag**: `v1.0.0`
4. **Title**: `SolidTracker v1.0.0 - Desktop Apps`
5. **Upload Files**:
   - `SolidTracker-Setup-1.0.0.exe` (Windows)
   - `SolidTracker-1.0.0.dmg` (Mac - when ready)
   - `SolidTracker-1.0.0.AppImage` (Linux - when ready)
6. **Publish Release**

### **C. Update Download URLs**
After creating the release, update the download links in the admin app:

**File: `apps/web/app/api/download-app/route.ts`**
```typescript
const DESKTOP_APPS = {
  windows: {
    fileName: 'SolidTracker-Setup-1.0.0.exe',
    fileSize: '77.7 MB',
    supported: true,
    downloadUrl: 'https://github.com/MayankBharati/solidtracker/releases/download/v1.0.0/SolidTracker-Setup-1.0.0.exe'
  },
  // ... mac and linux coming soon
};
```

---

## 🔗 **Final Architecture**

### **🌐 Live URLs:**
- **Admin Dashboard**: `https://solidtracker-admin.vercel.app`
  - Managers login here
  - Employee management, project oversight
  - Download page for desktop apps

- **Employee Web App**: `https://solidtracker-employee.vercel.app`  
  - Employees can use this directly in browser
  - Same features as desktop app
  - No installation required

- **Desktop Downloads**: Available from admin dashboard
  - Windows: Direct download from GitHub
  - Mac/Linux: Coming soon placeholders

### **🎯 User Flows:**

**For Managers:**
1. Visit: `solidtracker-admin.vercel.app`
2. Login → Dashboard → Manage employees & projects
3. Download desktop apps for employees

**For Employees (Option 1 - Web):**
1. Visit: `solidtracker-employee.vercel.app` 
2. Login → Start time tracking directly in browser

**For Employees (Option 2 - Desktop):**
1. Download .exe from admin dashboard
2. Install → Login → Offline time tracking with screenshots

---

## ✅ **Deployment Checklist**

- [ ] Deploy admin dashboard to Vercel
- [ ] Deploy employee web app to Vercel  
- [ ] Build Windows desktop app
- [ ] Create GitHub release with .exe file
- [ ] Update download URLs in admin app
- [ ] Test all three deployments
- [ ] Update DNS (optional custom domains)

## 🔧 **Environment Variables Reference**

### **Required for Both Web Apps:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### **Additional for Admin App:**
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
EMAIL_FROM=admin@yourcompany.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
```

## 🎉 **Result**
Three fully functional deployments:
1. **Admin dashboard** for managers
2. **Employee web app** for browser-based tracking  
3. **Desktop app downloads** for offline usage

**All connected to the same Supabase backend for real-time sync! 🚀** 