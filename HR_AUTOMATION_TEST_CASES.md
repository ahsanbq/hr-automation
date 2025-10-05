# HR Automation Application - Complete Test Case Documentation

## Overview
This document contains comprehensive test cases for the HR Automation fullstack application with external AI API integration. The application includes authentication, job management, CV sorting with AI analysis, interview scheduling with AI agenda generation, meeting management, offer letters, LinkedIn publishing, user management, and analytics.

---

## Test Case Matrix

| Module | Test Case ID | Description | Pre-conditions | Steps | Expected Result | Actual Result (QA) | Status (QA) | Severity (QA) | Comments (QA) |
|--------|--------------|-------------|---------------|-------|-----------------|-------------------|-------------|---------------|--------------|
| **AUTHENTICATION MODULE** |
| Login | TC-001 | Login with valid credentials | User exists in database | 1. Navigate to /auth<br>2. Enter valid email and password<br>3. Click Login | Redirect to /analytics dashboard with success message | | | | |
| Login | TC-002 | Login with invalid credentials | None | 1. Navigate to /auth<br>2. Enter invalid email/password<br>3. Click Login | Show error message "Invalid credentials" | | | | |
| Login | TC-003 | Login with admin bypass credentials | None | 1. Navigate to /auth<br>2. Enter "admin@agmail.com" / "admin"<br>3. Click Login | Login successful with admin privileges | | | | |
| Login | TC-004 | Login with empty fields | None | 1. Navigate to /auth<br>2. Leave email/password empty<br>3. Click Login | Show validation error "Email and password required" | | | | |
| Login | TC-005 | Token persistence after login | Valid user credentials | 1. Login successfully<br>2. Refresh browser<br>3. Check if still logged in | User remains logged in, token persists | | | | |
| Registration | TC-006 | Register new user with valid data | None | 1. Navigate to /auth<br>2. Switch to Register tab<br>3. Fill all required fields<br>4. Submit | User created successfully, redirect to dashboard | | | | |
| Registration | TC-007 | Register with duplicate email | Email already exists | 1. Navigate to /auth<br>2. Use existing email<br>3. Submit registration | Show error "Email already in use" | | | | |
| Registration | TC-008 | Register with missing required fields | None | 1. Navigate to /auth<br>2. Leave required fields empty<br>3. Submit | Show validation errors for missing fields | | | | |
| Auth Protection | TC-009 | Access protected route without token | User not logged in | 1. Navigate directly to /analytics<br>2. Check redirection | Redirect to /auth page | | | | |
| Logout | TC-010 | Logout functionality | User logged in | 1. Click logout or clear token<br>2. Try to access protected routes | Redirect to /auth, token cleared | | | | |
| **JOB REQUIREMENTS MODULE** |
| Job Creation | TC-011 | Create job with basic information | User logged in | 1. Navigate to /job-requirements<br>2. Fill job details<br>3. Save without AI generation | Job saved successfully to database | | | | |
| Job Creation | TC-012 | Create job with AI generation | User logged in, External AI API available | 1. Navigate to /job-requirements<br>2. Fill basic details<br>3. Click "Generate with AI"<br>4. Review and save | AI-generated job description created and saved | | | | |
| Job Creation | TC-013 | Create job with missing required fields | User logged in | 1. Navigate to /job-requirements<br>2. Leave required fields empty<br>3. Try to save | Show validation errors, prevent saving | | | | |
| Job Creation | TC-014 | AI generation with external API timeout | User logged in, External API slow/down | 1. Fill job details<br>2. Click AI generate<br>3. Wait for timeout | Show timeout error message, fallback to manual | | | | |
| Job Creation | TC-015 | Edit existing job details | Job exists | 1. Navigate to manage jobs<br>2. Edit existing job<br>3. Update fields<br>4. Save | Job details updated successfully | | | | |
| Job Management | TC-016 | View all created jobs | Jobs exist in database | 1. Navigate to job-requirements<br>2. Switch to "Manage" tab | Display all jobs with correct details | | | | |
| Job Management | TC-017 | Search/filter jobs | Multiple jobs exist | 1. Enter search term in job list<br>2. Apply filters | Jobs filtered correctly based on criteria | | | | |
| Job Management | TC-018 | Delete job posting | Job exists | 1. Navigate to manage jobs<br>2. Click delete on a job<br>3. Confirm deletion | Job deleted, removed from list | | | | |
| Job Management | TC-019 | Edit AI-generated job description | Job with AI content exists | 1. Open job with AI content<br>2. Edit in modal<br>3. Save changes | AI content updated successfully | | | | |
| Job Management | TC-020 | Activate/deactivate job posting | Job exists | 1. Navigate to manage jobs<br>2. Toggle job status<br>3. Save | Job status updated correctly | | | | |
| **CV SORTING MODULE** |
| CV Upload | TC-021 | Upload CV links for AI analysis | Job exists, External AI API available | 1. Navigate to /cv-sorting/[jobId]<br>2. Click "Analyze New Resumes"<br>3. Paste CV URLs<br>4. Submit | CVs analyzed by AI, match scores displayed | | | | |
| CV Upload | TC-022 | Upload invalid CV links | Job exists | 1. Navigate to CV sorting<br>2. Enter invalid URLs<br>3. Submit for analysis | Show error for invalid URLs | | | | |
| CV Upload | TC-023 | CV analysis with external API failure | Job exists, External AI API down | 1. Submit CV URLs for analysis<br>2. API fails | Show fallback data with provisional scores | | | | |
| CV Upload | TC-024 | Upload empty CV links | Job exists | 1. Navigate to CV upload<br>2. Submit with empty text area | Show validation error "Please enter at least one resume URL" | | | | |
| CV Analysis | TC-025 | View detailed CV analysis results | CVs analyzed and stored | 1. Navigate to job's CV list<br>2. Click on a resume<br>3. View details | Display complete analysis: match score, skills, experience, etc. | | | | |
| CV Analysis | TC-026 | Sort CVs by match score | Multiple CVs exist | 1. Navigate to CV list<br>2. Sort by match score column | CVs sorted by score (high to low) | | | | |
| CV Analysis | TC-027 | Filter CVs by recommendation | CVs with different recommendations | 1. Apply recommendation filter<br>2. View filtered results | Only CVs with selected recommendation shown | | | | |
| CV Analysis | TC-028 | View CV statistics for job | Job with multiple CVs | 1. Navigate to job CV page<br>2. Check statistics section | Display total resumes, avg match score, recommendations | | | | |
| CV Analysis | TC-029 | Download/view original CV file | CV with valid URL exists | 1. Click "View Full Resume" button<br>2. Check if CV opens | Original CV file opens in new tab | | | | |
| CV Management | TC-030 | Delete CV from job | CV exists in job | 1. Navigate to CV list<br>2. Click delete on CV<br>3. Confirm | CV removed from job, database updated | | | | |
| **INTERVIEW MODULE** |
| Interview Scheduling | TC-031 | Schedule interview for candidate | Resume exists, no meeting scheduled | 1. Navigate to /interview/[jobId]<br>2. Click "Schedule Interview"<br>3. Fill meeting details<br>4. Save | Interview scheduled, meeting created in database | | | | |
| Interview Scheduling | TC-032 | Schedule interview with existing meeting | Resume already has meeting | 1. Try to schedule new interview<br>2. Submit | Show error "Meeting already exists for this resume" | | | | |
| Interview Scheduling | TC-033 | Schedule interview with missing required fields | Resume exists | 1. Navigate to interview scheduling<br>2. Leave required fields empty<br>3. Submit | Show validation errors for required fields | | | | |
| Interview Scheduling | TC-034 | Schedule interview with past date | Resume exists | 1. Select past date for meeting<br>2. Submit form | Show validation error for past date | | | | |
| Interview Scheduling | TC-035 | Update existing interview details | Meeting exists | 1. Navigate to meeting management<br>2. Update meeting details<br>3. Save | Meeting details updated successfully | | | | |
| AI Agenda Generation | TC-036 | Generate technical interview agenda | Resume and job exist, External AI API available | 1. Navigate to meeting management<br>2. Click "Generate Agenda"<br>3. Select "Technical" type | AI-generated technical agenda displayed | | | | |
| AI Agenda Generation | TC-037 | Generate behavioral interview agenda | Resume and job exist, External AI API available | 1. Generate agenda with "Behavioral" type | Behavioral interview agenda generated | | | | |
| AI Agenda Generation | TC-038 | Generate agenda with different difficulty levels | Resume exists | 1. Generate agenda with "Easy", "Medium", "Complex" types | Different agenda complexity levels generated | | | | |
| AI Agenda Generation | TC-039 | Generate agenda with external API failure | Resume exists, External AI API down | 1. Try to generate agenda<br>2. API fails | Show error message, allow manual agenda entry | | | | |
| AI Agenda Generation | TC-040 | Edit generated agenda | Agenda generated | 1. Click "Edit" on generated agenda<br>2. Modify content in modal<br>3. Save | Agenda updated with changes | | | | |
| **MEETING MANAGEMENT MODULE** |
| Meeting Management | TC-041 | View meeting details | Meeting exists | 1. Navigate to /meeting/meeting/[resumeId]<br>2. Check meeting form | All meeting details displayed correctly | | | | |
| Meeting Management | TC-042 | Update meeting status | Meeting exists | 1. Change meeting status<br>2. Save changes | Meeting status updated in database | | | | |
| Meeting Management | TC-043 | Add meeting notes | Meeting exists | 1. Navigate to meeting management<br>2. Add notes in text area<br>3. Save | Notes saved and persisted | | | | |
| Meeting Management | TC-044 | Auto-save meeting notes | Meeting exists | 1. Type in notes field<br>2. Click outside (blur event) | Notes auto-saved without manual save | | | | |
| Meeting Management | TC-045 | Rate interview performance | Meeting completed | 1. Navigate to meeting rating<br>2. Select rating (1-10)<br>3. Save rating | Rating saved and displayed | | | | |
| Meeting Management | TC-046 | View meeting statistics for job | Job with multiple meetings | 1. Navigate to job meeting page<br>2. Check statistics | Display meeting counts by status | | | | |
| Meeting Management | TC-047 | Multiple notes component | Meeting exists | 1. Add multiple notes to meeting<br>2. Save each note | All notes saved and displayed chronologically | | | | |
| Meeting Management | TC-048 | Meeting time validation | Meeting form open | 1. Enter invalid time format<br>2. Try to save | Show time format validation error | | | | |
| Meeting Management | TC-049 | Meeting link validation | Meeting form open | 1. Enter invalid URL for meeting link<br>2. Save | Show URL validation error or accept any text | | | | |
| Meeting Management | TC-050 | Delete meeting | Meeting exists | 1. Navigate to meeting<br>2. Delete meeting<br>3. Confirm | Meeting deleted from database | | | | |
| **USER MANAGEMENT MODULE** |
| User Management | TC-051 | View company users | Admin logged in, company has users | 1. Navigate to /users<br>2. Check user list | Display all users in company | | | | |
| User Management | TC-052 | Create new user | Admin logged in | 1. Click "Add User"<br>2. Fill user details<br>3. Submit | New user created successfully | | | | |
| User Management | TC-053 | Create user with duplicate email | Admin logged in, email exists | 1. Try to create user with existing email | Show error "Email already in use" | | | | |
| User Management | TC-054 | Create user without admin privileges | Non-admin user logged in | 1. Navigate to /users<br>2. Try to add user | Show access denied or hide add button | | | | |
| User Management | TC-055 | Create user with missing fields | Admin logged in | 1. Leave required fields empty<br>2. Submit | Show validation errors | | | | |
| User Management | TC-056 | View user list without company | Admin not bound to company | 1. Navigate to /users | Show empty list or appropriate message | | | | |
| User Management | TC-057 | User role validation | Admin creating user | 1. Select different user roles<br>2. Create user | User created with correct role | | | | |
| User Management | TC-058 | Password strength validation | Admin creating user | 1. Enter weak password<br>2. Submit | Show password strength requirements | | | | |
| **PROFILE MANAGEMENT MODULE** |
| Profile Management | TC-059 | View user profile | User logged in | 1. Navigate to /profile<br>2. Check profile data | Display user and company information | | | | |
| Profile Management | TC-060 | Update user profile | User logged in | 1. Edit profile fields<br>2. Save changes | Profile updated successfully | | | | |
| Profile Management | TC-061 | Update company information | User logged in | 1. Edit company details<br>2. Save changes | Company information updated | | | | |
| Profile Management | TC-062 | Upload company logo | User with company | 1. Click upload logo<br>2. Select image file<br>3. Upload | Logo uploaded and displayed | | | | |
| Profile Management | TC-063 | Upload invalid file format | User profile open | 1. Try to upload non-image file | Show file format validation error | | | | |
| Profile Management | TC-064 | Remove company logo | Company has logo | 1. Click remove logo<br>2. Confirm removal | Logo removed from profile | | | | |
| Profile Management | TC-065 | Update profile with invalid email | User logged in | 1. Enter invalid email format<br>2. Save | Show email validation error | | | | |
| Profile Management | TC-066 | Reset profile form | Changes made to form | 1. Make changes<br>2. Click Reset button | Form fields reset to original values | | | | |
| **OFFERS MODULE** |
| Offer Management | TC-067 | View offers for job | Job exists | 1. Navigate to /offers/[jobId]<br>2. Check offers list | Display all offers for the job | | | | |
| Offer Management | TC-068 | Create new offer | Job exists | 1. Fill offer form<br>2. Submit offer | Offer created and added to list | | | | |
| Offer Management | TC-069 | Send offer to candidate | Offer created | 1. Enter candidate email<br>2. Send offer | Offer status updated to "SENT" | | | | |
| Offer Management | TC-070 | Create offer with missing fields | Job open | 1. Leave required fields empty<br>2. Submit | Show validation errors | | | | |
| Offer Management | TC-071 | Create offer with invalid email | Job open | 1. Enter invalid email format<br>2. Submit | Show email validation error | | | | |
| Offer Management | TC-072 | View offer history | Multiple offers exist | 1. Navigate to offer history<br>2. Check list | All offers displayed with status | | | | |
| Offer Management | TC-073 | Update offer status | Offer exists | 1. Change offer status<br>2. Save | Status updated correctly | | | | |
| Offer Management | TC-074 | Delete offer | Offer exists | 1. Delete offer<br>2. Confirm | Offer removed from list | | | | |
| **LINKEDIN MODULE** |
| LinkedIn Publishing | TC-075 | Create LinkedIn post | User logged in | 1. Navigate to /linkedin<br>2. Fill post content<br>3. Save/Schedule | LinkedIn post created | | | | |
| LinkedIn Publishing | TC-076 | Schedule LinkedIn post | User logged in | 1. Create post<br>2. Set future schedule time<br>3. Submit | Post scheduled for future publication | | | | |
| LinkedIn Publishing | TC-077 | Include job details in post | Job exists, LinkedIn post created | 1. Toggle "Include Job Details"<br>2. Submit post | Post includes job information | | | | |
| LinkedIn Publishing | TC-078 | Create post with empty content | User logged in | 1. Leave content empty<br>2. Submit | Show validation error for required content | | | | |
| LinkedIn Publishing | TC-079 | View recent posts | Posts exist | 1. Navigate to LinkedIn page<br>2. Check recent posts section | Display recent posts list | | | | |
| LinkedIn Publishing | TC-080 | Schedule post with past date | User creating post | 1. Set past date for scheduling<br>2. Submit | Show validation error for past date | | | | |
| **ANALYTICS MODULE** |
| Analytics Dashboard | TC-081 | View analytics dashboard | User logged in, data exists | 1. Navigate to /analytics<br>2. Check all widgets | Display statistics cards, charts, recent activity | | | | |
| Analytics Dashboard | TC-082 | View statistics cards | Data exists | 1. Check stat cards section | Display correct metrics (jobs, resumes, meetings, etc.) | | | | |
| Analytics Dashboard | TC-083 | View charts and graphs | Data exists | 1. Check charts section | Display visual data representations | | | | |
| Analytics Dashboard | TC-084 | View recent activity | Activities exist | 1. Check recent activity section | Display latest system activities | | | | |
| Analytics Dashboard | TC-085 | Dashboard with no data | New system, no data | 1. Navigate to analytics | Display zero values or empty state messages | | | | |
| Analytics Dashboard | TC-086 | Dashboard data refresh | User logged in | 1. Perform actions in other modules<br>2. Return to analytics | Data updated with latest information | | | | |
| **NAVIGATION & LAYOUT** |
| Navigation | TC-087 | Sidebar navigation | User logged in | 1. Click each sidebar menu item<br>2. Check navigation | All menu items navigate to correct pages | | | | |
| Navigation | TC-088 | Page title and subtitle | User logged in | 1. Navigate to different pages<br>2. Check page headers | Correct titles and subtitles displayed | | | | |
| Navigation | TC-089 | Responsive design | User logged in | 1. Resize browser window<br>2. Check layout | Layout adapts to different screen sizes | | | | |
| Navigation | TC-090 | Loading states | User performing actions | 1. Trigger loading actions<br>2. Check loading indicators | Loading spinners/states displayed correctly | | | | |
| Navigation | TC-091 | Back navigation | User on sub-pages | 1. Use browser back button<br>2. Check functionality | Back navigation works correctly | | | | |
| **EXTERNAL API INTEGRATION** |
| AI Job Generation | TC-092 | AI job description generation | External AI API available | 1. Create job with AI<br>2. Call external API | AI-generated content received and processed | | | | |
| AI Job Generation | TC-093 | AI API timeout handling | External AI API slow | 1. Generate job description<br>2. Wait for timeout | Timeout handled gracefully with error message | | | | |
| AI Resume Analysis | TC-094 | Resume analysis via external API | External AI API available | 1. Submit resumes for analysis<br>2. Check API response | Resumes analyzed and scores calculated | | | | |
| AI Resume Analysis | TC-095 | Resume API error handling | External AI API returns error | 1. Submit invalid resume data<br>2. Check error handling | Error handled with fallback or user message | | | | |
| AI Interview Agenda | TC-096 | Interview agenda generation | External AI API available | 1. Generate interview agenda<br>2. Check API call | Agenda generated based on resume and job data | | | | |
| AI Interview Agenda | TC-097 | Agenda API rate limiting | External AI API rate limited | 1. Make multiple rapid requests<br>2. Check handling | Rate limiting handled appropriately | | | | |
| **DATABASE OPERATIONS** |
| Database | TC-098 | Data persistence | User performing CRUD operations | 1. Create, update, delete records<br>2. Check database | All operations persist correctly to database | | | | |
| Database | TC-099 | Database connection failure | Database unavailable | 1. Perform database operations<br>2. Check error handling | Database errors handled gracefully | | | | |
| Database | TC-100 | Data validation | User entering invalid data | 1. Submit invalid data formats<br>2. Check validation | Database validation prevents invalid data | | | | |
| Database | TC-101 | Foreign key constraints | User deleting referenced data | 1. Delete record with dependencies<br>2. Check constraints | Foreign key constraints enforced correctly | | | | |
| Database | TC-102 | Transaction integrity | User performing complex operations | 1. Perform multi-step operations<br>2. Check consistency | Database transactions maintain integrity | | | | |
| **SECURITY & PERMISSIONS** |
| Security | TC-103 | JWT token validation | User with valid/invalid token | 1. Access API with different tokens<br>2. Check authorization | Only valid tokens allow access | | | | |
| Security | TC-104 | Route protection | Unauthenticated user | 1. Access protected routes without token<br>2. Check redirection | Unauthorized access redirected to login | | | | |
| Security | TC-105 | Role-based access control | Users with different roles | 1. Access admin-only features<br>2. Check permissions | Role-based access enforced correctly | | | | |
| Security | TC-106 | Input sanitization | User entering malicious input | 1. Submit XSS/injection attempts<br>2. Check sanitization | Malicious input sanitized or rejected | | | | |
| Security | TC-107 | Password hashing | User registration/login | 1. Register user<br>2. Check password storage | Passwords stored as secure hashes | | | | |
| **ERROR HANDLING & EDGE CASES** |
| Error Handling | TC-108 | Network connectivity issues | User with poor connection | 1. Perform actions with network issues<br>2. Check error handling | Network errors handled with user feedback | | | | |
| Error Handling | TC-109 | Server error responses | Server returns 5xx errors | 1. Trigger server errors<br>2. Check error handling | Server errors handled gracefully | | | | |
| Error Handling | TC-110 | Large file uploads | User uploading large files | 1. Upload oversized files<br>2. Check limits | File size limits enforced with error messages | | | | |
| Error Handling | TC-111 | Concurrent user actions | Multiple users modifying same data | 1. Have multiple users edit same record<br>2. Check conflicts | Concurrent access handled appropriately | | | | |
| Error Handling | TC-112 | Browser compatibility | Different browsers | 1. Test application in various browsers<br>2. Check functionality | Application works across supported browsers | | | | |
| **PERFORMANCE & SCALABILITY** |
| Performance | TC-113 | Page load times | User navigating between pages | 1. Navigate through application<br>2. Measure load times | Pages load within acceptable time limits | | | | |
| Performance | TC-114 | Large dataset handling | System with many records | 1. Load pages with large datasets<br>2. Check performance | Large datasets handled with pagination/optimization | | | | |
| Performance | TC-115 | API response times | User triggering API calls | 1. Perform various API operations<br>2. Measure response times | API responses within acceptable limits | | | | |
| Performance | TC-116 | Memory usage | Extended application usage | 1. Use application for extended period<br>2. Check memory usage | No memory leaks or excessive usage | | | | |
| Performance | TC-117 | Caching mechanisms | User accessing cached data | 1. Access same data multiple times<br>2. Check caching | Appropriate caching improves performance | | | | |

---

## Test Environment Requirements

### Prerequisites
- **Frontend**: Next.js application running on localhost:3000
- **Database**: PostgreSQL with Prisma ORM
- **External API**: hr-recruitment-ai-api.onrender.com (available and responding)
- **Authentication**: JWT-based auth system
- **File Storage**: File upload capabilities for logos/documents

### Test Data Requirements
- **Companies**: At least 2 test companies
- **Users**: Admin, Manager, and regular users with different roles
- **Jobs**: Multiple job postings with various states
- **Resumes**: Test CV URLs for AI analysis
- **Meetings**: Scheduled and completed meetings
- **External API**: Active and responsive AI service endpoints

### Browser Compatibility
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Performance Benchmarks
- Page load time: < 3 seconds
- API response time: < 5 seconds
- External AI API timeout: 30 seconds
- File upload limit: Check configuration

---

## Test Execution Guidelines

### Priority Levels
- **High**: Authentication, Core CRUD operations, External API integration
- **Medium**: UI/UX features, Validation, Error handling
- **Low**: Performance optimization, Advanced features

### Severity Levels
- **Critical**: Application breaking, Security vulnerabilities, Data loss
- **High**: Major functionality broken, User cannot complete key tasks
- **Medium**: Minor functionality issues, Workarounds available
- **Low**: Cosmetic issues, Enhancement requests

### Test Status
- **Pass**: Functionality works as expected
- **Fail**: Functionality does not work as expected
- **Blocked**: Cannot test due to dependencies
- **Skip**: Test not applicable in current environment

---

## Notes for QA Team

1. **External API Dependencies**: Many test cases depend on the external AI API (hr-recruitment-ai-api.onrender.com). If this service is down, use the fallback scenarios or mock responses.

2. **Data Cleanup**: Ensure test data is cleaned up after each test cycle to prevent interference between test runs.

3. **Environment Variables**: Verify all required environment variables are set, especially DATABASE_URL, JWT_SECRET, and external API endpoints.

4. **File Uploads**: Test with various file types and sizes to verify upload limitations and error handling.

5. **Token Expiration**: Test behavior when JWT tokens expire during user sessions.

6. **Database Constraints**: Verify that database relationships and constraints are properly enforced.

7. **Cross-Browser Testing**: Ensure consistent behavior across different browsers and devices.

8. **Performance Monitoring**: Monitor application performance during testing, especially with large datasets.

This comprehensive test suite covers all major functionality of the HR automation application including frontend, backend, database operations, external API integration, and security features.
