# 🚀 Bulk Import - Quick Start (5 Minutes)

## One-Minute Overview

Your SmartSign system now supports **bulk importing lessons from Google Drive in 3 ways:**

1. 🖥️ Admin Panel (Easiest)
2. 🐍 Python Script
3. 🔌 API Endpoint

---

## ⚡ Quickest Method: Admin Panel

### 1. Create CSV File
```csv
title,description,video_url,level,order
Chào buổi sáng,Morning greeting,https://drive.google.com/file/d/VIDEO_ID_1/view,beginner,1
Chào buổi chiều,Afternoon greeting,https://drive.google.com/file/d/VIDEO_ID_2/view,beginner,2
```

**How to get VIDEO_ID:**
- Shared link: `https://drive.google.com/file/d/ABC123/view?usp=sharing`
- Use: `ABC123`

### 2. Upload to Admin Panel
```
1. Open: http://localhost:5173/admin
2. Find: "Bulk Import Lessons"
3. Click: "+ Show Import Form"
4. Select: "📄 CSV File"
5. Upload: Your CSV file
6. Click: "📥 Import Now"
```

### 3. Done! ✅
You'll see:
```
✓ Created: 10
⚠ Skipped: 0
✗ Errors: 0
```

---

## 📥 Download Template

Click "📥 Download Template" in Admin Panel to get a working CSV file you can edit.

---

## 🐍 Python Script Method

```bash
cd backend
python bulk_import_lessons.py lessons.csv
```

---

## 🔗 API Method

```bash
curl -X POST http://localhost:8000/api/admin/bulk-import/csv \
  -F "file=@lessons.csv"
```

---

## 📝 CSV Format (Complete Reference)

| Column | Required | Type | Example |
|--------|----------|------|---------|
| title | ✅ | String | "Chào buổi sáng" |
| description | ❌ | String | "Morning greeting" |
| video_url | ✅ | URL | "https://drive.google.com/file/d/ABC/view" |
| level | ❌ | Enum | "beginner" |
| order | ❌ | Int | 1 |
| thumbnail_url | ❌ | URL | "https://..." |
| content | ❌ | Text | "Lesson content..." |

**Only `title` and `video_url` are required.**

---

## 🎯 Real Example

### Your Folder:
`https://drive.google.com/drive/u/0/folders/1vsvPBMBVqE1_b3s_TSbtOWW7ekFQfHY3`

### CSV Template:
```csv
title,description,video_url,level,order,thumbnail_url,content
Chào buổi sáng,Cách chào sáng,https://drive.google.com/file/d/PASTE_VIDEO_ID_1/view,beginner,1,,Nội dung bài học
Chào buổi chiều,Cách chào chiều,https://drive.google.com/file/d/PASTE_VIDEO_ID_2/view,beginner,2,,Nội dung bài học
Xin chào,Cách nói xin chào,https://drive.google.com/file/d/PASTE_VIDEO_ID_3/view,beginner,3,,Nội dung bài học
Tạm biệt,Cách nói tạm biệt,https://drive.google.com/file/d/PASTE_VIDEO_ID_4/view,beginner,4,,Nội dung bài học
Cảm ơn,Cách tỏ lòng cảm ơn,https://drive.google.com/file/d/PASTE_VIDEO_ID_5/view,beginner,5,,Nội dung bài học
```

---

## ✅ Checklist

- [ ] Videos uploaded to Google Drive
- [ ] Videos shared ("Anyone with the link")
- [ ] CSV file created with correct format
- [ ] All required fields filled (title, video_url)
- [ ] No duplicate titles
- [ ] Video URLs follow pattern: `https://drive.google.com/file/d/VIDEO_ID/view`

---

## 💪 Files Created

| File | Purpose |
|------|---------|
| `backend/bulk_import_lessons.py` | Python CLI tool |
| `backend/app/routes/bulk_import.py` | API endpoints |
| `backend/lessons_template.csv` | CSV template |
| `frontend/src/components/AdminBulkImport.jsx` | Admin UI component |
| `frontend/src/components/AdminBulkImport.css` | Component styling |
| `BULK_IMPORT_GUIDE.md` | Complete guide |
| `BULK_IMPORT_AUTOMATION.md` | Full documentation |

---

## 🎬 Video Format Support

✅ **Google Drive** (iframe): `https://drive.google.com/file/d/ID/view`
✅ **YouTube** (iframe): `https://www.youtube.com/embed/VIDEO_ID`
✅ **Direct MP4** (video tag): `https://example.com/video.mp4`

---

## 🚀 Try It Now!

```
1. Create CSV with your lessons
2. Go to Admin Panel (http://localhost:5173/admin)
3. Click "Bulk Import"
4. Upload CSV
5. See results instantly!
```

---

## 📖 Full Documentation

- Complete guide: `BULK_IMPORT_GUIDE.md`
- Implementation details: `BULK_IMPORT_AUTOMATION.md`
- Code: Check `backend/` and `frontend/src/components/`

---

**Ready to import? Start with Admin Panel - it's the easiest! 🎉**
