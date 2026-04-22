# 🗄️ Database Migrations Guide

## Overview

Database migrations are version-controlled scripts that help manage database schema changes. This guide covers using **Alembic** with the SmartSign project.

---

## Installation

Alembic is already added to `requirements.txt`. Install it:

```bash
pip install -r requirements.txt
```

Or individually:
```bash
pip install alembic==1.13.1
```

---

## Directory Structure

```
backend/
├── alembic/                          # Alembic migrations directory
│   ├── versions/                     # Migration files
│   │   └── 001_initial_learning_tables.py
│   ├── env.py                        # Migration environment config
│   ├── script.py.mako                # Migration template
│   └── __pycache__/
├── alembic.ini                       # Alembic configuration
├── migrate.py                        # Migration helper script
├── app/
│   └── models/
│       └── learning_model.py         # Database models
└── main.py
```

---

## Quick Start

### 1️⃣ Apply Migrations

Run all pending migrations to create/update database tables:

```bash
# From backend directory
python migrate.py upgrade
# or
alembic upgrade head
```

**Output:**
```
✓ Upgraded to head
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 001_initial_learning_tables, initial migration
```

### 2️⃣ Check Current Revision

```bash
python migrate.py current
# or
alembic current
```

**Output:**
```
001_initial_learning_tables
```

### 3️⃣ View Migration History

```bash
python migrate.py history
# or
alembic history
```

**Output:**
```
<base> -> 001_initial_learning_tables, initial migration
```

### 4️⃣ Rollback Migrations

Downgrade to previous migration (removes last migration):

```bash
python migrate.py downgrade
# or
alembic downgrade -1
```

To downgrade to a specific revision:

```bash
alembic downgrade <revision>
```

---

## Creating New Migrations

### Option 1: Auto-generate (Recommended)

Auto-generate migrations based on model changes:

```bash
python migrate.py revision --autogenerate -m "Add new field to lessons"
# or
alembic revision --autogenerate -m "Add new field to lessons"
```

**Output:**
```
✓ New migration created
  Generating migration /path/to/alembic/versions/002_add_new_field_to_lessons.py
```

### Option 2: Manual Migration

Create empty migration template:

```bash
python migrate.py revision -m "Custom migration name"
# or
alembic revision -m "Custom migration name"
```

Then edit the generated file in `alembic/versions/` to add upgrade/downgrade logic.

---

## Migration Files

### Structure

Each migration file has this structure:

```python
"""Description of the migration

Revision ID: 002_add_featured_field
Revises: 001_initial_learning_tables
Create Date: 2026-04-22 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '002_add_featured_field'
down_revision = '001_initial_learning_tables'

def upgrade() -> None:
    # Code to apply migration
    op.add_column('lessons', sa.Column('is_featured', sa.Boolean(), default=False))

def downgrade() -> None:
    # Code to revert migration
    op.drop_column('lessons', 'is_featured')
```

### Common Operations

**Add Column**
```python
op.add_column('lessons', sa.Column('is_featured', sa.Boolean(), default=False))
```

**Drop Column**
```python
op.drop_column('lessons', 'is_featured')
```

**Rename Column**
```python
op.alter_column('lessons', 'old_name', new_column_name='new_name')
```

**Add Index**
```python
op.create_index(op.f('ix_lessons_is_featured'), 'lessons', ['is_featured'])
```

**Drop Index**
```python
op.drop_index(op.f('ix_lessons_is_featured'), table_name='lessons')
```

**Add Constraint**
```python
op.create_unique_constraint('uq_lessons_title', 'lessons', ['title'])
```

**Drop Constraint**
```python
op.drop_constraint('uq_lessons_title', 'lessons')
```

---

## Initial Migration

The initial migration (`001_initial_learning_tables.py`) creates these tables:

### 1. **lessons** - Learning modules
- `id` (UUID): Primary key
- `title` (String): Lesson title
- `description` (Text): Optional description
- `video_url` (String): URL to lesson video
- `content` (Text): Lesson content
- `level` (String): beginner/intermediate/advanced
- `is_active` (Boolean): Published status
- Indices on: title, level, is_active

### 2. **vocabularies** - Words/signs to learn
- `id` (UUID): Primary key
- `lesson_id` (UUID): Foreign key to lessons
- `word` (String): The sign/word
- `description` (Text): Meaning
- `pronunciation` (String): Phonetic pronunciation
- `image_url`, `video_url`: Media assets
- Indices on: lesson_id, word

### 3. **quizzes** - Assessment tools
- `id` (UUID): Primary key
- `lesson_id` (UUID): Foreign key to lessons
- `title` (String): Quiz name
- `passing_score` (Integer): Minimum score to pass
- `time_limit` (Integer): Time limit in seconds
- `is_active` (Boolean): Available status
- Indices on: lesson_id

### 4. **quiz_questions** - Individual questions
- `id` (UUID): Primary key
- `quiz_id` (UUID): Foreign key to quizzes
- `question_text` (Text): The question
- `question_type` (String): multiple_choice, true_false, short_answer
- `option_a, b, c, d` (String): Answer options
- `correct_answer` (String): Correct answer
- `explanation` (Text): Answer explanation
- Indices on: quiz_id

### 5. **user_progress** - User learning progress
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to users
- `lesson_id` (UUID): Foreign key to lessons
- `is_completed` (Boolean): Completion status
- `time_spent` (Integer): Time spent learning (seconds)
- `last_accessed` (DateTime): Last access timestamp
- Indices on: user_id, lesson_id

### 6. **user_quiz_results** - Quiz scores
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to users
- `quiz_id` (UUID): Foreign key to quizzes
- `score` (Integer): Final score
- `correct_answers` (Integer): Number correct
- `time_taken` (Integer): Time spent (seconds)
- `is_passed` (Boolean): Pass/fail status
- `answers` (Text): JSON of answers
- Indices on: user_id, quiz_id

---

## Real-World Examples

### Example 1: Add "difficulty_score" Field

**1. Model Change**
```python
# app/models/learning_model.py
class Quiz(Base):
    difficulty_score = Column(Integer, default=1)  # New field
```

**2. Generate Migration**
```bash
python migrate.py revision --autogenerate -m "Add difficulty_score to quizzes"
```

**3. Review Generated Migration**
```python
def upgrade() -> None:
    op.add_column('quizzes', sa.Column('difficulty_score', sa.Integer(), server_default='1'))

def downgrade() -> None:
    op.drop_column('quizzes', 'difficulty_score')
```

**4. Apply Migration**
```bash
python migrate.py upgrade
```

### Example 2: Create New Table

**1. Create Model**
```python
# app/models/learning_model.py
class LessonCategory(Base):
    __tablename__ = "lesson_categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
```

**2. Generate Migration**
```bash
python migrate.py revision --autogenerate -m "Create lesson_categories table"
```

**3. Apply Migration**
```bash
python migrate.py upgrade
```

---

## Best Practices

### ✅ DO

- **Commit migrations to version control** - Always include `.py` files in git
- **Test migrations** - Run on test database first
- **Use descriptive messages** - `Add user_id to lessons` ✓
- **Keep migrations atomic** - One logical change per migration
- **Review auto-generated migrations** - Check for accuracy
- **Create backups before major migrations** - Especially production
- **Document complex migrations** - Add comments explaining logic
- **Test downgrade path** - Ensure rollback works

### ❌ DON'T

- **Skip migrations** - Always track schema changes
- **Modify production database directly** - Always use migrations
- **Commit `.py` files to .gitignore** - Migrations should be version controlled
- **Use raw SQL without necessity** - Use Alembic operations when possible
- **Forget to update model files** - Keep models and migrations in sync
- **Apply production migrations without testing** - Test on staging first

---

## Troubleshooting

### ❌ Error: "Target database is not up to date"

**Cause:** Migrations not applied

**Solution:**
```bash
python migrate.py upgrade head
```

### ❌ Error: "Foreign key constraint failed"

**Cause:** Migration order issue or missing referenced table

**Solution:**
- Ensure parent tables exist first
- Check foreign key references in migration
- Manually verify table exists: `\dt lessons` in psql

### ❌ Error: "Column already exists"

**Cause:** Migration applied twice or conflict

**Solution:**
```bash
# Check current state
python migrate.py current

# If already at target revision, mark as applied
alembic stamp <revision>
```

### ❌ Error: "Could not connect to database"

**Cause:** Database URL not set correctly

**Solution:**
```bash
# Set environment variable
export DATABASE_URL="postgresql://user:password@host:5432/db_name"

# Or update alembic.ini
sqlalchemy.url = postgresql://user:password@host:5432/db_name
```

---

## Environment Variables

Set these before running migrations:

```bash
# PostgreSQL Connection
DATABASE_URL=postgresql://user:password@localhost:5432/hcl_db

# Optional
SQLALCHEMY_ECHO=false  # Log SQL queries
```

### Docker Example

```bash
docker exec -it hcl_db psql -U user -d hcl_db -c "\dt"
```

---

## Integration with Docker

### Running Migrations in Docker

```bash
# From host machine
docker exec hcl_backend python migrate.py upgrade

# Or inside container
docker exec -it hcl_backend bash
cd /app/backend
python migrate.py upgrade
```

### In docker-compose.yml

```yaml
services:
  backend:
    build: ./backend
    command: sh -c "python migrate.py upgrade && uvicorn app.main:app"
    depends_on:
      - db
```

---

## Continuous Integration / CD

### GitHub Actions Example

```yaml
- name: Run database migrations
  run: |
    cd backend
    python migrate.py upgrade
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Useful Alembic Commands

```bash
# Show help
alembic --help

# Show current database version
alembic current

# Show all revisions
alembic history

# Show branches
alembic branches

# Upgrade to specific revision
alembic upgrade <revision>

# Downgrade n versions
alembic downgrade -n

# Generate migration
alembic revision -m "message"

# Auto-generate from models
alembic revision --autogenerate -m "message"

# Mark database at specific revision (without running migration)
alembic stamp <revision>
```

---

## Database Schema

View current schema:

```bash
# Using psql
psql -U user -d hcl_db -c "\dt"
psql -U user -d hcl_db -c "\d lessons"

# Using Python
from app.models.learning_model import *
from app.services.database import Base
Base.metadata.tables.keys()
```

---

## Backup & Restore

### PostgreSQL Backup

```bash
pg_dump -U user -d hcl_db > backup.sql
```

### PostgreSQL Restore

```bash
psql -U user -d hcl_db < backup.sql
```

---

## Summary

| Task | Command |
|------|---------|
| Apply migrations | `python migrate.py upgrade` |
| Rollback migration | `python migrate.py downgrade` |
| Check status | `python migrate.py current` |
| View history | `python migrate.py history` |
| Create new | `python migrate.py revision -m "message"` |
| Auto-generate | `python migrate.py revision --autogenerate -m "message"` |

