# 📚 Git Guide - Hướng Dẫn Upload Lên GitHub

## ✅ Hoàn Thành

Dự án đã được setup và push lên GitHub với `.gitignore` để loại trừ datasets.

**Repository:** https://github.com/LeNgocQuy2901/HCL

---

## 🔍 Kiểm Tra Status

```bash
cd d:\GitHub\HCL
git status
```

**Expected Output:**
```
On branch main
nothing to commit, working tree clean
```

---

## 📋 .gitignore Configuration

File `.gitignore` hiện tại loại trừ:

```
✗ datasetTTNM/                                  # Dataset chính
✗ Gesture Image Data/                          # Raw gesture images
✗ Gesture Image Pre-Processed Data/            # Pre-processed images
✗ Sign-Language-Interpreter-using-Deep-Learning-master/  # Extracted repo
✗ *.zip                                         # Zip files
✗ __pycache__/                                 # Python cache
✗ node_modules/                                # NPM packages
✗ .env                                         # Environment variables
✗ .venv/                                       # Virtual environments
```

---

## 🚀 Các Command Thường Dùng

### 1. **Pull Latest Changes**
```bash
git pull origin main
```

### 2. **Thêm Files & Commit**
```bash
# Thêm tất cả files (ngoại trừ .gitignore)
git add .

# Commit với message
git commit -m "feat: add new feature description"

# Push lên GitHub
git push origin main
```

### 3. **Xem Git Log**
```bash
git log --oneline -10
```

### 4. **View Changes**
```bash
# Xem uncommitted changes
git diff

# Xem changes trong staging area
git diff --cached

# Xem changes so với remote
git diff origin/main
```

---

## 📊 Current Git Status

```
Branch:      main
Remote:      origin (https://github.com/LeNgocQuy2901/HCL.git)
Last Commit: chore: add .gitignore to exclude datasets and large files
Status:      ✅ Clean (nothing to commit)
```

---

## ⚡ Quick Workflow

Mỗi khi bạn làm xong một feature:

```bash
# 1. View changes
git status

# 2. Add changes
git add .

# 3. Commit
git commit -m "feat: describe what you changed"

# 4. Push
git push origin main

# 5. Verify
git log -1
```

---

## 🔐 Authentication

Nếu bị lỗi authentication khi push:

### Option 1: Using SSH (Recommended)
```bash
# Generate SSH key
ssh-keygen -t rsa -b 4096 -C "your-email@gmail.com"

# Add key to ssh-agent
eval $(ssh-agent -s)
ssh-add ~/.ssh/id_rsa

# Update remote to SSH
git remote set-url origin git@github.com:LeNgocQuy2901/HCL.git
```

### Option 2: Using Personal Access Token
```bash
# Generate token on GitHub (Settings > Developer settings > Personal access tokens)
# Then use as password when pushing

git push origin main
# Username: your-github-username
# Password: your-personal-access-token
```

---

## 🔄 Working with Branches

```bash
# Create new branch
git checkout -b feature/feature-name

# Switch branch
git checkout main

# List branches
git branch -a

# Delete branch
git branch -d feature-name

# Merge branch to main
git checkout main
git merge feature/feature-name
```

---

## 📝 Commit Message Convention

Follow conventional commits:

```
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Code style (formatting, semicolons, etc)
refactor: Code refactoring
perf:     Performance improvement
chore:    Build, dependencies, etc
test:     Tests
```

**Examples:**
```bash
git commit -m "feat: add gesture recognition real-time pipeline"
git commit -m "fix: resolve database connection timeout issue"
git commit -m "docs: update API documentation"
```

---

## 🗑️ Exclude More Files

If you need to exclude more files later:

1. Add to `.gitignore`
2. Remove from git cache: `git rm -r --cached <path>`
3. Commit: `git commit -m "chore: update gitignore"`
4. Push: `git push origin main`

---

## 📌 Important Notes

### Do NOT Commit:
- ❌ `.env` files with secrets
- ❌ Database files (*.db, *.sqlite)
- ❌ Large datasets
- ❌ ML models (*.h5, *.pkl)
- ❌ node_modules/
- ❌ __pycache__/
- ❌ Zip files

### Safe to Commit:
- ✅ Source code (.js, .py, .jsx)
- ✅ Configuration templates (.env.example)
- ✅ Documentation (.md)
- ✅ Docker files
- ✅ requirements.txt / package.json

---

## 🆘 Troubleshooting

### Problem: "Everything is up-to-date"
```bash
# Your local is same as remote
git status
# nothing to commit
```

### Problem: "Rejected updates"
```bash
git pull origin main
git push origin main
```

### Problem: "Accidentally staged files"
```bash
# Unstage all
git reset

# Unstage specific file
git reset <file>
```

### Problem: "Wrong commit message"
```bash
# Amend last commit
git commit --amend -m "correct message"
```

---

## 📚 Resources

- [Git Docs](https://git-scm.com/doc)
- [GitHub Guide](https://guides.github.com)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Status:** ✅ Setup Complete & Ready for Development
