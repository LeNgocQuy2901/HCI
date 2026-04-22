# 🤖 Bulk Import Automation Guide

## 📋 Overview

Hệ thống SmartSign hiện tại hỗ trợ **bulk import** để thêm nhiều bài giảng cùng lúc từ Google Drive.

Bạn có **3 cách** để import:
1. ✅ **Admin Panel UI** (Dễ nhất - click chuột)
2. ✅ **Python Script** (Tự động - chạy command)
3. ✅ **API Direct** (Lập trình - curl/Postman)

---

## 🎯 Cách 1: Admin Panel (Dễ Nhất)

### Bước 1: Chuẩn Bị File CSV

**Tạo file `lessons.csv`:**
```csv
title,description,video_url,level,order,thumbnail_url,content
Chào buổi sáng,Cách chào sáng,https://drive.google.com/file/d/VIDEO_ID_1/view,beginner,1,,Nội dung bài học
Chào buổi chiều,Cách chào chiều,https://drive.google.com/file/d/VIDEO_ID_2/view,beginner,2,,Nội dung bài học
Chào buổi tối,Cách chào tối,https://drive.google.com/file/d/VIDEO_ID_3/view,beginner,3,,Nội dung bài học
```

**Hoặc download template:**
1. Mở Admin Panel: http://localhost:5173/admin
2. Tìm "Bulk Import"
3. Click "📥 Download Template"
4. File sẽ download về
5. Sửa thông tin của các bài học
6. Save file

### Bước 2: Upload từ Admin Panel

1. **Mở Admin Panel:**
   ```
   http://localhost:5173/admin
   ```

2. **Tìm phần "Bulk Import Lessons"**

3. **Click "📥 Show Import Form"**

4. **Chọn loại import:**
   - 📄 CSV File (upload file)
   - {} JSON Data (dán JSON)

5. **Upload file CSV:**
   - Chọn file từ máy tính
   - Click "📥 Import Now"

6. **Xem kết quả:**
   ```
   ✓ Created: 10
   ⚠ Skipped: 0
   ✗ Errors: 0
   ```

---

## 🐍 Cách 2: Python Script (Tự Động)

### Bước 1: Chuẩn Bị File CSV

Tạo file `lessons.csv` như trên, hoặc download template:
```bash
# Template sẵn có tại:
backend/lessons_template.csv
```

### Bước 2: Chạy Script

```bash
cd d:\GitHub\HCL\sign-language-app\backend

# Run with CSV file
python bulk_import_lessons.py lessons.csv

# Nếu không có file, sẽ chạy example data
python bulk_import_lessons.py
```

### Bước 3: Xem Kết Quả

```
========================================================
📊 IMPORT STATISTICS
========================================================
Total processed: 10
✅ Created:      10
⚠️  Skipped:      0
❌ Errors:       0
========================================================
```

---

## 🔌 Cách 3: API Direct (Lập Trình)

### Upload CSV File

```bash
# PowerShell
$file = @{
    'file' = Get-Item 'lessons.csv'
}

Invoke-WebRequest -Uri 'http://localhost:8000/api/admin/bulk-import/csv' `
  -Method POST `
  -Form $file
```

### Send JSON Data

```bash
# PowerShell
$data = @(
    @{
        title = "Chào buổi sáng"
        description = "Cách chào sáng"
        video_url = "https://drive.google.com/file/d/VIDEO_ID_1/view"
        level = "beginner"
        order = 1
    }
) | ConvertTo-Json

Invoke-WebRequest -Uri 'http://localhost:8000/api/admin/bulk-import/json' `
  -Method POST `
  -ContentType 'application/json' `
  -Body $data
```

---

## 📊 CSV Format Explanation

### Header (Dòng 1)
```csv
title,description,video_url,level,order,thumbnail_url,content
```

### Columns

| Column | Required | Type | Example |
|--------|----------|------|---------|
| **title** | ✅ Yes | String | "Chào buổi sáng" |
| **description** | ❌ No | String | "Cách chào sáng" |
| **video_url** | ✅ Yes | URL | "https://drive.google.com/file/d/ABC/view" |
| **level** | ❌ No | Enum | "beginner" (or "intermediate", "advanced") |
| **order** | ❌ No | Integer | 1, 2, 3... |
| **thumbnail_url** | ❌ No | URL | "https://example.com/thumb.jpg" |
| **content** | ❌ No | Text | "Bài học về..." |

### Rules
- **Required fields**: title, video_url (không được bỏ trống)
- **Optional fields**: Có thể để trống hoặc bỏ qua cột
- **Duplicates**: Lesson có title trùng sẽ bị skip
- **Level options**: beginner, intermediate, advanced (mặc định: beginner)
- **Order**: Số nguyên dương (mặc định: 0)

---

## 🎥 Getting Video IDs from Google Drive

### Step 1: Share Videos Publicly

```
1. Mở Google Drive folder
2. Right-click video
3. Click "Share"
4. Select "Anyone with the link"
5. Copy link
```

### Step 2: Extract VIDEO_ID

**URL bạn copy:**
```
https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J1K2L3M/view?usp=sharing
```

**VIDEO_ID là:**
```
1A2B3C4D5E6F7G8H9I0J1K2L3M
```

**Video URL để dùng:**
```
https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J1K2L3M/view
```

---

## 📝 Complete CSV Example

```csv
title,description,video_url,level,order,thumbnail_url,content
Chào buổi sáng,Cách chào vào buổi sáng,https://drive.google.com/file/d/1A2B3C/view,beginner,1,,Bài học chào vào buổi sáng
Chào buổi chiều,Cách chào vào buổi chiều,https://drive.google.com/file/d/1XYZ01/view,beginner,2,,Bài học chào vào buổi chiều
Xin chào,Cách nói xin chào cơ bản,https://drive.google.com/file/d/1ABC99/view,beginner,3,,Xin chào - bài học cơ bản
Cảm ơn,Cách tỏ lòng cảm ơn,https://drive.google.com/file/d/1DEF88/view,beginner,4,,Cảm ơn - biểu hiện lòng cảm ơn
Tạm biệt,Cách nói tạm biệt,https://drive.google.com/file/d/1GHI77/view,beginner,5,,Tạm biệt - từ biệt
```

---

## ✅ Checklist

### Trước Import
- [ ] Tất cả videos được upload lên Google Drive
- [ ] Tất cả videos được share công khai ("Anyone with the link")
- [ ] CSV file có đúng format
- [ ] Không có lỗi chính tả trong titles
- [ ] Video URLs đúng format

### Sau Import
- [ ] Check dashboard: có bao nhiêu lessons được tạo
- [ ] Click vào từng lesson để verify
- [ ] Test xem video có phát được không
- [ ] Check if order/level đúng

---

## 🐛 Troubleshooting

### Lỗi: "File must be CSV format"
```
Nguyên nhân: File không phải CSV
Giải pháp: Lưu file dưới định dạng CSV (không phải XLSX)
```

### Lỗi: "Title is required"
```
Nguyên nhân: Cột title bị trống
Giải pháp: Đảm bảo mỗi dòng có title
```

### Lỗi: "Invalid level"
```
Nguyên nhân: Level không phải beginner/intermediate/advanced
Giải pháp: Kiểm tra lại cách viết level
```

### Video không phát
```
Nguyên nhân: URL không đúng hoặc Google Drive không share công khai
Giải pháp:
1. Check if URL format là: https://drive.google.com/file/d/VIDEO_ID/view
2. Verify file được share "Anyone with the link"
3. Test URL trực tiếp trong browser
```

### Bài giảng bị skip
```
Nguyên nhân: Bài học này đã tồn tại
Giải pháp: 
1. Thay đổi title nếu muốn thêm bài mới
2. Hoặc delete bài cũ trước import
```

---

## 🚀 Advanced: Bulk Extract from Google Drive Folder

Nếu bạn muốn **tự động extract tất cả video IDs** từ Google Drive folder:

### Method 1: Manual Export
```
1. Mở Google Drive folder
2. Ctrl+A (select all)
3. Right-click → "Download"
4. Extract ZIP file
5. Note lại tên files
6. Tạo CSV với video URLs
```

### Method 2: Google Sheets
```
1. Tạo Google Sheet
2. Dùng HYPERLINK function để tạo links
3. Export as CSV
4. Upload
```

### Method 3: Script tự động (sau này)
```python
# To be implemented
# Tự động lấy danh sách videos từ folder
# Tạo CSV automatically
# Import vào system
```

---

## 💡 Tips & Tricks

### 1. Batch Process
```
Nếu có 100+ video:
1. Chia thành 10 files (mỗi file 10 video)
2. Import từng file một
3. Hoặc dùng script để bulk import tất cả
```

### 2. Use Google Sheets for Data Management
```
1. Tạo Google Sheet
2. Thêm các bài học vào sheet
3. Add hyperlinks để videos
4. Export as CSV
5. Import vào system
```

### 3. Automate with Python
```python
# Nếu import thường xuyên
# Tạo Python script để:
# - Read Google Drive folder
# - Extract video info
# - Create CSV automatically
# - Run bulk import
```

### 4. Version Control
```
Lưu copy của CSV files:
- lessons_v1.csv (initial)
- lessons_v2.csv (with more videos)
- lessons_v3.csv (updates)
```

---

## 📊 API Endpoints

### 1. Bulk Import CSV
```
POST /api/admin/bulk-import/csv
Content-Type: multipart/form-data

Response:
{
  "status": "success",
  "message": "Imported 10 lessons",
  "stats": {
    "total": 10,
    "created": 10,
    "skipped": 0,
    "errors": 0
  }
}
```

### 2. Bulk Import JSON
```
POST /api/admin/bulk-import/json
Content-Type: application/json

Response:
{
  "status": "success",
  "message": "Imported 5 lessons",
  "stats": {
    "total": 5,
    "created": 5,
    "skipped": 0,
    "errors": 0
  }
}
```

### 3. Get Template
```
GET /api/admin/bulk-import/template

Response:
{
  "csv_format": "title,description,video_url,...",
  "required_fields": ["title", "video_url"],
  "example_rows": [...],
  "level_options": ["beginner", "intermediate", "advanced"]
}
```

---

## 🎯 Next Steps

1. **Prepare CSV file** với các bài giảng của bạn
2. **Get video IDs** từ Google Drive folder
3. **Test import** bằng Admin Panel
4. **Verify lessons** được tạo đúng
5. **Share link** cho students để xem

---

## 📞 Support

Nếu có vấn đề:
1. Check CSV format lại
2. Verify Google Drive links
3. Check browser console (F12)
4. Xem lại Troubleshooting section

---

**Version:** 1.0  
**Created:** April 22, 2026  
**Status:** Production Ready
