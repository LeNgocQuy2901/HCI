#!/bin/bash
# Database Migrations Quick Setup

echo "🗄️  SmartSign Database Migrations Setup"
echo "========================================"

# Check if in backend directory
if [ ! -f "alembic.ini" ]; then
    echo "❌ alembic.ini not found. Please run from backend directory."
    exit 1
fi

echo ""
echo "📦 Step 1: Install dependencies"
echo "pip install -r requirements.txt"
echo ""

echo "📋 Step 2: Configure DATABASE_URL"
echo "export DATABASE_URL=postgresql://user:password@localhost:5432/hcl_db"
echo ""

echo "🚀 Step 3: Apply migrations"
echo "python migrate.py upgrade"
echo ""

echo "✅ Step 4: Verify"
echo "python migrate.py current"
echo ""

echo "📚 For more details, see MIGRATIONS_GUIDE.md"
