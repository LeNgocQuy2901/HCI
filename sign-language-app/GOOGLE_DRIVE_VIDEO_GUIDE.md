# 🎬 Google Drive Video Guide - SmartSign

## Hướng Dẫn Sử Dụng Video từ Google Drive

Project hiện tại hỗ trợ **3 loại video sources**:
- ✅ **Google Drive** (Khuyến nghị)
- ✅ **YouTube**
- ✅ **MP4 links** (Regular video files)

---

## 📽️ Bước 1: Upload Video lên Google Drive

### 1. Tạo / Mở Google Drive
```
https://drive.google.com
```

### 2. Upload Video
- Click **"+ New"** → **"File upload"**
- Chọn file video MP4
- Đợi upload hoàn tất

### 3. Chia Sẻ File
1. Chuột phải trên file → **"Share"**
2. Click **"Change"** (bên cạnh "Restricted")
3. Chọn **"Anyone with the link"** → **"Viewer"**
4. Click **"Share"** → Copy link
5. Click **"Close"**

---

## 🔗 Bước 2: Lấy Google Drive URL

### Loại URL
```
Bình thường: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
Được hỗ trợ: https://drive.google.com/file/d/FILE_ID/view
```

### Cách Tìm FILE_ID
```
https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J1K2L3M/view
                             ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
                          FILE_ID (27 ký tự)
```

**Nhanh chóng hơn:** Copy URL trong browser address bar

---

## ➕ Bước 3: Thêm Video vào Admin Panel

### 1. Truy Cập Admin Panel
```
http://localhost:5173/admin
```

### 2. Vào Lesson Management
```
Click: "Lesson Manager" hoặc "📖 Quản Lý Bài Học"
```

### 3. Tạo Bài Giảng Mới
```
Click: "+ New Lesson"
```

### 4. Điền Form
```
Tiêu đề:        "Bài 1: Giới Thiệu Ký Hiệu"
Mô tả:          "Học các ký hiệu cơ bản"
Level:          "Beginner"
Nội dung:       "Chi tiết nội dung bài học..."
```

### 5. **Dán Video URL từ Google Drive**
```
Video URL: https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J1K2L3M/view
```

### 6. **Thêm Thumbnail (Ảnh Bìa)**
```
Thumbnail URL: https://drive.google.com/file/d/THUMBNAIL_ID/view
```
*Hoặc lấy từ YouTube:*
```
https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg
```

### 7. Lưu Bài Giảng
```
Click: "Create Lesson"
```

---

## 🎯 Ví Dụ Thực Tế

### Google Drive Share Link
```
https://drive.google.com/file/d/1QwErTyUiOpAsDfGhJkLzXcVbNm1234567/view?usp=sharing
```

### Dán Vào Form
```
Video URL: https://drive.google.com/file/d/1QwErTyUiOpAsDfGhJkLzXcVbNm1234567/view
```

### Kết Quả
- ✅ Video sẽ phát trong bài giảng
- ✅ Tự động convert thành embed format
- ✅ Không cần điều chỉnh gì khác

---

## 🎥 Xem Video trong Learning Module

### 1. Truy Cập Ứng Dụng
```
http://localhost:5173
```

### 2. Vào Learning Module
```
Click: "Learn" hoặc "📚 Học Tập"
```

### 3. Chọn Bài Giảng
```
Click: Tên bài giảng
```

### 4. Xem Video
```
- Video sẽ phát tự động
- Có controls: play, pause, fullscreen
- Có subtitle nếu có
```

---

## ⚙️ Hỗ Trợ Video Sources

### Google Drive ✅ Được Hỗ Trợ
```
URL Format: https://drive.google.com/file/d/FILE_ID/view
Hiển thị:   iframe embed
Controls:   Full (Play, Pause, Fullscreen)
```

### YouTube ✅ Được Hỗ Trợ
```
URL Format: https://www.youtube.com/watch?v=VIDEO_ID
Hiển thị:   iframe embed
Controls:   Full (Play, Pause, Fullscreen)
```

### MP4 Files ✅ Được Hỗ Trợ
```
URL Format: https://example.com/video.mp4
Hiển thị:   HTML5 video tag
Controls:   Full (Play, Pause, Fullscreen)
```

---

## ✅ Checklist - Đảm Bảo Video Hoạt động

- [ ] Video được upload lên Google Drive
- [ ] Video được **Share công khai** ("Anyone with the link")
- [ ] Copy đúng URL từ browser address bar
- [ ] Dán URL vào "Video URL" field
- [ ] Click "Create Lesson" để lưu
- [ ] Truy cập Learning Module để test
- [ ] Video phát được (có thể mất 1-2 giây load)
- [ ] Controls hoạt động bình thường

---

## ⚠️ Các Vấn Đề Thường Gặp

### ❌ Video không phát
**Nguyên nhân:** File không được share công khai

**Giải pháp:**
1. Mở Google Drive
2. Chuột phải file → Share
3. Chọn "Anyone with the link"
4. Save

### ❌ "Access Denied"
**Nguyên nhân:** Quyền truy cập bị chặn

**Giải pháp:**
1. Kiểm tra quyền share (phải là "Viewer")
2. Thử lại trên browser khác
3. Clear browser cache

### ❌ Video load chậm
**Nguyên nhân:** Google Drive bandwidth limited

**Giải pháp:**
1. Chờ 1-2 phút
2. Thử refresh page
3. Kiểm tra kết nối Internet
4. Nếu quá nhiều user, dùng YouTube thay thế

### ❌ Không thể điều chỉnh âm thanh
**Nguyên nhân:** Giới hạn của Google Drive embed

**Giải pháp:** Upload lên YouTube để có full controls

---

## 🎞️ Tips & Tricks

### Tối ưu Kích Thước Video
```
Độ phân giải: 1280x720 (720p) hoặc 1920x1080 (1080p)
Bitrate: 5-8 Mbps (để load nhanh)
Format: MP4 (H.264 codec)
File size: < 500MB mỗi video
```

### Tạo Thumbnail Đẹp
```
Option 1: YouTube - Tự động tạo
Option 2: Canva - https://canva.com
Option 3: Google Drive preview screenshot
Option 4: Custom image upload
```

### Tổ Chức Thư Mục Google Drive
```
/SmartSign
  /Lesson Videos
    /Level 1 - Beginner
      - lesson1.mp4
      - lesson2.mp4
    /Level 2 - Intermediate
      - lesson3.mp4
  /Thumbnails
    - thumb1.jpg
    - thumb2.jpg
```

---

## 🚀 Migration từ Khác → Google Drive

### Nếu Video Đã Ở Nơi Khác

#### Từ YouTube → Google Drive
```
1. YouTube: Share → Copy link
2. Google Drive: Không cần upload (dùng link)
3. Admin Panel: Dán YouTube link trực tiếp
```

#### Từ Local Computer → Google Drive
```
1. Computer: Có file video
2. Google Drive: Upload file
3. Share + Copy link
4. Admin Panel: Dán link
```

#### Từ Dropbox/OneDrive → Google Drive
```
1. Download file từ Dropbox
2. Upload lên Google Drive
3. Share + Copy link
4. Admin Panel: Dán link
```

---

## 📊 So Sánh Các Video Sources

| Tiêu Chí | Google Drive | YouTube | MP4 Links |
|----------|-------------|---------|-----------|
| **Miễn phí** | ✅ Có (15GB) | ✅ Có | ❌ Phải có server |
| **Dễ upload** | ✅ Drag & drop | ⚠️ Phải có channel | ❌ Phức tạp |
| **Tốc độ** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Kiểm soát** | ✅ Toàn bộ | ⚠️ YouTube rules | ✅ Toàn bộ |
| **Không ads** | ✅ Không | ❌ Có ads | ✅ Không |
| **Download** | ❌ Không | ❌ Không | ⚠️ Có |

---

## 💡 Khuyến Nghị

### Cho Sản Phẩm Học Tập
**Dùng: Google Drive + YouTube**

Lý do:
- Google Drive: Lưu bản backup, kiểm soát toàn bộ
- YouTube: Tốc độ tốt, không lo server

### Cho Sản Phẩm Lớn (1000+ video)
**Dùng: Cloudinary hoặc AWS S3**

Lý do:
- Tốc độ cực nhanh
- Bandwith unlimited
- Analytics chi tiết

---

## 🔗 Công Cụ Hỗ Trợ

### Lấy YouTube Thumbnail
```
ID: dQw4w9WgXcQ
URL: https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg
```

### Test Video URL
```
Truy cập: Video URL trực tiếp trong browser
Nếu bị redirect → Video đúng
Nếu blank page → Sai format
```

### Extract Google Drive ID
```
Đầu vào: https://drive.google.com/file/d/1A2B3/view?usp=sharing
Đầu ra: 1A2B3
```

---

## 📞 Support

Nếu gặp sự cố:
1. Kiểm tra URL đúng format
2. Đảm bảo file được share công khai
3. Clear browser cache (Ctrl+Shift+Del)
4. Thử incognito mode
5. Check network (F12 → Network tab)

---

**Updated: April 22, 2026**  
**Project: SmartSign - Sign Language Interpreter**  
**Version: 1.0 with Google Drive Support**
