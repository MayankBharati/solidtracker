-- Background Information Schema Update
-- Add device_info column to devices table for storing comprehensive device information

-- Add device_info column to existing devices table
ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_info JSONB;

-- Update devices table structure to include device_info
-- This allows storing comprehensive device information including:
-- - IP addresses (local and public)
-- - MAC addresses
-- - Operating system details
-- - Network interface information
-- - Browser information (for web apps)
-- - Screen resolution and timezone
-- - Collection timestamp

-- Create index for better query performance on device_info
CREATE INDEX IF NOT EXISTS idx_devices_device_info ON devices USING GIN (device_info);

-- Add comment to document the device_info column
COMMENT ON COLUMN devices.device_info IS 'JSON object containing comprehensive device information including IP addresses, MAC addresses, OS details, network interfaces, and browser information';

-- Success message
SELECT 'Background information schema updated successfully! Device info collection is now enabled.' as status; 