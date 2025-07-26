# 🚀 SolidTracker Deployment Guide (Turbo Monorepo)

## 📁 **Monorepo Structure**

```
SolidTracker/ (Turbo monorepo)
├── package.json              # Root with turbo scripts
├── turbo.json                # Turbo configuration  
├── apps/
│   ├── web/                  # 🏢 Admin Dashboard (@time-tracker/web)
│   ├── desktop-web/          # 👨‍💻 Employee Interface (@time-tracker/desktop-web)
│   └── desktop/              # 💻 Electron Desktop App
└── packages/                 # 📦 Shared packages
```

## 🌐 **Your Current Dev Commands:**
- **Admin**: `npm run dev:web` (port 3000)
- **Employee**: `npm run dev:desktop` (port 3001)

---

## 🚀 **Step 1: Deploy Admin Dashboard** 

### **A. Create Vercel Project for Admin**
1. Go to [vercel.com](https://vercel.com) → **"Add New Project"**
2. Import: `MayankBharati/solidtracker`
3. **Configure:**
   - **Project Name**: `solidtracker-admin`
   - **Framework**: Next.js
   - **Root Directory**: `.` (root directory, NOT apps/web)
   - **Build Command**: `turbo run build --filter=@time-tracker/web`
   - **Output Directory**: `apps/web/.next`
   - **Install Command**: `npm install`
   - **Development Command**: `npm run dev:web`

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
   - **Root Directory**: `.` (root directory, NOT apps/desktop-web)
   - **Build Command**: `turbo run build --filter=@time-tracker/desktop-web`
   - **Output Directory**: `apps/desktop-web/.next`
   - **Install Command**: `npm install`
   - **Development Command**: `npm run dev:desktop`

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

### **A. Build Desktop Apps (Your Current Process)**
```bash
# You're already doing this from root:
cd apps/desktop
npm install
npm run build:win
# Output: dist/SolidTracker Setup 1.0.0.exe (77.7 MB)
```

### **B. Create GitHub Release**
1. **Go to**: https://github.com/MayankBharati/solidtracker/releases
2. **Click**: "Create a new release"
3. **Tag**: `v1.0.0`
4. **Title**: `SolidTracker v1.0.0 - Desktop Apps`
5. **Upload**: `SolidTracker-Setup-1.0.0.exe`
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

## 🔗 **Vercel Project Settings Summary**

### **🏢 Admin Dashboard Project:**
```bash
Repository: MayankBharati/solidtracker
Root Directory: . (root)
Build Command: turbo run build --filter=@time-tracker/web
Output Directory: apps/web/.next
Dev Command: npm run dev:web
```

### **👨‍💻 Employee Web Project:**
```bash
Repository: MayankBharati/solidtracker (same repo)
Root Directory: . (root)  
Build Command: turbo run build --filter=@time-tracker/desktop-web
Output Directory: apps/desktop-web/.next
Dev Command: npm run dev:desktop
```

---

## 🎯 **Key Differences from Standard Setup:**

✅ **Single Repository** - Both apps deploy from same repo  
✅ **Root Directory** - Both use root (not app subdirectories)  
✅ **Turbo Filtering** - Different build commands filter to specific apps  
✅ **Shared Dependencies** - npm install at root installs everything  
✅ **Monorepo Benefits** - Shared packages, consistent tooling  

---

## ✅ **Deployment Checklist**

- [ ] Create admin Vercel project (root + turbo filter web)
- [ ] Create employee Vercel project (root + turbo filter desktop-web)  
- [ ] Add environment variables to both projects
- [ ] Build Windows desktop app
- [ ] Create GitHub release with .exe file
- [ ] Update download URLs in admin app
- [ ] Test all deployments

## 🎉 **Final Result**
Your Turbo monorepo will deploy as:
1. **Admin**: `solidtracker-admin.vercel.app` (from turbo web filter)
2. **Employee**: `solidtracker-employee.vercel.app` (from turbo desktop filter)
3. **Desktop**: GitHub releases with .exe downloads

**Perfect setup for your `npm run dev:web` and `npm run dev:desktop` workflow! 🚀** 