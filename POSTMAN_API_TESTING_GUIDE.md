# Postman API Testing Guide

This guide covers all available API endpoints in your SolidTracker application for testing with Postman.

## Base URL
- **Development**: `http://localhost:3000`
- **Production**: Replace with your deployed URL

## Authentication
Most endpoints don't require authentication in the current implementation, but some may require environment variables to be set up properly.

## Environment Variables Required
Make sure these environment variables are set in your `.env.local` file:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `INSIGHTFUL_API_TOKEN` (for Insightful integration endpoints)
- `EMAIL_FROM` (for email endpoints)
- `SMTP_PASSWORD` (for email endpoints)
- `ORGANIZATION_ID`

---

## 1. EMPLOYEE ENDPOINTS

### 1.1 Get All Employees
- **Method**: GET
- **URL**: `{{baseUrl}}/api/v1/employee`
- **Description**: Fetches all employees in Insightful API format
- **Response**: Array of employee objects

### 1.2 Create Employee
- **Method**: POST
- **URL**: `{{baseUrl}}/api/v1/employee`
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "name": "John Doe",
  "teamsId": "team-123",
  "sharedSettingsId": "settings-456",
  "projects": ["project-1", "project-2"]
}
```

### 1.3 Get Employee by ID
- **Method**: GET
- **URL**: `{{baseUrl}}/api/v1/employee/{id}`
- **Description**: Replace `{id}` with actual employee ID

---

## 2. PROJECT ENDPOINTS

### 2.1 Get All Projects
- **Method**: GET
- **URL**: `{{baseUrl}}/api/v1/project`
- **Description**: Fetches all projects in Insightful API format

### 2.2 Get Project by ID
- **Method**: GET
- **URL**: `{{baseUrl}}/api/v1/project/{id}`
- **Description**: Replace `{id}` with actual project ID

---

## 3. TASK ENDPOINTS

### 3.1 Get All Tasks
- **Method**: GET
- **URL**: `{{baseUrl}}/api/v1/task`
- **Query Parameters**:
  - `projectId` (optional): Filter tasks by project ID

### 3.2 Get Task by ID
- **Method**: GET
- **URL**: `{{baseUrl}}/api/v1/task/{id}`
- **Description**: Replace `{id}` with actual task ID

---

## 4. TIME TRACKING ENDPOINTS

### 4.1 Get Time Entries (Windows)
- **Method**: GET
- **URL**: `{{baseUrl}}/api/v1/window`
- **Query Parameters**:
  - `employeeId` (optional): Filter by employee
  - `start` (optional): Start date timestamp
  - `end` (optional): End date timestamp

### 4.2 Insightful Time Tracking Operations
- **Method**: POST
- **URL**: `{{baseUrl}}/api/insightful/time-tracking`
- **Headers**: `Content-Type: application/json`

#### Start Time Entry:
```json
{
  "action": "start",
  "employeeId": "emp-123",
  "projectId": "proj-456",
  "taskId": "task-789"
}
```

#### Stop Time Entry:
```json
{
  "action": "stop",
  "timeEntryId": "entry-123"
}
```

#### Create Manual Time Entry:
```json
{
  "action": "manual",
  "employeeId": "emp-123",
  "projectId": "proj-456",
  "taskId": "task-789",
  "start": 1640995200000,
  "end": 1641000600000,
  "timezone": "America/New_York"
}
```

#### Fetch Time Entries:
```json
{
  "action": "fetch",
  "params": {
    "employeeId": "emp-123",
    "start": "2024-01-01",
    "end": "2024-01-31"
  }
}
```

---

## 5. SCREENSHOT ENDPOINTS

### 5.1 Get Screenshots
- **Method**: GET
- **URL**: `{{baseUrl}}/api/v1/screenshot`
- **Query Parameters** (required):
  - `start`: Start timestamp (milliseconds)
  - `end`: End timestamp (milliseconds)
- **Optional Parameters**:
  - `limit`: Number of results to return
  - `employeeId`: Filter by employee
  - `teamId`: Filter by team
  - `projectId`: Filter by project

**Example URL**: 
`{{baseUrl}}/api/v1/screenshot?start=1640995200000&end=1641081600000&limit=10&employeeId=emp-123`

### 5.2 Upload Screenshot
- **Method**: POST
- **URL**: `{{baseUrl}}/api/v1/screenshot`
- **Headers**: `Content-Type: multipart/form-data`
- **Body** (form-data):
  - `employeeId`: Text field with employee ID
  - `screenshot`: File field with image file
  - `metadata`: Text field with JSON metadata (optional)

---

## 6. INSIGHTFUL INTEGRATION ENDPOINTS

### 6.1 Sync Data to Insightful
- **Method**: POST
- **URL**: `{{baseUrl}}/api/insightful/sync`
- **Headers**: `Content-Type: application/json`

#### Sync Employee:
```json
{
  "type": "employee",
  "entityId": "emp-123"
}
```

#### Sync Project:
```json
{
  "type": "project",
  "entityId": "proj-456"
}
```

#### Sync All Employees:
```json
{
  "type": "all_employees"
}
```

#### Sync All Projects:
```json
{
  "type": "all_projects"
}
```

### 6.2 Get Sync Status
- **Method**: GET
- **URL**: `{{baseUrl}}/api/insightful/sync`
- **Query Parameters**:
  - `type` (optional): Filter by entity type
  - `id` (optional): Filter by entity ID

### 6.3 Test Insightful Connection
- **Method**: POST
- **URL**: `{{baseUrl}}/api/insightful/test`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "apiToken": "your-insightful-api-token"
}
```

---

## 7. SETTINGS ENDPOINTS

### 7.1 Get Insightful Settings
- **Method**: GET
- **URL**: `{{baseUrl}}/api/settings/insightful`

### 7.2 Update Insightful Settings
- **Method**: POST
- **URL**: `{{baseUrl}}/api/settings/insightful`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "apiToken": "your-api-token",
  "syncEnabled": true,
  "syncIntervalMinutes": 15,
  "organizationId": "org-123"
}
```

---

## 8. EMAIL ENDPOINTS

### 8.1 Send Email
- **Method**: POST
- **URL**: `{{baseUrl}}/api/send-email`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "to": "recipient@example.com",
  "subject": "Test Email",
  "html": "<h1>Hello World</h1><p>This is a test email.</p>",
  "name": "Test Sender"
}
```

### 8.2 Test Email Configuration
- **Method**: GET
- **URL**: `{{baseUrl}}/api/test-email`
- **Description**: Tests if email configuration is working

---

## 9. DOWNLOAD ENDPOINTS

### 9.1 Download Desktop App
- **Method**: GET
- **URL**: `{{baseUrl}}/api/download-app`
- **Query Parameters**:
  - `platform`: `windows` | `mac` | `linux`

**Example**: `{{baseUrl}}/api/download-app?platform=windows`

### 9.2 Get Download Info
- **Method**: POST
- **URL**: `{{baseUrl}}/api/download-app`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "platform": "windows"
}
```

---

## 10. DEBUG/TEST ENDPOINTS

### 10.1 Debug Device Info
- **Method**: GET
- **URL**: `{{baseUrl}}/api/debug-device-info`
- **Description**: Debugs device information for all employees

---

## Setting up Postman Environment

1. Create a new Postman Environment
2. Add variable `baseUrl` with value `http://localhost:3000`
3. Add any authentication tokens as environment variables

## Common Response Codes

- **200**: Success
- **201**: Created successfully
- **400**: Bad request (missing/invalid parameters)
- **401**: Unauthorized (invalid API token)
- **500**: Internal server error
- **503**: Service unavailable

## Testing Tips

1. **Start with GET endpoints** - they're easier to test and don't modify data
2. **Test email endpoints last** - they require proper SMTP configuration
3. **Use valid IDs** - many endpoints require existing entity IDs
4. **Check console logs** - the application logs detailed information for debugging
5. **Test Insightful integration carefully** - requires valid API token

## Sample Test Order

1. Test basic endpoints: `/api/v1/employee`, `/api/v1/project`, `/api/v1/task`
2. Test debug endpoint: `/api/debug-device-info`
3. Test email configuration: `/api/test-email`
4. Test settings: `/api/settings/insightful`
5. Test Insightful integration (if you have API token)
6. Test time tracking and screenshots (requires existing data)

Remember to start your development server with `npm run dev` before testing! 