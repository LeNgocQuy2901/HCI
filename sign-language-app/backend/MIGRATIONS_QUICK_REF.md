# 🚀 Database Migrations - Quick Reference

## Installation

```bash
pip install -r requirements.txt
```

## Basic Commands

```bash
# Apply all pending migrations
python migrate.py upgrade
alembic upgrade head

# Rollback last migration
python migrate.py downgrade
alembic downgrade -1

# Check current revision
python migrate.py current
alembic current

# View migration history
python migrate.py history
alembic history
```

## Create New Migrations

```bash
# Auto-generate from model changes (recommended)
python migrate.py revision --autogenerate -m "Add featured field to lessons"
alembic revision --autogenerate -m "Add featured field to lessons"

# Manual migration
python migrate.py revision -m "Custom change"
alembic revision -m "Custom change"
```

## Common Scenarios

### Scenario 1: First time setup
```bash
# Set database URL
export DATABASE_URL="postgresql://user:password@localhost:5432/hcl_db"

# Apply migrations
python migrate.py upgrade

# Verify
python migrate.py current
```

### Scenario 2: Add new field to existing table
```python
# 1. Update model
# app/models/learning_model.py
class Lesson(Base):
    new_field = Column(String(100), nullable=True)

# 2. Generate migration
python migrate.py revision --autogenerate -m "Add new_field to lessons"

# 3. Review alembic/versions/002_add_new_field_to_lessons.py

# 4. Apply
python migrate.py upgrade
```

### Scenario 3: Rollback due to error
```bash
# Go back one migration
python migrate.py downgrade -1

# Check where we are
python migrate.py current

# Fix and try again
python migrate.py upgrade
```

### Scenario 4: Check specific revision
```bash
# View history
python migrate.py history

# Go to specific revision
python migrate.py downgrade 001_initial_learning_tables

# Forward to head
python migrate.py upgrade head
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Target database is not up to date" | `python migrate.py upgrade head` |
| "Cannot connect to database" | Check `DATABASE_URL` environment variable |
| "Foreign key constraint failed" | Ensure parent table exists; check migration order |
| "Column already exists" | Check `python migrate.py current`; may need `alembic stamp` |
| "Migration not applied" | Run `python migrate.py upgrade <revision>` |

## Files Structure

```
backend/
├── alembic/
│   ├── env.py                    # Migration environment
│   ├── script.py.mako            # Migration template
│   └── versions/
│       ├── 001_initial_learning_tables.py
│       └── 002_your_migration.py
├── alembic.ini                   # Config
├── migrate.py                    # Helper script
└── MIGRATIONS_GUIDE.md           # Full documentation
```

## Tables Created by Initial Migration

- `lessons` - Learning modules
- `vocabularies` - Words/signs to learn
- `quizzes` - Assessments
- `quiz_questions` - Quiz questions
- `user_progress` - Learning progress
- `user_quiz_results` - Quiz scores

## Environment Setup

```bash
# Linux/Mac
export DATABASE_URL="postgresql://user:password@localhost:5432/hcl_db"

# Windows PowerShell
$env:DATABASE_URL="postgresql://user:password@localhost:5432/hcl_db"

# Windows CMD
set DATABASE_URL=postgresql://user:password@localhost:5432/hcl_db
```

## Docker Integration

```bash
# Run migrations in Docker
docker exec hcl_backend python migrate.py upgrade

# Or inside container
docker exec -it hcl_backend bash
cd /app/backend
python migrate.py upgrade
```

## Next Steps After Migrations

1. ✅ Apply initial migration: `python migrate.py upgrade`
2. 📊 Seed sample data (create seed script)
3. 🔐 Add authentication middleware to admin routes
4. 🧪 Create and run unit tests
5. 📖 Update API documentation

## Useful Links

- Full Guide: See [MIGRATIONS_GUIDE.md](MIGRATIONS_GUIDE.md)
- Alembic Docs: https://alembic.sqlalchemy.org/
- SQLAlchemy Docs: https://docs.sqlalchemy.org/
