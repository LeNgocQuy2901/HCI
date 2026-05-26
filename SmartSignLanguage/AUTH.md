# Authentication System Documentation

## Overview

This project includes a complete authentication system with user registration, login, and profile management using JWT tokens and SQLite database.

## Technology Stack

- **Database:** SQLite (better-sqlite3)
- **Password Hashing:** bcryptjs
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Zod
- **State Management:** Zustand
- **Frontend:** React + React Hook Form

## Architecture

### Backend Components

#### 1. Database (`server/db.ts`)
- Initializes SQLite database
- Creates `users` and `learning_progress` tables
- Manages database connections

#### 2. User Model (`server/models/user.ts`)
- `UserService` class for user operations
- Password hashing and verification
- User creation, retrieval, and updates
- Validation schemas for register/login

#### 3. Authentication (`server/auth.ts`)
- JWT token generation and verification
- Token payload handling
- Token extraction from headers

#### 4. Middleware (`server/middleware/auth.ts`)
- `authMiddleware` - Requires valid JWT token
- `optionalAuthMiddleware` - JWT token is optional
- Token validation and user injection

#### 5. Routes (`server/routes/auth.ts`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)
- `PUT /api/auth/me` - Update user profile (requires auth)
- `POST /api/auth/logout` - Logout (client-side only)

### Frontend Components

#### 1. Auth Store (`client/hooks/use-auth.ts`)
- Zustand store for auth state management
- Login, register, logout functions
- Token and user persistence
- localStorage integration

#### 2. Login Page (`client/pages/Login.tsx`)
- Email/password login form
- Validation with Zod
- Error handling and loading states

#### 3. Register Page (`client/pages/Register.tsx`)
- Email/username/password registration
- Full name requirement
- Password confirmation
- Form validation

#### 4. Profile Page (`client/pages/Profile.tsx`)
- Display user information
- Edit profile (full name)
- Logout functionality
- Member since date

## API Endpoints

### Register
**POST** `/api/auth/register`

Request body:
```json
{
  "email": "user@example.com",
  "username": "john_doe",
  "password": "securepass123",
  "fullName": "John Doe"
}
```

Response (201):
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_...",
    "email": "user@example.com",
    "username": "john_doe",
    "fullName": "John Doe",
    "createdAt": "2025-01-01T12:00:00Z",
    "updatedAt": "2025-01-01T12:00:00Z"
  },
  "token": "eyJhbGc..."
}
```

### Login
**POST** `/api/auth/login`

Request body:
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

Response (200):
```json
{
  "message": "Login successful",
  "user": {...},
  "token": "eyJhbGc..."
}
```

### Get Current User
**GET** `/api/auth/me`

Headers:
```
Authorization: Bearer <token>
```

Response (200):
```json
{
  "user": {...}
}
```

### Update User
**PUT** `/api/auth/me`

Headers:
```
Authorization: Bearer <token>
Content-Type: application/json
```

Request body:
```json
{
  "fullName": "Jane Doe"
}
```

Response (200):
```json
{
  "message": "User updated successfully",
  "user": {...}
}
```

### Logout
**POST** `/api/auth/logout`

Response (200):
```json
{
  "message": "Logout successful"
}
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Database
DATABASE_PATH=./data/app.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Admin bootstrap
# Comma-separated emails that should be promoted to admin at register/login.
ADMIN_EMAILS=admin@example.com

# Server
PORT=8080
HOST=localhost

# Environment
NODE_ENV=development

# Ping Message
PING_MESSAGE=pong
```

**Important:** Change `JWT_SECRET` to a secure random string in production.

## Usage Examples

### Frontend - Login
```typescript
import { useAuthStore } from "@/hooks/use-auth";

function MyComponent() {
  const { user, isAuthenticated, login } = useAuthStore();

  const handleLogin = async () => {
    try {
      await login("user@example.com", "password123");
      console.log("Logged in successfully");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.fullName}</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### Frontend - Register
```typescript
const { register } = useAuthStore();

await register(
  "user@example.com",
  "john_doe",
  "password123",
  "John Doe"
);
```

### Frontend - Logout
```typescript
const { logout } = useAuthStore();

await logout();
```

### Frontend - Access Protected Routes
```typescript
import { useAuthStore } from "@/hooks/use-auth";
import { useEffect } from "react";

function ProtectedComponent() {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated]);

  return <div>Protected content</div>;
}
```

## Token Storage

Tokens are stored in browser's localStorage:
- `auth_token` - JWT token
- `auth_user` - User object (JSON)

The `useAuthStore` hook automatically manages this storage.

## Security Considerations

1. **JWT Secret** - Change the default JWT_SECRET in production
2. **HTTPS Only** - Use HTTPS in production for token transmission
3. **Secure Cookies** - Consider storing tokens in secure HTTP-only cookies
4. **Token Expiration** - Default 7 days, adjust as needed
5. **Password Strength** - Consider adding password strength requirements
6. **Rate Limiting** - Add rate limiting to auth endpoints in production

## Database Schema

### users table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  fullName TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
)
```

### learning_progress table
```sql
CREATE TABLE learning_progress (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  cardId TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  attempts INTEGER NOT NULL DEFAULT 0,
  lastReviewed TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(userId, cardId)
)
```

## Development

### Start Development Server
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Type Check
```bash
npm run typecheck
```

### Run Tests
```bash
npm test
```

## Next Steps

Consider implementing:
- Email verification
- Password reset functionality
- Social login (Google, GitHub, etc.)
- Two-factor authentication (2FA)
- Rate limiting on auth endpoints
- CSRF protection
- Account deactivation
- User roles and permissions
- OAuth2 integration
