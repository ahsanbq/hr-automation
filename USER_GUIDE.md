# HR Automation Platform - User Guide
## From Signup to CV Sorting

---

## Table of Contents
1. [Getting Started](#getting-started)
2. [Company Registration & Signup](#company-registration--signup)
3. [User Authentication](#user-authentication)
4. [Dashboard Overview](#dashboard-overview)
5. [Creating Job Requirements](#creating-job-requirements)
6. [CV Sorting Module](#cv-sorting-module)
7. [Resume Upload & Analysis](#resume-upload--analysis)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What is HR Automation Platform?
The HR Automation Platform is a comprehensive recruitment management system that helps companies streamline their hiring process from job creation to candidate evaluation. The platform uses AI-powered tools to analyze resumes, match candidates to job requirements, and provide intelligent recommendations.

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection
- JavaScript enabled

---

## Company Registration & Signup

### 🚀 Step 1: Access the Platform
1. Visit the HR Automation Platform URL
2. You'll be automatically redirected to the authentication page

### 📝 Step 2: Company Registration
1. **Click the "Company Sign Up" tab**
2. **Fill in Company Information:**
   - **Company Name:** Enter your organization's legal name
   - **Country:** Select your company's location
   - **Company Address:** Provide complete business address
   - **Company Website:** Enter your official website URL (optional)

3. **Admin Account Setup:**
   - **Admin Name:** Full name of the primary administrator
   - **Admin Email:** Professional email address (will be used for login)
   - **Admin Password:** Create a secure password (minimum 8 characters)

4. **Click "Company Sign Up"**

### ✅ Step 3: Successful Registration
- Upon successful registration, you'll be automatically logged in
- You'll receive a welcome message
- The system redirects you to the Analytics Dashboard

---

## User Authentication

### 🔐 Sign In Process
1. **For Existing Users:**
   - Click the "Sign In" tab
   - Enter your registered email address
   - Enter your password
   - Click "Sign In"

2. **Password Requirements:**
   - Minimum 8 characters
   - Combination of letters and numbers recommended

3. **Account Recovery:**
   - Contact system administrator for password reset

---

## Dashboard Overview

### 📊 Analytics Dashboard
After successful login, you'll land on the Analytics Dashboard featuring:

**Key Metrics:**
- **Total Jobs:** Number of active job postings
- **Total Resumes:** Number of uploaded and analyzed resumes
- **Total Candidates:** Unique candidate count
- **Active Assessments:** Ongoing evaluation processes

**Quick Navigation Menu:**
- **Analytics:** Main dashboard with recruitment metrics
- **Job Requirements:** Create and manage job postings
- **LinkedIn:** LinkedIn integration tools
- **CV Sorting:** Resume management and analysis
- **MCQ Tests:** Assessment creation and management
- **AI Avatar:** AI-powered interview tools

---

## Creating Job Requirements

### 📋 Step 1: Navigate to Job Requirements
1. Click "Job Requirements" in the sidebar menu
2. Select the "Create Job" tab

### 🤖 Step 2: AI-Powered Job Creation
**Basic Information:**
- **Job Title:** Enter the position title (e.g., "Senior Software Developer")
- **Company:** Your company name (auto-filled)
- **Department:** Relevant department (e.g., "Engineering", "Marketing")
- **Location:** Job location (Remote, City, Country)
- **Job Type:** Select from dropdown (Full-time, Part-time, Contract, etc.)
- **Experience Level:** Choose appropriate level (Entry, Mid, Senior, Executive)

**Skills & Requirements:**
- **Key Skills:** Add relevant technical and soft skills
- **Budget Range:** Specify salary expectations
- **Additional Requirements:** Any specific certifications, tools, or qualifications

### 🎯 Step 3: Generate Job Description
1. **Click "Generate with AI"**
2. **AI Processing:** The system uses artificial intelligence to create:
   - Detailed job description
   - List of responsibilities
   - Required qualifications
   - Skills breakdown
   - Benefits package

3. **Review & Edit:** The generated content appears in a modal where you can:
   - Review all sections
   - Edit any content
   - Add or remove requirements
   - Customize benefits

### 💾 Step 4: Save Job Posting
1. Make final edits to the generated content
2. Click "Save Job"
3. The job posting is now active and ready for resume submissions

### 🛠️ Alternative: Manual Job Creation
1. Switch to "Manual Entry" tab
2. Fill in all fields manually:
   - Job details
   - Responsibilities (one per line)
   - Qualifications (one per line)
   - Skills (comma-separated)
   - Benefits (one per line)

---

## CV Sorting Module

### 📁 Step 1: Access CV Sorting
1. Click "CV Sorting" in the sidebar menu
2. View list of all created job postings
3. Each job shows:
   - Job title and company
   - Location and job type
   - Number of uploaded resumes
   - Average match score

### 🎯 Step 2: Select Job for Resume Review
1. **Find your target job** in the job list
2. **Click "Manage CVs"** button for the specific job
3. You'll be redirected to the job-specific CV sorting page

### 📊 Step 3: Job-Specific CV Dashboard
**Overview Statistics:**
- **Total Resumes:** Total number of uploaded resumes
- **Highly Recommended:** Number of top-tier candidates
- **Consider:** Candidates worth reviewing
- **Not Suitable:** Candidates below requirements

**Job Information Panel:**
- Complete job details displayed on the right side
- Required skills highlighted
- Job description and responsibilities
- Qualifications and benefits

---

## Resume Upload & Analysis

### 📤 Step 1: Upload Methods
**Two Upload Options Available:**

#### Option A: URL-Based Upload
1. Click "Analyze New Resumes" button
2. Select "Upload by URLs" tab
3. Enter resume URLs (PDF, DOC, DOCX, RTF, TXT)
4. Click "Add another URL" for multiple resumes
5. Click "Analyze URLs"

#### Option B: File Upload
1. Click "Analyze New Resumes" button
2. Select "Upload Files" tab
3. Follow the 2-step process:

**Step 1: Select & Upload Files**
- **Drag and drop** files into the upload area, OR
- **Click to browse** and select files
- **Supported formats:** PDF, DOC, DOCX, RTF, TXT
- **File size limit:** 10MB per file
- **Maximum files:** 20 files per batch

**Step 2: AI Analysis**
- Files are uploaded to secure AWS S3 storage
- Click "Analyze CVs" to start AI processing

### 🔄 Step 2: Real-Time Progress Tracking

#### Upload Progress
- **File-by-file upload tracking**
- **Current file being uploaded**
- **Upload percentage completion**
- **Success/failure count**
- **Error reporting for failed uploads**

#### Analysis Progress
- **Batch processing status**
- **Current file being analyzed**
- **AI analysis percentage**
- **Real-time progress updates**
- **Completion notifications**

### 🤖 Step 3: AI-Powered Analysis
**The AI analyzes each resume for:**
- **Skills matching** job requirements
- **Experience level** compatibility
- **Education background** relevance
- **Overall candidate fit**

**AI generates:**
- **Match Score** (0-100%)
- **Recommendation** (Highly Recommended/Consider/Not Suitable)
- **Skills assessment**
- **Experience summary**
- **Education details**

### 📋 Step 4: Review Results
**Resume Table Features:**
- **Sortable columns** by match score, name, recommendation
- **Candidate contact information** (email, phone)
- **Skills tags** showing candidate abilities
- **Recommendation color coding:**
  - 🟢 Green: Highly Recommended (80%+ match)
  - 🟡 Orange: Consider (60-79% match)
  - 🔴 Red: Not Suitable (<60% match)

### 👁️ Step 5: Detailed Candidate Review
**Click "View" button on any candidate to see:**
- **Complete candidate profile**
- **Detailed skills breakdown**
- **Experience summary**
- **Education background**
- **AI-generated recommendation reasoning**
- **Direct link to download original resume**

### 📧 Step 6: Candidate Actions
- **Contact candidates** directly via email
- **Download resume** files
- **Delete unsuitable** candidates
- **Export candidate** data

---

## Advanced Features

### 🔄 Progress Monitoring
- **Real-time updates** during upload and analysis
- **Error handling** with detailed error messages
- **Automatic retry** for failed operations
- **Progress persistence** across browser sessions

### 🛡️ Security Features
- **Secure file storage** on AWS S3
- **Encrypted data transmission**
- **User authentication** for all operations
- **Access control** by company and user

### 📊 Analytics Integration
- **Resume statistics** automatically update analytics
- **Performance metrics** tracking
- **Historical data** preservation
- **Reporting capabilities**

---

## Best Practices

### 📝 Job Creation Tips
1. **Be specific** with job titles and requirements
2. **Use relevant keywords** for better AI matching
3. **Include both technical and soft skills**
4. **Set realistic experience levels**
5. **Review AI-generated content** before saving

### 📤 Resume Upload Guidelines
1. **Use clear file names** for easy identification
2. **Ensure good quality** PDF or DOC files
3. **Upload in batches** of 10-20 for optimal performance
4. **Check file sizes** stay under 10MB
5. **Review progress** during upload process

### 🎯 Candidate Evaluation
1. **Review match scores** in context of job requirements
2. **Read AI recommendations** but use human judgment
3. **Check candidate contact information** for accuracy
4. **Download and review** original resumes for final decisions
5. **Use filtering and sorting** to prioritize candidates

---

## Troubleshooting

### ❌ Common Issues & Solutions

#### Login Problems
- **Verify email and password** accuracy
- **Check internet connection**
- **Clear browser cache** if login fails
- **Contact administrator** for account issues

#### Upload Failures
- **Check file format** (PDF, DOC, DOCX, RTF, TXT only)
- **Verify file size** (under 10MB)
- **Ensure stable internet** connection
- **Try uploading fewer files** at once

#### Analysis Errors
- **Wait for upload completion** before starting analysis
- **Refresh page** if analysis appears stuck
- **Check that files are properly formatted** resumes
- **Retry analysis** if initial attempt fails

#### Performance Issues
- **Use modern browser** (Chrome, Firefox, Safari, Edge)
- **Close unnecessary tabs** to free memory
- **Check internet speed** for large file uploads
- **Upload during off-peak hours** for better performance

### 🆘 Getting Help
- **Check browser console** for error messages
- **Screenshot any error** messages for support
- **Note the exact steps** that led to the issue
- **Contact technical support** with detailed information

---

## System Limitations

### 📏 File Restrictions
- **Maximum file size:** 10MB per resume
- **Maximum batch size:** 20 files per upload
- **Supported formats:** PDF, DOC, DOCX, RTF, TXT only
- **Network timeout:** 30 seconds for large files

### 🤖 AI Analysis Scope
- **English language** resumes work best
- **Standard resume formats** provide better results
- **Matching accuracy** depends on job description quality
- **Processing time** varies with file size and batch size

### 🌐 Browser Compatibility
- **Requires modern browser** with JavaScript enabled
- **Minimum screen resolution:** 1024x768
- **Stable internet connection** required
- **Cookies must be enabled** for session management

---

## Contact & Support

### 📞 Technical Support
- **Email:** Support team contact information
- **Response time:** Business hours support
- **Documentation:** This guide and online help

### 💡 Feature Requests
- **Submit feedback** through the platform
- **Regular updates** and new features
- **User training** available upon request

---

*This guide covers the complete workflow from company registration to resume analysis. For additional features like MCQ tests, AI interviews, and meeting scheduling, please refer to the respective module documentation.*

**Last Updated:** October 2025  
**Version:** 2.0
