-- Create the screenshots storage bucket (simplified version matching your schema approach)
-- Run this SQL in your Supabase SQL Editor

-- Create the bucket as public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Remove any existing policies
DROP POLICY IF EXISTS "Allow all access to screenshots" ON storage.objects;

-- Create a simple policy for all access
CREATE POLICY "Allow all access to screenshots" ON storage.objects 
FOR ALL USING (bucket_id = 'screenshots');

-- Verify the bucket is public
SELECT id, name, public FROM storage.buckets WHERE id = 'screenshots';
