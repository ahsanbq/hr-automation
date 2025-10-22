# S3 Resume Upload Integration

This document describes the new S3-based file upload functionality for the CV sorting module.

## Overview

The system now supports both URL-based and file upload-based resume analysis:

1. **URL Analysis**: Users can provide direct URLs to resume files
2. **File Upload**: Users can upload resume files that are stored in AWS S3 and then analyzed

## Architecture

### S3 Service (`src/lib/s3-service.ts`)
- Handles all S3 operations (upload, delete, list, metadata)
- Implements organized file structure: `synchro-hire/cv-sorting/{jobId}/{resumeId}.{extension}`
- Supports multiple file formats: PDF, DOC, DOCX, RTF, TXT
- Provides presigned URLs for secure access

### API Endpoints

#### `/api/jobs/[jobId]/upload-resumes.ts`
- Handles file upload to S3 only
- Returns S3 URLs for uploaded files
- Supports bulk upload (up to 20 files)

#### `/api/jobs/[jobId]/upload-and-analyze.ts`
- Complete workflow: Upload → Store in S3 → Analyze with AI → Save to database
- One-step process for seamless user experience

#### Updated `/api/jobs/[jobId]/resumes.ts`
- Enhanced to support both URL and uploaded file analysis
- Accepts `resume_paths` (URLs) or `uploaded_files` (S3 URLs) in request body

### Frontend Components

#### `ResumeUploader` Component (`src/components/ResumeUploader.tsx`)
- Modern drag-and-drop interface
- File validation (type, size)
- Real-time upload progress
- Bulk file handling with preview

#### Enhanced CV Sorting Page
- Tabbed interface for URL vs File upload
- Integrated progress indicators
- Detailed success/failure reporting

## File Structure

Files are organized in S3 with the following pattern:
```
synchro-cv/
└── synchro-hire/
    └── cv-sorting/
        └── {jobId}/
            ├── {resumeId1}.pdf
            ├── {resumeId2}.docx
            └── {resumeId3}.txt
```

## Configuration

### Environment Variables
```env
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=eu-north-1
S3_BUCKET_NAME=synchro-cv
```

### S3 Bucket Configuration
- **Bucket Name**: `synchro-cv`
- **Region**: `eu-north-1` (Europe - Stockholm)
- **Access**: Private storage with presigned URLs for access
- **Security**: AWS IAM credentials for upload/delete operations

## Features

### File Upload
- ✅ Drag and drop interface
- ✅ Multiple file selection (up to 20 files)
- ✅ File type validation (PDF, DOC, DOCX, RTF, TXT)
- ✅ File size validation (max 10MB per file)
- ✅ Real-time upload progress
- ✅ Bulk upload with individual file status

### Security
- ✅ Organized file structure prevents conflicts
- ✅ Unique resume IDs for each file
- ✅ AWS IAM-based access control
- ✅ File type and size validation
- ✅ User authentication required for all operations

### Error Handling
- ✅ Detailed error messages for failed uploads
- ✅ Partial success handling (some files succeed, others fail)
- ✅ Network error recovery
- ✅ File validation errors

### User Experience
- ✅ Progressive loading states
- ✅ Clear success/failure indicators
- ✅ File preview before upload
- ✅ Individual file removal
- ✅ Upload progress visualization

## Usage

### For Users

1. **URL Analysis** (existing):
   - Navigate to job's CV sorting page
   - Click "Analyze New Resumes"
   - Select "Upload by URLs" tab
   - Enter resume URLs
   - Click "Analyze URLs"

2. **File Upload** (new):
   - Navigate to job's CV sorting page
   - Click "Analyze New Resumes"
   - Select "Upload Files" tab
   - Drag files or click to select
   - Files are automatically uploaded and analyzed
   - View results in the resume table

### For Developers

#### Upload Only
```typescript
const formData = new FormData();
files.forEach(file => formData.append('resumes', file));

const response = await fetch(`/api/jobs/${jobId}/upload-resumes`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
```

#### Upload and Analyze
```typescript
const formData = new FormData();
files.forEach(file => formData.append('resumes', file));

const response = await fetch(`/api/jobs/${jobId}/upload-and-analyze`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
```

## Error Handling

The system provides comprehensive error handling:

### File Validation Errors
- Invalid file type
- File too large (>10MB)
- Too many files (>20)

### Upload Errors
- Network connectivity issues
- S3 access errors
- Quota exceeded

### Analysis Errors
- AI service unavailable
- Invalid file content
- Database save errors

## Performance Considerations

- **Concurrent Uploads**: Files are uploaded sequentially to avoid overwhelming the server
- **Progress Tracking**: Real-time progress updates for user feedback
- **Memory Management**: Multer memory storage with size limits
- **Error Recovery**: Individual file failures don't stop the entire batch

## Security Considerations

- **Authentication**: All operations require valid JWT token
- **Authorization**: Users can only upload to jobs they own
- **File Validation**: Strict file type and size validation
- **S3 Security**: IAM-based access with minimal required permissions
- **Data Privacy**: Files are stored with unique identifiers

## Future Enhancements

1. **Virus Scanning**: Integrate with AWS Security services
2. **Image OCR**: Support for image-based resumes
3. **Batch Operations**: Enhanced bulk operations
4. **File Versioning**: Support for resume updates
5. **Analytics**: Upload and analysis metrics
6. **Caching**: S3 CloudFront integration for faster access

## Dependencies

### Backend
- `aws-sdk`: AWS S3 integration
- `multer`: File upload handling
- `@types/multer`: TypeScript support

### Frontend
- `antd`: UI components
- Enhanced upload components
- Progress indicators

## Testing

### Manual Testing Checklist
- [ ] Single file upload (PDF)
- [ ] Multiple file upload (mixed types)
- [ ] File size validation (>10MB)
- [ ] File type validation (invalid types)
- [ ] Network error handling
- [ ] Concurrent user uploads
- [ ] Analysis integration
- [ ] Database persistence

### Automated Testing
- Unit tests for S3Service
- Integration tests for upload APIs
- E2E tests for upload workflow

## Monitoring

### Metrics to Track
- Upload success/failure rates
- File size distribution
- Analysis processing times
- S3 storage usage
- User adoption of file upload vs URL

### Logs
- Upload attempts and results
- S3 operations
- Analysis pipeline status
- Error rates and types

## Support

For issues related to:
- **S3 Configuration**: Check AWS credentials and bucket permissions
- **File Upload Errors**: Verify file types and sizes
- **Analysis Failures**: Check AI service status and file content
- **Performance Issues**: Monitor concurrent uploads and file sizes
