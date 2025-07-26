# macOS Installation Guide for Time Tracker Desktop App

## Quick Fix (Recommended)
If you see the "'Mercor Time Tracker' is damaged and can't be opened" warning:

### Method 1: Right-click Method
1. Right-click on the "Mercor Time Tracker" app
2. Select "Open" from the context menu
3. Click "Open" in the security dialog
4. The app will run normally from now on

### Method 2: System Settings
1. Go to **System Settings** → **Privacy & Security**
2. Scroll down to find "Mercor Time Tracker was blocked..."
3. Click **"Allow Anyway"**
4. Try opening the app again

## Advanced Fix (Terminal Command)
If the above methods don't work, open Terminal and run:

```bash
sudo xattr -rd com.apple.quarantine "/Applications/Mercor Time Tracker.app"
```

This command removes the quarantine attribute that macOS adds to downloaded apps.

## Why This Happens
- macOS Gatekeeper blocks unsigned apps for security
- Our development build isn't code-signed with an Apple Developer Certificate
- This is normal for internal/development applications

## Need Help?
Contact your system administrator if you continue to experience issues.
