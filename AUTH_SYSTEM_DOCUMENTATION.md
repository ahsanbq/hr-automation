# HR Automation Authentication System Documentation

## Overview

This document provides a complete guide to the authentication system implemented for the HR Automation application. The system supports company registration, user creation, and role-based access control.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema Used](#database-schema-used)
3. [API Endpoints](#api-endpoints)
4. [Frontend Implementation](#frontend-implementation)
5. [Authentication Flow](#authentication-flow)
6. [Testing Guide](#testing-guide)
7. [Database Verification](#database-verification)

---

## Architecture Overview

### Authentication Types

- **Signup**: Company registration only (creates company + admin user)
- **Login**: Universal login for both company admins and regular users

### User Hierarchy

```
Company (Organization)
├── Admin User (created during company signup)
│   ├── Can create other users
│   ├── Full access to company data
│   └── User management permissions
├── Manager Users (created by admin)
│   ├── Department-level access
│   └── Limited management permissions
└── Company Users (created by admin)
    ├── Basic access
    └── Assigned task permissions
```

---

## Database Schema Used

### Tables and Fields

#### 1. Company Table

```sql
CREATE TABLE companies (
  id              SERIAL PRIMARY KEY,
  companyUuid     UUID UNIQUE DEFAULT gen_random_uuid(),
  name            VARCHAR NOT NULL,
  address         TEXT NOT NULL,
  country         VARCHAR NOT NULL,
  logo            VARCHAR,
  mapLocation     VARCHAR,
  linkedinProfile VARCHAR,
  website         VARCHAR,
  createdAt       TIMESTAMP DEFAULT NOW(),
  updatedAt       TIMESTAMP DEFAULT NOW()
);
```

#### 2. User Table

```sql
CREATE TABLE users (
  id        SERIAL PRIMARY KEY,
  email     VARCHAR UNIQUE NOT NULL,
  name      VARCHAR NOT NULL,
  password  VARCHAR NOT NULL, -- bcrypt hashed
  type      VARCHAR NOT NULL CHECK (type IN ('ADMIN', 'MANAGER', 'COMPANY_USER')),
  companyId INTEGER REFERENCES companies(id),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### Key Relationships

- **Company → Users**: One-to-Many (A company can have multiple users)
- **Users → Company**: Many-to-One (Each user belongs to one company)

### Database Constraints

1. **Email Uniqueness**: Emails must be unique across the entire system
2. **Company Name**: Company names should be unique
3. **User Types**: Only ADMIN, MANAGER, COMPANY_USER are allowed
4. **Company Association**: All users (except system admins) must belong to a company

---

## API Endpoints

### 1. Company Signup

```http
POST /api/auth/signup
Content-Type: application/json

{
  "companyName": "TechCorp Inc",
  "companyAddress": "123 Tech Street, Silicon Valley",
  "companyCountry": "USA",
  "companyWebsite": "https://techcorp.com", // optional
  "adminName": "John Admin",
  "adminEmail": "admin@techcorp.com",
  "adminPassword": "securepassword123"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Company registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@techcorp.com",
      "name": "John Admin",
      "type": "ADMIN",
      "companyId": 1,
      "company": {
        "id": 1,
        "name": "TechCorp Inc",
        "companyUuid": "550e8400-e29b-41d4-a716-446655440000"
      }
    },
    "company": {
      "id": 1,
      "name": "TechCorp Inc",
      "address": "123 Tech Street, Silicon Valley",
      "country": "USA"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Universal Login

```http
POST /api/login
Content-Type: application/json

{
  "email": "admin@techcorp.com",
  "password": "securepassword123"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@techcorp.com",
      "name": "John Admin",
      "type": "ADMIN",
      "companyId": 1,
      "company": {
        "id": 1,
        "name": "TechCorp Inc",
        "companyUuid": "550e8400-e29b-41d4-a716-446655440000"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Create User (Admin Only)

```http
POST /api/auth/create-user
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "email": "manager@techcorp.com",
  "password": "password123",
  "name": "Jane Manager",
  "type": "MANAGER"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": 2,
      "email": "manager@techcorp.com",
      "name": "Jane Manager",
      "type": "MANAGER",
      "companyId": 1,
      "company": {
        "id": 1,
        "name": "TechCorp Inc"
      }
    }
  }
}
```

### 4. Get Company Users

```http
GET /api/companies/users
Authorization: Bearer <jwt_token>
```

**Response (Success):**

```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "email": "admin@techcorp.com",
      "name": "John Admin",
      "type": "ADMIN",
      "companyId": 1,
      "createdAt": "2025-09-12T10:00:00Z",
      "company": {
        "id": 1,
        "name": "TechCorp Inc",
        "companyUuid": "550e8400-e29b-41d4-a716-446655440000"
      }
    },
    {
      "id": 2,
      "email": "manager@techcorp.com",
      "name": "Jane Manager",
      "type": "MANAGER",
      "companyId": 1,
      "createdAt": "2025-09-12T10:05:00Z"
    }
  ]
}
```

---

## Frontend Implementation

### Pages Created

1. **`/signup`** - Company registration page
2. **`/login`** - Universal login page
3. **`/dashboard`** - Main dashboard after login
4. **`/users`** - User management page (Admin only)

### Key Features

#### Signup Page (`/signup`)

- Company information form
- Admin user creation
- Form validation
- Automatic login after signup
- Responsive design with Ant Design

#### Login Page (`/login`)

- Universal login form
- Supports both company admin and regular users
- JWT token storage
- Automatic redirect to dashboard

#### Dashboard (`/dashboard`)

- User information display
- Company information display
- Role-based action buttons
- Authentication state management

#### User Management (`/users`)

- Create new users (Admin only)
- View all company users
- User type management
- Role-based access control

### Authentication State Management

```javascript
// Token storage
localStorage.setItem("token", jwt_token);
localStorage.setItem("user", JSON.stringify(user_data));

// Authentication check
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

// API calls with authentication
fetch("/api/endpoint", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
```

---

## Authentication Flow

### 1. Company Registration Flow

```
User visits /signup
↓
Fills company & admin details
↓
POST /api/auth/signup
↓
Database Transaction:
  - Create Company record
  - Create Admin User record
  - Link User to Company
↓
Generate JWT token
↓
Return user + company + token
↓
Store token in localStorage
↓
Redirect to /dashboard
```

### 2. Login Flow

```
User visits /login
↓
Enters email & password
↓
POST /api/login
↓
Database Query:
  - Find user by email
  - Verify password (bcrypt)
  - Include company data
↓
Generate JWT token
↓
Return user + token
↓
Store token in localStorage
↓
Redirect to /dashboard
```

### 3. User Creation Flow (Admin Only)

```
Admin visits /users
↓
Clicks "Add New User"
↓
Fills user details
↓
POST /api/auth/create-user
↓
Verify admin permissions
↓
Create user in same company
↓
Return new user data
↓
Refresh users list
```

---

## Testing Guide

### Prerequisites

1. **Database Setup**: Ensure PostgreSQL is running
2. **Environment**: Set correct DATABASE_URL in .env
3. **Dependencies**: Run `npm install`
4. **Prisma**: Run `npx prisma generate` and `npx prisma db push`

### Step-by-Step Testing

#### 1. Test Company Registration

```bash
# Start the application
npm run dev

# Navigate to http://localhost:3000/signup
# Fill the form with:
```

- **Company Name**: "Test Company Inc"
- **Company Address**: "123 Test Street, Test City"
- **Company Country**: "USA"
- **Company Website**: "https://testcompany.com"
- **Admin Name**: "Test Admin"
- **Admin Email**: "admin@testcompany.com"
- **Admin Password**: "password123"

**Expected Result**:

- Company created successfully
- Admin user created
- Automatic login
- Redirect to dashboard

#### 2. Test Login

```bash
# Navigate to http://localhost:3000/login
# Use the credentials from step 1:
```

- **Email**: "admin@testcompany.com"
- **Password**: "password123"

**Expected Result**:

- Successful login
- User data displayed on dashboard
- Company information visible

#### 3. Test User Creation (Admin Function)

```bash
# After logging in as admin
# Navigate to http://localhost:3000/users
# Click "Add New User"
# Fill the form:
```

- **Name**: "Test Manager"
- **Email**: "manager@testcompany.com"
- **User Type**: "Manager"
- **Password**: "password123"

**Expected Result**:

- New user created
- User appears in users list
- Success message displayed

#### 4. Test User Login

```bash
# Logout from admin account
# Navigate to http://localhost:3000/login
# Use the new user credentials:
```

- **Email**: "manager@testcompany.com"
- **Password**: "password123"

**Expected Result**:

- Successful login as Manager
- Dashboard shows Manager role
- Limited access (no "Manage Users" button)

---

## Database Verification

### Check Created Records

#### 1. Verify Company Creation

```sql
-- Connect to your PostgreSQL database
SELECT * FROM companies ORDER BY id DESC LIMIT 5;
```

**Expected Output**:

```
id | companyUuid | name | address | country | website | createdAt
1  | 550e8400... | Test Company Inc | 123 Test Street... | USA | https://... | 2025-09-12...
```

#### 2. Verify User Creation

```sql
SELECT
  u.id,
  u.email,
  u.name,
  u.type,
  u.companyId,
  c.name as company_name
FROM users u
JOIN companies c ON u.companyId = c.id
ORDER BY u.id DESC;
```

**Expected Output**:

```
id | email | name | type | companyId | company_name
1  | admin@testcompany.com | Test Admin | ADMIN | 1 | Test Company Inc
2  | manager@testcompany.com | Test Manager | MANAGER | 1 | Test Company Inc
```

#### 3. Verify Password Hashing

```sql
SELECT email, password FROM users WHERE email = 'admin@testcompany.com';
```

**Expected Output**:

- Password should be a bcrypt hash (starts with `$2b$` or `$2a$`)
- NOT the plain text password

#### 4. Check Relationships

```sql
-- Verify company-user relationship
SELECT
  c.name as company,
  COUNT(u.id) as user_count,
  STRING_AGG(u.type, ', ') as user_types
FROM companies c
LEFT JOIN users u ON c.id = u.companyId
GROUP BY c.id, c.name;
```

### Database Schema Verification

#### Check Tables Exist

```sql
-- List all tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

**Expected Tables**:

- companies
- users
- (other tables from schema)

#### Check Constraints

```sql
-- Check user type constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'users';

-- Check foreign key relationships
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

---

## Security Implementation

### Password Security

- **Hashing**: bcrypt with 12 salt rounds
- **Validation**: Minimum 6 characters
- **Storage**: Never store plain text passwords

### JWT Security

- **Secret**: Environment variable JWT_SECRET
- **Expiry**: 7 days default
- **Payload**: Contains userId, email, type, companyId

### Authorization

- **Role-based**: Different access levels for ADMIN, MANAGER, COMPANY_USER
- **Company isolation**: Users can only access their company's data
- **API protection**: All sensitive endpoints require valid JWT

### Input Validation

- **Email format**: Regex validation
- **Required fields**: Server-side validation
- **XSS prevention**: Ant Design components with built-in protection

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

```
Error: Can't reach database server
```

**Solution**: Check DATABASE_URL in .env file and ensure PostgreSQL is running

#### 2. Prisma Client Error

```
PrismaClientInitializationError
```

**Solution**: Run `npx prisma generate` and `npx prisma db push`

#### 3. JWT Token Invalid

```
401 Unauthorized
```

**Solution**: Check JWT_SECRET in .env and ensure token is passed correctly

#### 4. User Type Errors

```
Invalid user type
```

**Solution**: Ensure user types are exactly "ADMIN", "MANAGER", or "COMPANY_USER"

### Debug Commands

```bash
# Check database schema
npx prisma db pull

# Reset database (development only)
npx prisma db push --force-reset

# View database in browser
npx prisma studio

# Check environment variables
echo $DATABASE_URL
```

---

## Conclusion

The authentication system is now fully implemented with:

✅ **Company Registration**: Companies can sign up with admin user
✅ **Universal Login**: Both admins and users can log in
✅ **User Management**: Admins can create company users
✅ **Role-based Access**: Different permissions for different user types
✅ **Database Integration**: Proper relational data storage
✅ **Security**: Password hashing, JWT tokens, input validation
✅ **Frontend UI**: Complete user interface with Ant Design

The system is ready for further development of HR automation features like job posting, resume management, and interview scheduling.
