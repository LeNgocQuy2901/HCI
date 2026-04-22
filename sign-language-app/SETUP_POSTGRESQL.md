# PostgreSQL Setup Guide for SmartSign

## 🚀 Quick Setup (Choose Your Method)

### Method 1: PostgreSQL Official Installer (Recommended)
1. **Download PostgreSQL for Windows**
   - Go to: https://www.postgresql.org/download/windows/
   - Download PostgreSQL 15 or 16
   - Run the installer

2. **During Installation:**
   - Set password for `postgres` user (remember this!)
   - Port: Keep as 5432
   - Locale: English, United States
   - Install pgAdmin 4 (optional, helpful GUI tool)

3. **After Installation:**
   - PostgreSQL service should start automatically
   - Verify by opening pgAdmin 4 or command prompt

### Method 2: Chocolatey (If You Have It)
```powershell
# Run as Administrator
choco install postgresql

# Verify installation
psql --version
```

---

## 🗄️ Create Database and User

### Using PowerShell (Windows)

```powershell
# Open PowerShell and connect to PostgreSQL
psql -U postgres

# You'll be prompted for password (set during installation)
```

### Inside PostgreSQL CLI

```sql
-- Create the database
CREATE DATABASE hcl_db;

-- Create a user for the application
CREATE USER hcl_user WITH PASSWORD 'hcl_password';

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE hcl_db TO hcl_user;

-- Verify (optional)
\l                        -- List databases
\du                       -- List users
\q                        -- Quit
```

---

## 🔐 Set Environment Variable

### PowerShell (Current Session Only)
```powershell
$env:DATABASE_URL = "postgresql://hcl_user:hcl_password@localhost:5432/hcl_db"

# Verify
Write-Host $env:DATABASE_URL
```

### PowerShell (Permanent - User Level)
```powershell
[System.Environment]::SetEnvironmentVariable("DATABASE_URL", "postgresql://hcl_user:hcl_password@localhost:5432/hcl_db", "User")

# Requires restart of terminal/IDE
```

### PowerShell (Permanent - System Level - Admin Required)
```powershell
# Run PowerShell as Administrator
[System.Environment]::SetEnvironmentVariable("DATABASE_URL", "postgresql://hcl_user:hcl_password@localhost:5432/hcl_db", "Machine")

# Requires full restart
```

---

## ✅ Verify PostgreSQL is Running

### PowerShell
```powershell
# Check if PostgreSQL service is running
Get-Service -Name "postgresql*"

# Should show: Running    PostGres...
```

### Command Prompt
```cmd
# Try connecting
psql -U postgres -d postgres

# If successful, you're connected and can exit with \q
```

---

## 🗂️ Apply Database Migrations

### Terminal Commands

```bash
# Navigate to backend directory
cd d:\GitHub\HCL\sign-language-app\backend

# Set environment variable (if not set already)
$env:DATABASE_URL = "postgresql://hcl_user:hcl_password@localhost:5432/hcl_db"

# Check current migration status
python migrate.py current
# Should show: No version found (first time)

# Apply all migrations
python migrate.py upgrade
# Should show: Running upgrade... and create tables

# Verify migration applied
python migrate.py current
# Should show: 001_initial_learning_tables
```

---

## 🌱 Seed Sample Data

```bash
cd d:\GitHub\HCL\sign-language-app\backend

# Load sample data
python seed.py

# Or seed specific data types
python seed.py lessons          # Just lessons
python seed.py vocabularies     # Just vocabularies
python seed.py quizzes          # Just quizzes

# Clear all data (optional)
python seed.py --clear
```

---

## 🧪 Verify Everything Works

### Test Database Connection
```bash
cd d:\GitHub\HCL\sign-language-app\backend

# This should work without errors
python -c "from app.config import settings; print('✓ Config loaded'); print('DB URL:', settings.database_url)"
```

### Test API with Database
```bash
# Backend should already be running
# Test learning endpoint (now should work with data)
curl http://localhost:8000/api/learn/lessons
```

### Run Full Test Suite
```bash
cd d:\GitHub\HCL\sign-language-app\backend
python test_project.py
# Should show: All tests passing ✓
```

---

## 🌐 Start Frontend Development

```bash
cd d:\GitHub\HCL\sign-language-app\frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev

# Access at: http://localhost:5173
```

---

## 📊 Complete System URLs

| Component | URL | Status |
|-----------|-----|--------|
| Backend API | http://localhost:8000 | 🟢 Running |
| API Documentation | http://localhost:8000/docs | 📖 Available |
| Frontend App | http://localhost:5173 | 🚀 Start with npm |
| pgAdmin (if installed) | http://localhost:5050 | 🔧 Database GUI |

---

## ⚠️ Troubleshooting

### "Connection refused" error
```
✗ Error: (psycopg2.OperationalError) connection to server at "localhost" 
(::1), port 5432 failed: Connection refused
```
**Solution:** PostgreSQL service is not running
- Windows: Check Services app for "postgresql-x64-15"
- Restart the service if stopped

### "Password authentication failed"
```
✗ Error: password authentication failed
```
**Solution:** Wrong password or user doesn't exist
- Verify you created the user with correct password
- Verify DATABASE_URL environment variable is correct

### "Database 'hcl_db' does not exist"
```
✗ Error: database "hcl_db" does not exist
```
**Solution:** Database creation step was skipped
- Create database: `CREATE DATABASE hcl_db;`

### "Relation does not exist" (during test)
```
✗ Error: relation "lessons" does not exist
```
**Solution:** Migrations haven't been applied
- Run: `python migrate.py upgrade`

---

## 🔧 Configuration Checklist

- [ ] PostgreSQL installed and service running
- [ ] Database `hcl_db` created
- [ ] User `hcl_user` created
- [ ] Environment variable DATABASE_URL set
- [ ] Migrations applied: `python migrate.py upgrade`
- [ ] Sample data seeded: `python seed.py`
- [ ] Backend running: `uvicorn main:app --reload`
- [ ] Frontend ready: `npm run dev`
- [ ] All tests passing: `python test_project.py`

---

## 🎯 Next Steps After Setup

1. **Access the application:**
   - Admin Panel: http://localhost:5173/admin
   - Learning Module: http://localhost:5173/learn
   - API Docs: http://localhost:8000/docs

2. **Test features:**
   - Create a lesson in admin panel
   - Add vocabulary to lesson
   - Create a quiz
   - Test learning progress tracking

3. **Configure authentication:**
   - Add JWT middleware to admin endpoints
   - Implement login/register if not present
   - Set up proper authorization

4. **Deploy:**
   - Build frontend: `npm run build`
   - Create Docker images
   - Set up production database
   - Configure CI/CD pipeline

---

**For questions or issues, refer to:**
- [MIGRATIONS_GUIDE.md](MIGRATIONS_GUIDE.md) - Database migration details
- [TEST_RESULTS.md](TEST_RESULTS.md) - Test report
- Backend documentation in `/backend/app/`
- Frontend documentation in `/frontend/src/`
