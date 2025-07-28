# SolidTracker Setup Guide

This guide will help you set up and run the SolidTracker project with all its components: web, desktop-web, and desktop applications.

## Prerequisites

1. Node.js v18+ and npm
2. Supabase account (free tier is fine)
3. Insightful API account (for time tracking integration)
4. Email service credentials (for sending activation emails)

## Step 1: Environment Setup

1. Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Insightful API Configuration (OPTIONAL - for API integration)
INSIGHTFUL_API_TOKEN=your-insightful-bearer-token
NEXT_PUBLIC_INSIGHTFUL_API_TOKEN=your-insightful-bearer-token

# Email Configuration (REQUIRED for employee activation)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM=noreply@yourdomain.com

# Application Configuration
NEXT_PUBLIC_APP_NAME=SolidTracker
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
```

2. Copy the same `.env` file to:
   - `apps/web/.env`
   - `apps/desktop-web/.env`
   - `apps/desktop/.env`

## Step 2: Supabase Setup

1. Create a new Supabase project at https://supabase.com

2. Run the database migrations in order:
   ```sql
   -- Run these in your Supabase SQL editor
   -- 1. Main schema
   supabase/schema.sql
   
   -- 2. Safe schema (if needed)
   supabase/schema-safe.sql
   
   -- 3. Background info schema
   supabase/background-info-schema.sql
   
   -- 4. Teams integration
   supabase/teams-integration.sql
   
   -- 5. Insightful integration
   supabase/insightful-integration.sql
   
   -- 6. Create storage bucket
   supabase/create-supabase-bucket.sql
   ```

3. Create a storage bucket named "screenshots" in Supabase Storage

## Step 3: Install Dependencies

```bash
# Install all dependencies
npm install

# If you encounter issues, try:
npm install --legacy-peer-deps
```

## Step 4: Running the Applications

### Development Mode (Recommended for testing)

```bash
# Run all apps in development mode
npm run dev

# Or run individual apps:
# Web app (admin dashboard)
npm run dev --workspace=@time-tracker/web

# Desktop web app (employee dashboard)
npm run dev --workspace=@time-tracker/desktop-web

# Desktop app (Electron)
npm run dev --workspace=desktop
```

### Production Build

```bash
# Build all apps
npm run build

# Or build individual apps:
npm run build --workspace=@time-tracker/web
npm run build --workspace=@time-tracker/desktop-web
npm run build:electron --workspace=desktop
```

## Step 5: Accessing the Applications

- **Web App (Admin)**: http://localhost:3000
- **Desktop Web (Employee)**: http://localhost:3001
- **Desktop App**: Run from `apps/desktop/dist/`

## Step 6: Initial Setup in the App

1. **Create an Admin Account**:
   - Go to http://localhost:3000/login
   - Sign up with your email
   - Check Supabase Auth for the user

2. **Add Admin to Database**:
   ```sql
   INSERT INTO admins (email, name, created_at, updated_at)
   VALUES ('your-email@example.com', 'Admin Name', NOW(), NOW());
   ```

3. **Configure Insightful Integration** (Optional):
   - Navigate to Settings → Insightful
   - Enter your API token
   - Test the connection
   - Enable sync

## Common Issues and Solutions

### 1. Missing Environment Variables
**Error**: "Failed to create Supabase client - missing environment variables"
**Solution**: Ensure `.env` file exists in the root and all app directories with correct values

### 2. Build Errors
**Error**: TypeScript compilation errors
**Solution**: 
```bash
# Clear cache and rebuild
npm run clean
npm install
npm run build
```

### 3. Database Connection Issues
**Error**: "Failed to fetch" or database errors
**Solution**: 
- Verify Supabase URL and keys are correct
- Check if tables are created properly
- Ensure RLS policies are disabled or configured

### 4. Email Sending Issues
**Error**: "Failed to send activation email"
**Solution**:
- For Gmail: Use app-specific password, not regular password
- Enable "Less secure app access" or use OAuth2
- Check SMTP settings match your provider

### 5. Desktop App Not Building
**Error**: Electron build fails
**Solution**:
```bash
cd apps/desktop
npm install electron-builder --save-dev
npm run build:electron
```

## Development Tips

1. **Hot Reload**: All Next.js apps support hot reload in development mode
2. **Database Changes**: After schema changes, restart the dev server
3. **Environment Variables**: Changes to `.env` require server restart
4. **Debugging**: Use Chrome DevTools for web apps and Electron DevTools for desktop

## Production Deployment

### Web Apps (Vercel)
1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy with automatic builds

### Desktop App
1. Build for your platform:
   ```bash
   npm run build:win    # Windows
   npm run build:mac    # macOS
   npm run build:linux  # Linux
   ```
2. Distribute the installer from `apps/desktop/dist/`

## Testing the Integration

1. **Employee Management**:
   - Add an employee
   - Send activation email
   - Activate account
   - Sync to Insightful (if configured)

2. **Time Tracking**:
   - Start timer in desktop app
   - Verify time entries in database
   - Check screenshots are captured

3. **Project Management**:
   - Create projects
   - Assign employees
   - Track time against projects

## Support

For issues:
1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure database migrations ran successfully
4. Check Supabase logs for API errors

## Security Notes

- Never commit `.env` files to version control
- Use strong passwords for all accounts
- Rotate API tokens regularly
- Enable RLS policies in production
- Use HTTPS in production environments 