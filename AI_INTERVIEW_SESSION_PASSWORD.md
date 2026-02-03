# AI Interview Session Password Implementation

## Overview

This document describes the session password feature implementation for the AI Interview module, similar to the MCQ assessment system.

## Features Implemented

### 1. Database Schema Updates

- Added `sessionPassword` field to `AvatarAssessment` model (plain text for email display)
- Added `sessionPasswordHash` field to `AvatarAssessment` model (bcrypt hash for secure validation)

### 2. Session Password Generation

When an AI interview invitation is sent:

- A secure 8-character alphanumeric password is generated (e.g., "ABC123XY")
- The password is hashed using bcrypt with 12 salt rounds
- Both plain and hashed versions are stored in the database

**Files Modified:**

- `prisma/schema.prisma` - Added session password fields
- `src/pages/api/assessments/avatar/[assessmentId]/send-invite.ts` - Generates and stores password

### 3. Email Notification

The invitation email includes:

- Session password displayed prominently in a highlighted box
- Interview details (position, company, time limit)
- Instructions on how to use the password
- Direct link to the interview

**Email Template Features:**

- Professional design with gradient headers
- Password displayed in large, easy-to-read format
- Clear instructions and important notes
- Mobile-responsive layout

**Files Modified:**

- `src/lib/email.ts` - Added `sendAIInterviewInvitation()` helper function
- `src/pages/api/assessments/avatar/[assessmentId]/send-invite.ts` - Updated email template

### 4. Candidate Portal - Password Verification

When a candidate accesses the interview:

- A modal prompts for the session password before starting
- Password is verified against the bcrypt hash
- Modal is non-dismissible until correct password is entered
- Password input converts to uppercase automatically

**Files Modified:**

- `src/pages/assessment/avatar/[assessmentId]/take.tsx` - Added password modal and verification logic

### 5. Password Verification API

New API endpoint for secure password verification:

- `POST /api/assessments/avatar/[assessmentId]/verify-password`
- Uses bcrypt to compare provided password with stored hash
- Supports legacy plain text comparison as fallback
- Returns success/failure status

**Files Created:**

- `src/pages/api/assessments/avatar/[assessmentId]/verify-password.ts`

## How It Works

### For HR/Admin (Sending Invitation)

1. HR creates an AI interview assessment
2. HR clicks "Send Invite" button
3. System generates a session password (e.g., "ABC123XY")
4. Password is hashed and stored in database
5. Email is sent to candidate with password

### For Candidate (Taking Interview)

1. Candidate receives email with session password
2. Candidate clicks link to access interview
3. Modal appears asking for session password
4. Candidate enters the password from email
5. System verifies password via bcrypt comparison
6. If valid, interview starts; if invalid, error message shown
7. Candidate can proceed with interview

## Security Features

- **Bcrypt Hashing**: Passwords are hashed with 12 salt rounds
- **No Plain Text Comparison**: Primary verification uses hashed password
- **Non-Dismissible Modal**: Candidate cannot bypass password entry
- **Case-Insensitive**: Password accepts any case combination
- **Legacy Support**: Fallback to plain text for old records

## Example Email Format

```
🤖 AI Interview Invitation

Dear John Doe,

You have been invited to participate in an AI-powered interview for the
position of Senior Software Engineer at ABC Company.

📋 Interview Details:
- Position: Senior Software Engineer
- Company: ABC Company
- Interview Type: AI Avatar Interview
- Time Limit: 30 minutes

🔐 Session Password
ABC123XY

⚠️ Important Instructions:
- Click the button below to start your interview
- Enter your session password when prompted
- Ensure you have a stable internet connection
- Find a quiet place for the interview
- Make sure your camera and microphone are working

[🚀 Start AI Interview]
```

## Testing Checklist

- [x] Database schema updated with new fields
- [x] Password generation working correctly
- [x] Email sent with password included
- [x] Password modal appears on interview page
- [x] Password verification API working
- [x] Valid password allows interview access
- [x] Invalid password shows error message
- [x] Case-insensitive password entry working

## Files Modified

### Schema

- `prisma/schema.prisma`

### API Endpoints

- `src/pages/api/assessments/avatar/[assessmentId]/send-invite.ts`
- `src/pages/api/assessments/avatar/[assessmentId]/verify-password.ts` (NEW)

### Frontend

- `src/pages/assessment/avatar/[assessmentId]/take.tsx`

### Services

- `src/lib/email.ts`
- `src/lib/session-password-service.ts` (Already exists, reused from MCQ)

## Future Enhancements

1. **Password Expiry**: Add expiry time to session passwords
2. **Attempts Limit**: Limit number of password verification attempts
3. **SMS Delivery**: Option to send password via SMS
4. **Custom Password Format**: Allow HR to customize password format
5. **Two-Factor Authentication**: Add optional 2FA for extra security

## Related Documentation

- See `MCQ_SESSION_PASSWORD.md` for MCQ assessment password implementation
- See `AI_INTERVIEW_MODULE_DOCUMENTATION.md` for overall AI interview features
