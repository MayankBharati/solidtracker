// Background Information Collection Module
// Collects IP addresses, MAC addresses, device info, and network information

export interface DeviceInfo {
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
  
  // Browser Information (for web)
  userAgent?: string;
  screenResolution?: string;
  timezone?: string;
  
  // Timestamp
  collectedAt: string;
}

export interface NetworkInterface {
  name: string;
  address: string;
  mac: string;
  family: string;
  internal: boolean;
}

export interface BackgroundInfoCollector {
  collectDeviceInfo(): Promise<DeviceInfo>;
  getLocalIP(): string;
  getMACAddress(): string;
  getPublicIP(): Promise<string | null>;
  getNetworkInterfaces(): NetworkInterface[];
  getSystemInfo(): {
    os: string;
    platform: string;
    arch: string;
    nodeVersion: string;
    hostname: string;
  };
}

// Node.js implementation for desktop app
export class NodeBackgroundInfoCollector implements BackgroundInfoCollector {
  private os: any;
  private networkInterfaces: any;

  constructor() {
    // Dynamic imports for Node.js modules
    try {
      this.os = require('os');
      this.networkInterfaces = require('os').networkInterfaces;
    } catch (error) {
      console.error('Failed to load Node.js modules:', error);
    }
  }

  async collectDeviceInfo(): Promise<DeviceInfo> {
    const systemInfo = this.getSystemInfo();
    const localIP = this.getLocalIP();
    const macAddress = this.getMACAddress();
    const networkInterfaces = this.getNetworkInterfaces();
    const publicIP = await this.getPublicIP();

    return {
      localIP,
      publicIP: publicIP || undefined,
      macAddress,
      hostname: systemInfo.hostname,
      os: systemInfo.os,
      platform: systemInfo.platform,
      arch: systemInfo.arch,
      nodeVersion: systemInfo.nodeVersion,
      networkInterfaces,
      collectedAt: new Date().toISOString()
    };
  }

  getLocalIP(): string {
    try {
      const interfaces = this.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const interface_ of interfaces[name]) {
          // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
          if (interface_.family === 'IPv4' && !interface_.internal) {
            return interface_.address;
          }
        }
      }
    } catch (error) {
      console.error('Error getting local IP:', error);
    }
    return '127.0.0.1'; // Fallback
  }

  getMACAddress(): string {
    try {
      const interfaces = this.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const interface_ of interfaces[name]) {
          // Get the first non-internal interface with a MAC address
          if (interface_.mac && interface_.mac !== '00:00:00:00:00:00') {
            return interface_.mac;
          }
        }
      }
    } catch (error) {
      console.error('Error getting MAC address:', error);
    }
    return '00:00:00:00:00:00'; // Fallback
  }

  async getPublicIP(): Promise<string | null> {
    try {
      // Try multiple IP detection services for reliability
      const services = [
        'https://api.ipify.org?format=json',
        'https://api.myip.com',
        'https://ipapi.co/json',
        'https://httpbin.org/ip'
      ];

      for (const service of services) {
        try {
          const response = await fetch(service, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            // Timeout after 5 seconds
            signal: AbortSignal.timeout(5000)
          });

          if (response.ok) {
            const data = await response.json();
            
            // Handle different response formats
            if (data.ip) return data.ip;
            if (data.origin) return data.origin;
            if (typeof data === 'string') return data;
          }
        } catch (error) {
          console.warn(`Failed to get public IP from ${service}:`, error);
          continue;
        }
      }
    } catch (error) {
      console.error('Error getting public IP:', error);
    }
    return null;
  }

  getNetworkInterfaces(): NetworkInterface[] {
    try {
      const interfaces = this.networkInterfaces();
      const result: NetworkInterface[] = [];

      for (const name of Object.keys(interfaces)) {
        for (const interface_ of interfaces[name]) {
          result.push({
            name,
            address: interface_.address,
            mac: interface_.mac,
            family: interface_.family,
            internal: interface_.internal
          });
        }
      }

      return result;
    } catch (error) {
      console.error('Error getting network interfaces:', error);
      return [];
    }
  }

  getSystemInfo() {
    try {
      return {
        os: this.os.type(),
        platform: this.os.platform(),
        arch: this.os.arch(),
        nodeVersion: process.version,
        hostname: this.os.hostname()
      };
    } catch (error) {
      console.error('Error getting system info:', error);
      return {
        os: 'Unknown',
        platform: 'Unknown',
        arch: 'Unknown',
        nodeVersion: 'Unknown',
        hostname: 'Unknown'
      };
    }
  }
}

// Browser implementation for web app
export class BrowserBackgroundInfoCollector implements BackgroundInfoCollector {
  async collectDeviceInfo(): Promise<DeviceInfo> {
    const systemInfo = this.getSystemInfo();
    const localIP = this.getLocalIP();
    const macAddress = this.getMACAddress();
    const networkInterfaces = this.getNetworkInterfaces();
    const publicIP = await this.getPublicIP();

    return {
      localIP,
      publicIP: publicIP || undefined,
      macAddress,
      hostname: systemInfo.hostname,
      os: systemInfo.os,
      platform: systemInfo.platform,
      arch: systemInfo.arch,
      nodeVersion: systemInfo.nodeVersion,
      networkInterfaces,
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      collectedAt: new Date().toISOString()
    };
  }

  getLocalIP(): string {
    // In browser, we can't get local IP directly
    // We'll use WebRTC to get local IP
    return this.getLocalIPViaWebRTC();
  }

  private getLocalIPViaWebRTC(): string {
    try {
      // Use WebRTC to get local IP
      const RTCPeerConnection = window.RTCPeerConnection || 
                               (window as any).webkitRTCPeerConnection || 
                               (window as any).mozRTCPeerConnection;

      if (!RTCPeerConnection) {
        return '127.0.0.1';
      }

      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      pc.createOffer().then(offer => pc.setLocalDescription(offer));
      
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
          const match = ipRegex.exec(event.candidate.candidate);
          if (match) {
            const localIP = match[1];
            pc.close();
            return localIP;
          }
        }
      };

      // Fallback after 1 second
      setTimeout(() => {
        pc.close();
      }, 1000);

    } catch (error) {
      console.error('Error getting local IP via WebRTC:', error);
    }
    return '127.0.0.1';
  }

  getMACAddress(): string {
    // In browser, we can't get MAC address directly for security reasons
    // We'll generate a unique device fingerprint instead
    return this.generateDeviceFingerprint();
  }

  private generateDeviceFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
        const fingerprint = canvas.toDataURL();
        
        // Create a hash from the fingerprint
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
          const char = fingerprint.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Convert to MAC-like format
        const hashHex = Math.abs(hash).toString(16).padStart(12, '0');
        return hashHex.match(/.{2}/g)?.join(':') || '00:00:00:00:00:00';
      }
    } catch (error) {
      console.error('Error generating device fingerprint:', error);
    }
    return '00:00:00:00:00:00';
  }

  async getPublicIP(): Promise<string | null> {
    try {
      const services = [
        'https://api.ipify.org?format=json',
        'https://api.myip.com',
        'https://ipapi.co/json'
      ];

      for (const service of services) {
        try {
          const response = await fetch(service, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(5000)
          });

          if (response.ok) {
            const data = await response.json();
            if (data.ip) return data.ip;
          }
        } catch (error) {
          console.warn(`Failed to get public IP from ${service}:`, error);
          continue;
        }
      }
    } catch (error) {
      console.error('Error getting public IP:', error);
    }
    return null;
  }

  getNetworkInterfaces(): NetworkInterface[] {
    // In browser, we can't get network interfaces directly
    // Return basic information
    return [{
      name: 'browser',
      address: this.getLocalIP(),
      mac: this.getMACAddress(),
      family: 'IPv4',
      internal: false
    }];
  }

  getSystemInfo() {
    const userAgent = navigator.userAgent;
    let os = 'Unknown';
    let platform = 'Unknown';

    // Detect OS
    if (userAgent.indexOf('Windows') !== -1) {
      os = 'Windows';
      platform = 'win32';
    } else if (userAgent.indexOf('Mac') !== -1) {
      os = 'macOS';
      platform = 'darwin';
    } else if (userAgent.indexOf('Linux') !== -1) {
      os = 'Linux';
      platform = 'linux';
    } else if (userAgent.indexOf('Android') !== -1) {
      os = 'Android';
      platform = 'android';
    } else if (userAgent.indexOf('iOS') !== -1) {
      os = 'iOS';
      platform = 'ios';
    }

    return {
      os,
      platform,
      arch: 'Unknown',
      nodeVersion: 'Browser',
      hostname: window.location.hostname || 'localhost'
    };
  }
}

// Factory function to create appropriate collector
export function createBackgroundInfoCollector(): BackgroundInfoCollector {
  if (typeof window === 'undefined') {
    // Node.js environment (desktop app)
    return new NodeBackgroundInfoCollector();
  } else {
    // Browser environment (web app)
    return new BrowserBackgroundInfoCollector();
  }
}

// Utility function to collect and log background info
export async function collectAndLogBackgroundInfo(): Promise<DeviceInfo> {
  const collector = createBackgroundInfoCollector();
  const deviceInfo = await collector.collectDeviceInfo();
  
  console.log('🔍 Background Information Collected:', {
    localIP: deviceInfo.localIP,
    publicIP: deviceInfo.publicIP,
    macAddress: deviceInfo.macAddress,
    hostname: deviceInfo.hostname,
    os: deviceInfo.os,
    platform: deviceInfo.platform,
    networkInterfaces: deviceInfo.networkInterfaces.length
  });
  
  return deviceInfo;
} 