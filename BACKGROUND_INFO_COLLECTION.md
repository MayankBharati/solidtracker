# 🔍 Background Information Collection

## Overview

SolidTracker now includes comprehensive background information collection capabilities that gather device and network information from employee devices. This feature provides administrators with detailed insights into the devices being used for time tracking.

## 🎯 What Information is Collected

### Network Information
- **Local IP Address**: Internal network IP address of the device
- **Public IP Address**: External IP address (when available)
- **MAC Address**: Unique hardware identifier
- **Network Interfaces**: All network adapters and their configurations

### Device Information
- **Hostname**: Computer/device name
- **Operating System**: Windows, macOS, Linux, etc.
- **Platform**: win32, darwin, linux, etc.
- **Architecture**: x64, arm64, etc.
- **Node Version**: Runtime environment version

### Browser Information (Web App)
- **User Agent**: Browser and version information
- **Screen Resolution**: Display dimensions
- **Timezone**: User's timezone setting

### Collection Metadata
- **Collection Timestamp**: When the information was gathered
- **Last Seen**: When the device was last active

## 🏗️ Architecture

### Desktop Application (Electron)
```typescript
// Uses Node.js APIs for comprehensive system access
class NodeBackgroundInfoCollector {
  getLocalIP(): string           // os.networkInterfaces()
  getMACAddress(): string        // os.networkInterfaces()
  getPublicIP(): Promise<string> // External API calls
  getSystemInfo(): SystemInfo    // os.type(), os.platform(), etc.
}
```

### Web Application (Browser)
```typescript
// Uses browser APIs and WebRTC for limited system access
class BrowserBackgroundInfoCollector {
  getLocalIP(): string           // WebRTC STUN servers
  getMACAddress(): string        // Device fingerprinting
  getPublicIP(): Promise<string> // External API calls
  getSystemInfo(): SystemInfo    // navigator.userAgent parsing
}
```

## 🚀 Implementation Details

### Database Schema
```sql
-- Enhanced devices table with device_info JSONB column
ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_info JSONB;

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_devices_device_info ON devices USING GIN (device_info);
```

### API Functions
```typescript
// Collect and store background information
database.collectBackgroundInfo(employeeId: string)

// Retrieve device information
database.getDeviceInfo(employeeId: string)

// Update device information
database.updateDeviceInfo(employeeId: string, deviceInfo: Partial<DeviceInfo>)
```

### IPC Communication (Desktop)
```typescript
// Main process handlers
ipcMain.handle('collect-background-info', async () => {
  // Collect device information using Node.js APIs
})

ipcMain.handle('store-device-info', async (event, { employeeId, deviceInfo }) => {
  // Store device information locally and remotely
})
```

## 📱 Usage

### Automatic Collection
Background information is automatically collected when:
1. Employee logs into the desktop application
2. Employee logs into the web application
3. Application starts up (desktop app)

### Manual Collection
Administrators can trigger collection via:
- Device Info page refresh button
- API endpoints
- Desktop app IPC calls

### Viewing Collected Information
Visit `/device-info` in the admin portal to view:
- All employee devices
- Network configurations
- System specifications
- Collection timestamps

## 🔒 Privacy & Security

### Data Protection
- **Local Storage**: Device info stored locally in desktop app
- **Encrypted Transmission**: All data transmitted over HTTPS
- **Minimal Collection**: Only essential device information
- **User Consent**: Collection happens after user authentication

### Compliance
- **GDPR**: Data collection is transparent and minimal
- **Data Retention**: Device info retained only while employee is active
- **Access Control**: Only administrators can view device information

## 🌐 Network Detection Services

### Public IP Detection
The system uses multiple fallback services:
1. `https://api.ipify.org?format=json`
2. `https://api.myip.com`
3. `https://ipapi.co/json`
4. `https://httpbin.org/ip`

### Local IP Detection
- **Desktop**: Direct OS API access
- **Web**: WebRTC STUN server queries

## 📊 Data Structure

### DeviceInfo Interface
```typescript
interface DeviceInfo {
  // Network Information
  localIP: string;
  publicIP?: string;
  macAddress: string;
  hostname: string;
  
  // Device Information
  os: string;
  platform: string;
  arch: string;
  nodeVersion: string;
  
  // Network Details
  networkInterfaces: NetworkInterface[];
  
  // Browser Information (web only)
  userAgent?: string;
  screenResolution?: string;
  timezone?: string;
  
  // Metadata
  collectedAt: string;
}
```

### NetworkInterface Interface
```typescript
interface NetworkInterface {
  name: string;        // Interface name (e.g., "Wi-Fi", "Ethernet")
  address: string;     // IP address
  mac: string;         // MAC address
  family: string;      // IP family (IPv4, IPv6)
  internal: boolean;   // Whether it's internal (127.0.0.1)
}
```

## 🛠️ Setup Instructions

### 1. Database Schema Update
```sql
-- Run in Supabase SQL Editor
-- Copy content from: supabase/background-info-schema.sql
```

### 2. Environment Variables
No additional environment variables required. The feature uses existing Supabase configuration.

### 3. Desktop App Build
```bash
cd apps/desktop
npm run build:win
```

### 4. Web App Deployment
```bash
npm run build:web
```

## 🔧 Troubleshooting

### Common Issues

#### Desktop App: "Background info collector not available"
- **Cause**: Node.js modules not loading properly
- **Solution**: Check Electron build configuration and dependencies

#### Web App: "Failed to get public IP"
- **Cause**: Network connectivity or API service issues
- **Solution**: Check internet connection and firewall settings

#### Database: "device_info column not found"
- **Cause**: Schema update not applied
- **Solution**: Run the background-info-schema.sql script

### Debug Information
```typescript
// Enable debug logging
console.log('🔍 Background Information Collected:', {
  localIP: deviceInfo.localIP,
  publicIP: deviceInfo.publicIP,
  macAddress: deviceInfo.macAddress,
  hostname: deviceInfo.hostname,
  os: deviceInfo.os,
  platform: deviceInfo.platform,
  networkInterfaces: deviceInfo.networkInterfaces.length
});
```

## 📈 Benefits

### For Administrators
- **Device Tracking**: Know which devices employees are using
- **Network Security**: Monitor device connections and locations
- **Compliance**: Maintain audit trails of device usage
- **Support**: Better troubleshooting with device specifications

### For Employees
- **Transparency**: Clear understanding of what information is collected
- **Security**: Device information helps prevent unauthorized access
- **Reliability**: Better tracking accuracy with device identification

## 🔮 Future Enhancements

### Planned Features
- **Real-time Updates**: Live device status monitoring
- **Geolocation**: Approximate location based on IP
- **Device Health**: System resource monitoring
- **Network Analytics**: Connection quality and stability metrics

### Integration Opportunities
- **VPN Detection**: Identify when employees use VPNs
- **Device Policies**: Enforce device-specific rules
- **Security Alerts**: Notify on suspicious device activity
- **Compliance Reports**: Automated device audit reports

## 📝 API Reference

### Collect Background Info
```typescript
POST /api/collect-background-info
{
  "employeeId": "uuid"
}

Response:
{
  "success": true,
  "data": DeviceInfo
}
```

### Get Device Info
```typescript
GET /api/device-info/{employeeId}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "employee_id": "uuid",
    "mac_address": "00:11:22:33:44:55",
    "hostname": "DESKTOP-ABC123",
    "last_seen": "2024-01-01T12:00:00Z",
    "device_info": DeviceInfo
  }
}
```

## 🎉 Conclusion

The background information collection feature provides comprehensive device tracking capabilities while maintaining user privacy and security. It enhances the time tracking system with valuable device insights for administrators while ensuring transparent and minimal data collection.

For support or questions, refer to the troubleshooting section or contact the development team. 