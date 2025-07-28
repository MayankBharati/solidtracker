# Insightful API Integration Guide

## Overview

SolidTracker now includes full integration with the Insightful API, enabling seamless synchronization of employee time tracking, project management, and screenshot monitoring between your local system and Insightful's platform.

## Features

### ✅ Implemented APIs

1. **Employee API**
   - Create new employees in Insightful
   - Update employee information
   - Deactivate/activate employees
   - Sync employee data between local and Insightful

2. **Project API**
   - Create and manage projects
   - Assign employees to projects
   - Archive/unarchive projects
   - Update project settings including screenshot preferences

3. **Task API**
   - Automatic 1:1 task creation for each project (as recommended)
   - Assign employees to tasks
   - Update task information

4. **Time Tracking API** (Most Important)
   - Create manual time entries
   - Sync time tracking data
   - Query time entries with filters
   - Support for timezone handling

5. **Screenshots API**
   - Upload screenshots with metadata
   - Include permission flags (macOS screen recording permissions)
   - Associate screenshots with time entries and projects
   - Query screenshots with various filters

## Setup Instructions

### 1. Environment Configuration

Add the following environment variables to your `.env` file:

```env
# Insightful API Configuration
INSIGHTFUL_API_TOKEN=your-insightful-api-bearer-token
NEXT_PUBLIC_INSIGHTFUL_API_TOKEN=your-insightful-api-bearer-token

# Optional: Feature flags
INSIGHTFUL_SYNC_ENABLED=true
INSIGHTFUL_SYNC_INTERVAL_MINUTES=15
INSIGHTFUL_ORGANIZATION_ID=your-organization-id
```

### 2. Database Migration

Run the Insightful integration SQL migration to add necessary columns:

```bash
# Apply the migration to your Supabase database
psql -U postgres -d your_database -f supabase/insightful-integration.sql
```

This adds:
- `insightful_id` columns to employees, projects, and tasks tables
- `synced_to_insightful` flags for time entries and screenshots
- Sync log table for tracking operations
- Settings table for API configuration

### 3. Obtaining Insightful API Token

1. Log in as an Admin to your Insightful account
2. Navigate to the API page
3. Click "Create a new Token"
4. Name your token (e.g., "SolidTracker Integration")
5. Generate the token and copy it immediately (shown only once)
6. Store it securely in your environment variables

### 4. Initial Configuration

1. Navigate to `/settings/insightful` in your web app
2. Enter your API token
3. Test the connection
4. Enable automatic sync if desired
5. Click "Sync All Data" for initial synchronization

## Usage

### Web Application

#### Settings Page (`/settings/insightful`)
- Configure API token and sync preferences
- Test API connection
- View sync status
- Manually trigger full synchronization

#### Employee Management
- Each employee row has a "Sync" button
- Click to sync individual employees to Insightful
- Status indicators show sync progress

#### Project Management
- Projects automatically sync when created/updated
- Default tasks are created for each project (1:1 mapping)
- Employee assignments sync automatically

### Desktop Application

The desktop app automatically syncs screenshots when:
1. Insightful sync is enabled in settings
2. Valid API token is configured
3. Employee is actively tracking time

Screenshots include:
- Employee ID
- Project/Task association (if tracking)
- System permissions status
- Timestamp information

### API Endpoints

#### Sync Endpoint
```
POST /api/insightful/sync
Body: {
  type: "employee" | "project" | "time_entry" | "screenshot" | "all_employees" | "all_projects",
  entityId?: string // Required for individual entity sync
}
```

#### Time Tracking Endpoint
```
POST /api/insightful/time-tracking
Body: {
  action: "start" | "stop" | "manual" | "fetch",
  // Additional fields based on action
}
```

#### Settings Endpoint
```
GET /api/settings/insightful - Get current settings
POST /api/settings/insightful - Update settings
```

#### Test Connection Endpoint
```
POST /api/insightful/test
Body: {
  apiToken: string
}
```

## Architecture

### Client Module (`insightful-client.ts`)
- Direct API wrapper for Insightful endpoints
- Type-safe interfaces for all API models
- Automatic rate limit handling (200 req/min)
- Bearer token authentication

### Integration Module (`insightful-integration.ts`)
- Bridges local Supabase data with Insightful API
- Handles data transformation and mapping
- Manages sync operations and error handling
- Tracks sync status in database

### Key Features

1. **Automatic Sync**
   - Configurable sync intervals
   - Background synchronization
   - Error recovery and retry logic

2. **Manual Sync**
   - Individual entity sync
   - Bulk sync operations
   - Real-time sync status

3. **Data Integrity**
   - Local IDs mapped to Insightful IDs
   - Sync status tracking
   - Comprehensive error logging

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Verify API token is correct
   - Check token hasn't expired
   - Ensure admin privileges

2. **429 Rate Limit**
   - Reduce sync frequency
   - Implement request queuing
   - Max 200 requests/minute

3. **Sync Failures**
   - Check sync logs in database
   - Verify entity relationships
   - Ensure all dependencies synced first

### Debug Tools

1. Check sync logs:
```sql
SELECT * FROM insightful_sync_log 
ORDER BY created_at DESC 
LIMIT 50;
```

2. Verify entity mappings:
```sql
SELECT id, name, insightful_id 
FROM employees 
WHERE insightful_id IS NOT NULL;
```

3. Monitor API calls in browser DevTools Network tab

## Best Practices

1. **Initial Setup**
   - Sync employees first
   - Then sync projects
   - Tasks auto-create with projects
   - Finally sync time entries

2. **Ongoing Usage**
   - Enable automatic sync for real-time updates
   - Use manual sync for immediate needs
   - Monitor sync logs regularly
   - Keep API token secure

3. **Performance**
   - Batch operations when possible
   - Use appropriate sync intervals
   - Monitor rate limits
   - Cache frequently accessed data

## Security Considerations

1. **API Token Storage**
   - Never commit tokens to version control
   - Use environment variables
   - Rotate tokens periodically
   - Limit token permissions if possible

2. **Data Privacy**
   - Screenshots may contain sensitive information
   - Ensure proper access controls
   - Consider data retention policies
   - Comply with privacy regulations

## Future Enhancements

1. **Webhook Support**
   - Real-time updates from Insightful
   - Reduced API polling
   - Better sync efficiency

2. **Advanced Analytics**
   - Productivity scoring integration
   - Custom report generation
   - Team performance metrics

3. **Mobile App Support**
   - Extend integration to mobile
   - Offline sync capabilities
   - Push notifications

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review API logs and sync status
3. Consult Insightful API documentation
4. Contact support with detailed error logs 