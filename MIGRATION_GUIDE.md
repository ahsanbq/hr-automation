# S3 Presigned URL Migration Guide

## Current Status

The database server at `153.92.223.64:5432` is currently not accessible. This guide provides the complete migration steps to run when the database becomes available.

## Migration Steps

### Step 1: Database Schema Migration

When the database is accessible, run one of these options:

#### Option A: Using Prisma (Recommended)

```bash
cd "/home/ahsantamim/Projects/Rubel Bhai /Latest October 22 pull/hr-automation"
npx prisma migrate dev --name add_s3_key_to_resume
```

#### Option B: Manual SQL (If Prisma fails)

```bash
# Connect to your PostgreSQL database and run:
psql "postgresql://recruiter:ZSfyTvgjUXXGy02L@153.92.223.64:5432/recruitment_management?pgbouncer=true"

# Then execute the SQL from manual-migration.sql:
\i manual-migration.sql
```

### Step 2: Data Migration

After the schema is updated, run the data migration script:

```bash
cd "/home/ahsantamim/Projects/Rubel Bhai /Latest October 22 pull/hr-automation"
node scripts/migrate-resume-urls.js
```

This script will:

- Extract S3 keys from existing presigned URLs
- Update the `s3Key` field for resumes that have presigned URLs
- Skip resumes that already have S3 keys
- Provide a detailed migration report

### Step 3: Verification

After migration, verify the changes:

```sql
-- Check that the s3Key column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Resume' AND column_name = 's3Key';

-- Check how many resumes have S3 keys
SELECT
  COUNT(*) as total_resumes,
  COUNT("s3Key") as resumes_with_s3_key,
  COUNT(*) - COUNT("s3Key") as resumes_without_s3_key
FROM "Resume";

-- Sample some migrated data
SELECT id, "candidateName", "resumeUrl", "s3Key"
FROM "Resume"
WHERE "s3Key" IS NOT NULL
LIMIT 5;
```

### Step 4: Test the Application

1. **Start the application**:

   ```bash
   npm run dev
   ```

2. **Test CV access**:

   - Navigate to any job's CV sorting page
   - Click on CV links to verify they work
   - Check browser console for any errors

3. **Test new uploads**:
   - Upload a new CV file
   - Verify it gets an S3 key
   - Test accessing the CV immediately and after some time

## Expected Results

### After Schema Migration:

- `Resume` table will have a new `s3Key` column
- All existing resumes will have `s3Key` as NULL initially

### After Data Migration:

- Resumes with presigned URLs will have their S3 keys extracted
- Resumes without presigned URLs will remain NULL
- Migration report will show success/error counts

### After Application Testing:

- CV links should work without "AccessDenied" errors
- New uploads should work seamlessly
- Old resumes should work with fallback to original URLs

## Troubleshooting

### If Database Connection Fails:

1. Check if the database server is running
2. Verify network connectivity to `153.92.223.64:5432`
3. Check if credentials are correct
4. Try connecting with a different PostgreSQL client

### If Migration Script Fails:

1. Check that the `s3Key` column exists in the database
2. Verify Prisma client is properly configured
3. Check for any syntax errors in the migration script

### If CV Access Still Fails:

1. Check browser console for errors
2. Verify the presigned URL API endpoint is working
3. Test with a fresh resume upload
4. Check S3 credentials and permissions

## Rollback Plan

If issues occur, you can rollback:

1. **Revert frontend changes** to use original URLs
2. **Keep database changes** (s3Key field can remain)
3. **Old resumes will continue to work** with original URLs
4. **New uploads will store S3 keys** but use original URLs

## Monitoring

After migration, monitor:

- CV access success rates
- Presigned URL generation errors
- Fallback usage frequency
- Database performance

## Files Created/Modified

### New Files:

- `src/pages/api/resumes/[resumeId]/presigned-url.ts` - API endpoint for fresh URLs
- `src/lib/resume-url-service.ts` - Utility service for URL handling
- `scripts/migrate-resume-urls.js` - Data migration script
- `manual-migration.sql` - Manual SQL migration
- `S3_PRESIGNED_URL_FIX.md` - Complete fix documentation

### Modified Files:

- `prisma/schema.prisma` - Added s3Key field
- `src/lib/s3-service.ts` - Updated to return S3 keys
- `src/pages/api/jobs/[jobId]/upload-and-analyze.ts` - Store S3 keys
- `src/pages/cv-sorting/[jobId].tsx` - Updated CV access
- `src/components/assessment/JobResumeManager.tsx` - Updated CV access

## Next Steps

1. **Wait for database access** - Monitor database connectivity
2. **Run schema migration** - Execute Step 1 when database is available
3. **Run data migration** - Execute Step 2 to migrate existing data
4. **Test thoroughly** - Verify all CV access works
5. **Monitor performance** - Watch for any issues in production

The migration is ready to execute as soon as the database becomes accessible.
