-- Manual Migration SQL for S3 Key Field
-- Run this when the database is accessible

-- Add s3Key column to Resume table
ALTER TABLE "Resume" ADD COLUMN "s3Key" TEXT;

-- Add comment to the column
COMMENT ON COLUMN "Resume"."s3Key" IS 'S3 object key for generating fresh presigned URLs';

-- Create index on s3Key for better performance
CREATE INDEX "Resume_s3Key_idx" ON "Resume"("s3Key");

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Resume' AND column_name = 's3Key';
