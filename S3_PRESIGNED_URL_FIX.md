# S3 Presigned URL Expiration Fix

## Problem Description

The HR automation system was experiencing "AccessDenied" errors when users tried to access CV files that were uploaded more than 24 hours ago. The error message showed:

```
<Error>
<Code>AccessDenied</Code>
<Message>Request has expired</Message>
<X-Amz-Expires>86400</X-Amz-Expires>
<Expires>2025-10-24T11:49:40Z</Expires>
<ServerTime>2025-10-24T12:01:36Z</ServerTime>
</Error>
```

## Root Cause

The system was storing **presigned URLs** (which expire after 24 hours) directly in the database as `resumeUrl`. When users tried to access these URLs after expiration, they received access denied errors.

### Previous Flow (Problematic):

1. Upload file to S3 → Generate presigned URL (24h expiry) → Store in database
2. Frontend uses stored URL directly → Fails after 24 hours

## Solution Implemented

### New Architecture:

1. **Store S3 Object Keys**: Store the S3 object key in database instead of presigned URLs
2. **Generate Fresh URLs**: Create fresh presigned URLs on-demand when accessing files
3. **Fallback Support**: Maintain backward compatibility for old resumes

### Changes Made:

#### 1. Database Schema Update

- Added `s3Key` field to `Resume` model in `prisma/schema.prisma`
- This field stores the S3 object key for generating fresh presigned URLs

#### 2. S3 Service Update (`src/lib/s3-service.ts`)

- Modified `uploadResume()` to return S3 key instead of presigned URL
- Preserved `getPresignedUrl()` method for generating fresh URLs

#### 3. Upload Logic Update

- Updated `src/pages/api/jobs/[jobId]/upload-and-analyze.ts`
- Now stores both `resumeUrl` (for reference) and `s3Key` (for fresh URLs)

#### 4. New API Endpoint

- Created `src/pages/api/resumes/[resumeId]/presigned-url.ts`
- Generates fresh presigned URLs (1-hour expiry) on-demand
- Includes authentication and authorization checks

#### 5. Frontend Updates

- Updated CV access buttons in `src/pages/cv-sorting/[jobId].tsx`
- Updated resume viewer in `src/components/assessment/JobResumeManager.tsx`
- All CV access now uses fresh presigned URLs with fallback to original URLs

#### 6. Migration Script

- Created `scripts/migrate-resume-urls.js`
- Extracts S3 keys from existing presigned URLs
- Handles backward compatibility for old resumes

## Implementation Details

### New Flow:

1. **Upload**: File → S3 → Store S3 key in database
2. **Access**: User clicks CV → API generates fresh presigned URL → Opens file
3. **Fallback**: If no S3 key → Use original URL (for old resumes)

### API Endpoint Usage:

```javascript
// Get fresh presigned URL for a resume
const response = await fetch(`/api/resumes/${resumeId}/presigned-url`, {
  headers: { Authorization: `Bearer ${token}` },
});
const { presignedUrl } = await response.json();
```

### Frontend Implementation:

```javascript
onClick={async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/resumes/${record.id}/presigned-url`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const data = await response.json();
      window.open(data.presignedUrl, "_blank", "noopener,noreferrer");
    } else {
      // Fallback to original URL
      window.open(record.resumeUrl, "_blank", "noopener,noreferrer");
    }
  } catch (error) {
    console.error("Error getting fresh URL:", error);
    // Fallback to original URL
    window.open(record.resumeUrl, "_blank", "noopener,noreferrer");
  }
}}
```

## Migration Steps

### 1. Database Migration

```bash
# Run Prisma migration to add s3Key field
npx prisma migrate dev --name add_s3_key_to_resume
```

### 2. Migrate Existing Data

```bash
# Run migration script to extract S3 keys from existing URLs
node scripts/migrate-resume-urls.js
```

### 3. Deploy Changes

- Deploy the updated code
- Test CV access functionality
- Monitor for any issues

## Benefits

1. **No More Expired URLs**: Fresh presigned URLs generated on-demand
2. **Better Security**: URLs expire after 1 hour instead of 24 hours
3. **Backward Compatibility**: Old resumes still work with fallback
4. **Scalable**: No database updates needed for URL regeneration
5. **Cost Effective**: No additional S3 storage costs

## Testing

### Test Cases:

1. **New Uploads**: Upload new CVs and verify they work
2. **Old Resumes**: Test access to resumes uploaded before the fix
3. **Error Handling**: Test fallback when API fails
4. **Authentication**: Verify only authorized users can access files

### Verification:

- Check that CV links work for all resumes
- Verify no "AccessDenied" errors
- Test both new and old resume access
- Confirm fallback works for old resumes without S3 keys

## Monitoring

### Key Metrics:

- Presigned URL generation success rate
- Fallback usage frequency
- Error rates for CV access
- API response times

### Alerts:

- High error rates for presigned URL generation
- Frequent fallback usage (indicates migration issues)
- Authentication failures

## Rollback Plan

If issues arise:

1. Revert frontend changes to use original URLs
2. Keep database changes (s3Key field can remain)
3. Old resumes will continue to work with original URLs
4. New uploads will store S3 keys but use original URLs

## Future Improvements

1. **Caching**: Cache presigned URLs for a short period to reduce API calls
2. **Batch Processing**: Generate multiple presigned URLs in one request
3. **Monitoring**: Add detailed logging for presigned URL generation
4. **Cleanup**: Remove old presigned URLs from database after migration period
