# S3 Credentials Configuration Fix

## Issue Identified

The S3 presigned URL migration is failing because the AWS credentials in the `.env` file are set to placeholder values:

```
AWS_ACCESS_KEY_ID="your_access_key_here"
AWS_SECRET_ACCESS_KEY="your_secret_key_here"
```

This causes the presigned URL API to fail, and the frontend falls back to using the expired URLs, which results in "AccessDenied" errors.

## Solution

### Step 1: Update S3 Credentials

Update the `.env` file with your actual AWS credentials:

```env
# S3 Configuration for Resume Upload Module
AWS_ACCESS_KEY_ID="your_actual_access_key"
AWS_SECRET_ACCESS_KEY="your_actual_secret_key"
AWS_REGION="eu-north-1"
S3_BUCKET_NAME="synchro-cv"
```

### Step 2: Verify S3 Access

After updating the credentials, test the S3 access:

```bash
node debug-presigned-url.js
```

This should show:

- ✅ S3 bucket is accessible
- ✅ Presigned URL generated successfully
- ✅ Presigned URL is accessible

### Step 3: Test the Application

1. Restart the development server:

   ```bash
   npm run dev
   ```

2. Open the application in browser
3. Navigate to any job's CV sorting page
4. Click on CV links - they should now work without "AccessDenied" errors

## Alternative Solution (If S3 Credentials Not Available)

If you don't have the S3 credentials, you can implement a temporary workaround:

### Option 1: Use Public URLs

If the S3 bucket is configured for public access, you can modify the S3 service to generate public URLs instead of presigned URLs.

### Option 2: Re-upload Files

If the S3 credentials are not available, you might need to re-upload the CV files with the correct credentials.

### Option 3: Use Different Storage

Consider using a different storage solution or cloud provider if S3 access is not available.

## Verification

After fixing the credentials, run these tests:

1. **Database Check:**

   ```bash
   node scripts/check-database.js
   ```

2. **Migration Test:**

   ```bash
   node scripts/test-migration.js
   ```

3. **S3 Debug:**

   ```bash
   node debug-presigned-url.js
   ```

4. **Application Test:**
   - Start the server: `npm run dev`
   - Test CV access in the browser
   - Verify no "AccessDenied" errors

## Expected Results

After fixing the S3 credentials:

- ✅ CV links work without "AccessDenied" errors
- ✅ Fresh presigned URLs are generated on-demand
- ✅ URLs expire after 1 hour (better security)
- ✅ Old resumes work with new system
- ✅ New uploads work seamlessly

## Troubleshooting

### If S3 Access Still Fails:

1. Check AWS credentials are correct
2. Verify S3 bucket exists and is accessible
3. Check AWS region is correct
4. Verify IAM permissions for S3 access

### If CV Access Still Shows Errors:

1. Clear browser cache
2. Restart the development server
3. Check browser console for errors
4. Verify the presigned URL API is working

The migration is complete and ready - it just needs the correct S3 credentials to function properly.
