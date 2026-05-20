================================================================================
HƯỚNG DẪN SETUP GOOGLE DRIVE INTEGRATION CHO SMARTSIGNLANGUAGE
================================================================================

TÌNH TRẠNG HIỆN TẠI:
- Video system đã được tích hợp sẵn
- API endpoints đã được tạo: /api/video/:videoKey
- Cần cập nhật Google Drive File IDs vào file shared/google-drive.ts

================================================================================
BƯỚC 1: TÌM GOOGLE DRIVE FILE IDs
================================================================================

Có 2 cách để lấy File ID từ Google Drive:

CÁCH 1: Từ URL Drive (Nhanh nhất)
================================
1. Mở folder trên Google Drive
   - Folder Numbers: https://drive.google.com/drive/u/1/folders/1xvcntKMxo9SgDyP-5wTUEmkC-iLO30AE
   - Folder Câu: https://drive.google.com/drive/u/1/folders/1vsvPBMBVqE1_b3s_TSbtOWW7ekFQfHY3

2. Mở một video trong folder
   - URL sẽ như: https://drive.google.com/file/d/FILE_ID_HERE/view

3. Sao chép FILE_ID_HERE - đó là File ID bạn cần

4. Format File ID: là một string dài như:
   1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p

CÁCH 2: Dùng Google Drive API (Cho batch download)
===================================================
Nếu muốn download hết file IDs cùng lúc:

1. Cài đặt Google Drive CLI:
   > npm install --save-dev @google/drive-api

2. Hoặc sử dụng Google Sheets để list files từ Drive
   - Tạo Sheet script để list tất cả file IDs
   - Export dưới dạng CSV

================================================================================
BƯỚC 2: CẬP NHẬT FILE google-drive.ts
================================================================================

Mở file: shared/google-drive.ts

Tìm đoạn code:
```typescript
export const driveVideoMap: Record<string, { fileId: string; name: string }> = {
  // Numbers folder videos
  "num-0": {
    fileId: "PLACEHOLDER_FILE_ID_NUM_0",  // ← THAY ĐỔI ĐÂY
    name: "B02-Số 0.mp4",
  },
  // ... etc
}
```

CÁCH CẬP NHẬT:
1. Lấy file ID từ URL Drive cho file "B02-Số 0.mp4"
2. Thay "PLACEHOLDER_FILE_ID_NUM_0" bằng file ID thực tế
3. Lặp lại cho tất cả video

VÍ DỤ:
```typescript
"num-0": {
  fileId: "1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p",  // ← File ID thực tế
  name: "B02-Số 0.mp4",
},
```

================================================================================
BƯỚC 3: DANH SÁCH VIDEO CẦN CẬP NHẬT
================================================================================

📁 FOLDER NUMBERS (Số từ 0-1000):
---------------------------------
Video ID Key    | Tên File                | Status
--------------  | ----------------------- | --------
num-0           | B02-Số 0.mp4           | [ ] TODO
num-1           | B02-Số 1.mp4           | [ ] TODO
num-2           | B02-Số 2.mp4           | [ ] TODO
num-3           | B02-Số 3.mp4           | [ ] TODO
num-4           | B02-Số 4.mp4           | [ ] TODO
num-5           | B02-Số 5.mp4           | [ ] TODO
num-6           | B02-Số 6-HN.mp4        | [ ] TODO
(+ Thêm số 7-1000 theo cần thiết)

📁 FOLDER GREETINGS & SENTENCES (Lời chào):
--------------------------------------------
Video ID Key        | Tên File                                      | Status
------------------- | --------------------------------------------- | --------
greet-hello         | Xin chào hoặc chào (3 cách).mp4             | [ ] TODO
greet-happy-to-meet | Câu đơn_Xin chào, rất vui được gặp bạn.mp4 | [ ] TODO
greet-how-are-you   | Câu đơn_Bạn khỏe không.mp4                 | [ ] TODO
greet-long-time     | Câu phúc_Lâu quá không gặp, bạn khỏe không.mp4 | [ ] TODO
greet-meet          | Gặp gỡ hoặc gặp.mp4                       | [ ] TODO
greet-health        | Khỏe.mp4                                   | [ ] TODO
info-name           | Tên.mp4                                    | [ ] TODO
info-age            | Tuổi.mp4                                   | [ ] TODO
info-location       | ở.mp4                                      | [ ] TODO

================================================================================
BƯỚC 4: TEST GOOGLE DRIVE INTEGRATION
================================================================================

Sau khi cập nhật file IDs, test lại:

1. Đảm bảo server đang chạy:
   > npm run dev

2. Kiểm tra API endpoint:
   > GET http://localhost:8080/api/videos/list

   Kết quả sẽ hiển thị:
   {
     "total": 18,
     "configured": 18,  // Nếu > 0 thì có file được cấu hình
     "videos": [...]
   }

3. Test một video cụ thể:
   > GET http://localhost:8080/api/video/num-0

   Kết quả:
   {
     "url": "https://drive.google.com/uc?id=YOUR_FILE_ID&export=download",
     "name": "B02-Số 0.mp4",
     "videoKey": "num-0",
     "type": "google-drive"
   }

4. Mở browser DevTools (F12)
   - Network tab sẽ hiển thị yêu cầu đến Google Drive
   - Video sẽ được phát từ Drive nếu file ID đúng

================================================================================
BƯỚC 5: LÀMVIEDO CÓ THỂ PHÁT MỚI
================================================================================

Để thêm video mới từ Drive:

1. Thêm entry mới vào google-drive.ts:
```typescript
"video-key-moi": {
  fileId: "YOUR_NEW_FILE_ID",
  name: "Tên video mới.mp4",
},
```

2. Thêm vào vocabulary.ts:
```typescript
{
  id: "vocab-id-moi",
  word: "Từ mới",
  category: "greetings",
  difficulty: "beginner",
  videoUrl: "/api/video/video-key-moi",
  videoKey: "video-key-moi",
  description: "Mô tả video",
  example: "Ví dụ sử dụng",
}
```

3. Restart server:
   > Ctrl+C rồi npm run dev

4. Video sẽ tự động có sẵn trong app

================================================================================
BƯỚC 6: TROUBLESHOOTING
================================================================================

❌ LỖI: "Video not found" hoặc "Video ID not configured"
✓ GIẢI PHÁP: 
  - Kiểm tra file ID có đúng không
  - Đảm bảo file bị share công khai (Share with "Anyone" trên Drive)
  - Nếu không, dùng Service Account key (xem dưới)

❌ LỖI: "Failed to play video" trên browser
✓ GIẢI PHÁP:
  - Kiểm tra Network tab - xem request đến Drive có thành công không
  - Nếu error 404 từ Drive: file ID sai
  - Nếu error 403 Forbidden: file không được public

❌ LỖI: "CORS error" khi play video
✓ GIẢI PHÁP:
  - Google Drive hỗ trợ CORS
  - Nếu vẫn lỗi: dùng /api/video-stream/:videoKey endpoint (redirect)

❌ LỖI: Video chậm hoặc buffer nhiều
✓ GIẢI PHÁP:
  - Điều này bình thường với Google Drive
  - Nếu cần tốc độ cao: upload video lên hosting khác (AWS S3, Cloudinary)
  - Hoặc cache video trên server

================================================================================
BƯỚC 7: (TÙYCHỌN) CÁCH NÂNG CAO - SERVICE ACCOUNT
================================================================================

Nếu muốn:
- Tự động lấy file IDs
- Không phải public các file (bảo mật hơn)
- Quản lý video quyền truy cập tốt hơn

LÀM THEO:

1. Tạo Google Cloud Project:
   - https://console.cloud.google.com
   - Tạo Service Account với quyền Drive API

2. Download JSON key file

3. Cài package:
   > npm install googleapis

4. Tạo file: server/google-drive-client.ts
```typescript
import { google } from 'googleapis';
import { readFileSync } from 'fs';

const KEY_FILE = 'service-account-key.json';
const serviceAccount = JSON.parse(readFileSync(KEY_FILE, 'utf8'));

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/drive.readonly']
});

export const drive = google.drive({ version: 'v3', auth });
```

5. Tạo route để list files:
   > Sẽ tự động scan folder Drive và list tất cả file IDs

================================================================================
BƯỚC 8: DEPLOY LÊN PRODUCTION
================================================================================

Khi deploy trên Netlify/Vercel:

1. Thêm environment variable (nếu dùng Service Account):
   > GOOGLE_DRIVE_KEY_JSON = <contents of JSON key>

2. Xác nhận link redirect Google Drive hoạt động

3. Test lại trên production:
   > https://your-domain.com/api/videos/list

================================================================================
THAM KHẢO
================================================================================

API Endpoints tạo ra:
- GET /api/video/:videoKey
  → Trả về URL video từ Google Drive
  
- GET /api/videos/list
  → Liệt kê tất cả video có sẵn
  
- GET /api/video-stream/:videoKey
  → Redirect trực tiếp đến video (cho browser streaming)

File cấu hình:
- shared/google-drive.ts     (File ID mapping)
- server/routes/video.ts     (API endpoints)
- shared/vocabulary.ts       (Dữ liệu từ vựng)
- server/index.ts           (Đăng ký routes)

================================================================================
LIÊN HỆ HỖ TRỢ
================================================================================

Nếu gặp vấn đề:

1. Kiểm tra console (F12) xem error message
2. Kiểm tra server logs (terminal chạy npm run dev)
3. Xác nhận file IDs được copy đúng từ Drive URL
4. Xác nhận Drive folder được share (bất cứ ai có link cũng được truy cập)

================================================================================
NGÀY TẠO: 22/04/2026
PHIÊN BẢN: 1.0
================================================================================
