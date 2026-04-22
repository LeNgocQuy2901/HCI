# Authentication Quick Start Guide

## Setup in 5 Minutes

### 1. Install Dependencies ✓
Dependencies are already installed. If you need to reinstall:
```bash
npm install
npm install better-sqlite3 bcryptjs jsonwebtoken zustand
npm install -D @types/bcryptjs @types/jsonwebtoken
```

### 2. Create Environment File
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

**Important:** Update `JWT_SECRET` in `.env` to a secure random string:
```bash
JWT_SECRET=$(openssl rand -base64 32)
```

Or manually: Generate a random string at least 32 characters long.

### 3. Start Development Server
```bash
npm run dev
```

The application will start at `http://localhost:8080`

### 4. Test the Auth System

#### Create an Account
1. Navigate to `http://localhost:8080/register`
2. Fill in the form:
   - Full Name: John Doe
   - Email: john@example.com
   - Username: johndoe
   - Password: MySecurePass123
3. Click "Create Account"

#### Login
1. Navigate to `http://localhost:8080/login`
2. Enter your email and password
3. You'll be redirected to home page

#### View Profile
1. Click your avatar/profile menu (if implemented in header)
2. Or navigate to `/profile`

#### Logout
1. Go to `/profile`
2. Click "Logout" button

### 5. API Testing with cURL

#### Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPass123",
    "fullName": "Test User"
  }'
```

#### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

#### Get Current User (using token from login)
```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer <TOKEN_FROM_LOGIN>"
```

#### Update User Profile
```bash
curl -X PUT http://localhost:8080/api/auth/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_FROM_LOGIN>" \
  -d '{
    "fullName": "Updated Name"
  }'
```

## Project Structure

```
SmartSignLanguage/
├── server/
│   ├── db.ts                    # Database initialization
│   ├── auth.ts                  # JWT utilities
│   ├── index.ts                 # Express server setup
│   ├── models/
│   │   └── user.ts             # User model & service
│   ├── middleware/
│   │   └── auth.ts             # Auth middleware
│   └── routes/
│       └── auth.ts             # Auth endpoints
├── client/
│   ├── App.tsx                 # Main app with auth init
│   ├── hooks/
│   │   └── use-auth.ts         # Auth state management
│   └── pages/
│       ├── Login.tsx           # Login page
│       ├── Register.tsx        # Register page
│       └── Profile.tsx         # Profile page
├── shared/
│   └── api.ts                  # Shared types
├── data/                       # Database (auto-created)
│   └── app.db
├── .env                        # Environment variables
├── .env.example                # Environment template
└── AUTH.md                     # Full documentation
```

## Common Issues & Solutions

### Issue: "Database initialization failed"
**Solution:** Check that the `data/` directory can be created. Ensure write permissions.

### Issue: "JWT token expired"
**Solution:** Log out and log back in. Tokens are valid for 7 days by default.

### Issue: "User already exists"
**Solution:** Use a different email or username when registering.

### Issue: "Invalid token"
**Solution:** 
- Check that the token is included in the Authorization header
- Format: `Authorization: Bearer <TOKEN>`
- Ensure the token is not expired

### Issue: CORS errors
**Solution:** Make sure you're accessing the app on the correct port (8080 for dev).

## Database

The SQLite database is automatically created at `data/app.db` on first run.

**To reset the database:**
```bash
# Delete the database file
rm data/app.db

# Restart the server - it will recreate the database
npm run dev
```

## Next Steps

1. **Customize User Model:**
   - Add profile picture/avatar
   - Add bio/about section
   - Add preferences/settings

2. **Add Email Verification:**
   - Send verification email on signup
   - Require email verification before login

3. **Add Password Reset:**
   - Forgot password form
   - Email-based password reset link

4. **Add Social Login:**
   - Google OAuth
   - GitHub OAuth
   - Apple Sign In

5. **Add 2FA:**
   - TOTP (Time-based One-Time Password)
   - SMS verification

## Resources

- [JWT.io](https://jwt.io) - JWT documentation
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) - Password hashing
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - SQLite for Node.js
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [React Hook Form](https://react-hook-form.com) - Form handling
- [Zod](https://zod.dev) - Schema validation

## Support

For issues or questions, check the full documentation in `AUTH.md`
