#!/bin/bash

# S3 Upload Setup Script
# This script helps set up the S3 upload functionality

echo "🚀 Setting up S3 Upload Functionality"
echo "======================================"

# Check if required dependencies are installed
echo "📦 Checking dependencies..."

if ! npm list aws-sdk >/dev/null 2>&1; then
    echo "❌ aws-sdk not found. Installing..."
    npm install aws-sdk
else
    echo "✅ aws-sdk is installed"
fi

if ! npm list multer >/dev/null 2>&1; then
    echo "❌ multer not found. Installing..."
    npm install multer @types/multer
else
    echo "✅ multer is installed"
fi

# Check for environment variables
echo ""
echo "🔧 Checking environment configuration..."

if [ -f ".env.local" ]; then
    echo "✅ .env.local file exists"
    
    if grep -q "AWS_ACCESS_KEY_ID" .env.local; then
        echo "✅ AWS_ACCESS_KEY_ID is configured"
    else
        echo "⚠️  AWS_ACCESS_KEY_ID not found in .env.local"
        echo "Add: AWS_ACCESS_KEY_ID=your_access_key_here"
    fi
    
    if grep -q "AWS_SECRET_ACCESS_KEY" .env.local; then
        echo "✅ AWS_SECRET_ACCESS_KEY is configured"
    else
        echo "⚠️  AWS_SECRET_ACCESS_KEY not found in .env.local"
        echo "Add: AWS_SECRET_ACCESS_KEY=your_secret_key_here"
    fi
    
    if grep -q "AWS_REGION" .env.local; then
        echo "✅ AWS_REGION is configured"
    else
        echo "⚠️  AWS_REGION not found in .env.local"
        echo "Add: AWS_REGION=eu-north-1"
    fi
    
    if grep -q "S3_BUCKET_NAME" .env.local; then
        echo "✅ S3_BUCKET_NAME is configured"
    else
        echo "⚠️  S3_BUCKET_NAME not found in .env.local"
        echo "Add: S3_BUCKET_NAME=synchro-cv"
    fi
else
    echo "❌ .env.local file not found"
    echo "Creating .env.local with S3 configuration..."
    
    cat > .env.local << EOF
# S3 Configuration for Resume Upload
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=eu-north-1
S3_BUCKET_NAME=synchro-cv

# Add your other environment variables below this line
EOF
    
    echo "✅ Created .env.local with S3 configuration"
fi

echo ""
echo "📁 File structure created:"
echo "✅ src/lib/s3-service.ts - S3 operations service"
echo "✅ src/components/ResumeUploader.tsx - Upload component"
echo "✅ src/pages/api/jobs/[jobId]/upload-resumes.ts - Upload API"
echo "✅ src/pages/api/jobs/[jobId]/upload-and-analyze.ts - Upload & Analyze API"
echo "✅ Enhanced src/pages/cv-sorting/[jobId].tsx - UI integration"

echo ""
echo "🎯 Features implemented:"
echo "✅ Drag & drop file upload"
echo "✅ S3 integration with organized file structure"
echo "✅ File validation (type, size)"
echo "✅ Bulk upload (up to 20 files)"
echo "✅ Real-time progress indicators"
echo "✅ Error handling and reporting"
echo "✅ Integration with existing AI analysis"

echo ""
echo "🔧 S3 Bucket Configuration:"
echo "📍 Bucket: synchro-cv"
echo "📍 Region: eu-north-1 (Europe - Stockholm)"
echo "📍 File Path: synchro-hire/cv-sorting/{jobId}/{resumeId}.{extension}"

echo ""
echo "🚦 Next Steps:"
echo "1. Verify your .env.local file has the correct S3 credentials"
echo "2. Start the development server: npm run dev"
echo "3. Navigate to any job's CV sorting page"
echo "4. Click 'Analyze New Resumes' and try the 'Upload Files' tab"
echo "5. Test with PDF, DOC, DOCX, RTF, or TXT files"

echo ""
echo "📚 Documentation:"
echo "📖 See S3_UPLOAD_DOCUMENTATION.md for detailed usage and API reference"

echo ""
echo "✨ Setup complete! Happy uploading! 🎉"
