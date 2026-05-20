# 📮 Hướng dẫn Test YOLO API với Postman

## 🚀 Chuẩn bị

### 1. Cài Postman
- Download từ: https://www.postman.com/downloads/
- Hoặc dùng Postman Web: https://web.postman.co/

### 2. Server phải đang chạy
```bash
# Terminal hiện tại đã chạy:
python inference/yolo_inference.py
# Server chạy tại: http://localhost:8000
```

---

## 📋 Danh sách API Endpoints

### 1️⃣ Health Check (GET)
**Endpoint**: `GET http://localhost:8000/health`

**Mô tả**: Kiểm tra tình trạng server

**Headers**: Không cần

**Body**: Trống

**Expected Response** (200 OK):
```json
{
    "status": "healthy",
    "yolo_available": true,
    "classifier_available": true,
    "demo_mode": true,
    "model": "YOLO v8 + MobileNetV2"
}
```

---

### 2️⃣ Get Server Info (GET)
**Endpoint**: `GET http://localhost:8000/info`

**Mô tả**: Thông tin chi tiết về server

**Expected Response** (200 OK):
```json
{
    "server": "YOLO Sign Language Recognition Server",
    "version": "1.0",
    "yolo": "YOLOv8 Nano",
    "classifier": "MobileNetV2",
    "endpoints": [
        "/health",
        "/info",
        "/api/detect-and-classify",
        "/api/detect-only",
        "/api/classify-only",
        "/api/gestures"
    ],
    "gesture_count": 29,
    "gestures_sample": ["Hi", "Thank You", "Yes", "No", "Love"]
}
```

---

### 3️⃣ List All Gestures (GET)
**Endpoint**: `GET http://localhost:8000/api/gestures`

**Mô tả**: Lấy danh sách tất cả các ký hiệu được hỗ trợ

**Expected Response** (200 OK):
```json
{
    "count": 29,
    "gestures": [
        "Hi",
        "Thank You",
        "Yes",
        "No",
        "Love",
        ...
    ]
}
```

---

### 4️⃣ Detect & Classify (POST)
**Endpoint**: `POST http://localhost:8000/api/detect-and-classify`

**Mô tả**: Phát hiện tay + phân loại ký hiệu trong một bức ảnh

#### Bước setup trong Postman:

1. **URL**: `http://localhost:8000/api/detect-and-classify`
2. **Method**: POST
3. **Headers**:
   - Content-Type: Tự động (không cần đặt - Postman tự set)
4. **Body**: 
   - Chọn **form-data**
   - Key: `file` (type: **File**)
   - Value: Chọn file ảnh từ máy tính

#### Expected Response (200 OK):
```json
{
    "success": true,
    "hand_count": 2,
    "results": [
        {
            "bbox": [100, 50, 200, 180],
            "hand_confidence": 0.856,
            "gesture": "Thank You",
            "gesture_confidence": 0.923,
            "class_id": 1
        },
        {
            "bbox": [350, 120, 450, 280],
            "hand_confidence": 0.742,
            "gesture": "Love",
            "gesture_confidence": 0.891,
            "class_id": 4
        }
    ]
}
```

**Giải thích**:
- `bbox`: [x1, y1, x2, y2] - Tọa độ vị trí tay trong ảnh
- `hand_confidence`: Độ tin cậy phát hiện tay (0-1)
- `gesture`: Tên ký hiệu được nhận diện
- `gesture_confidence`: Độ tin cậy phân loại (0-1)
- `class_id`: ID của ký hiệu

---

### 5️⃣ Detect Only (POST)
**Endpoint**: `POST http://localhost:8000/api/detect-only`

**Mô tả**: Chỉ phát hiện vị trí tay (không phân loại)

#### Setup:
1. **URL**: `http://localhost:8000/api/detect-only`
2. **Method**: POST
3. **Body**: form-data, Key: `file` (File)

#### Expected Response (200 OK):
```json
{
    "success": true,
    "hand_count": 1,
    "detections": [
        {
            "bbox": [150, 100, 250, 250],
            "confidence": 0.89,
            "class_id": 0,
            "class_name": "hand"
        }
    ]
}
```

---

### 6️⃣ Classify Only (POST)
**Endpoint**: `POST http://localhost:8000/api/classify-only`

**Mô tả**: Phân loại ảnh toàn bộ (không cần phát hiện tay)

#### Setup:
1. **URL**: `http://localhost:8000/api/classify-only`
2. **Method**: POST
3. **Body**: form-data, Key: `file` (File)

#### Expected Response (200 OK):
```json
{
    "success": true,
    "gesture": "Thank You",
    "confidence": 0.945,
    "class_id": 1
}
```

---

## 🎬 Hướng dẫn Chi Tiết (Step-by-Step)

### Bước 1: Mở Postman
- Nhấp vào Postman icon

### Bước 2: Tạo Collection (Optional nhưng khuyến nghị)
- Nhấp **+** → "New Collection"
- Đặt tên: "YOLO Sign Language"

### Bước 3: Test Endpoint 1 - Health Check

1. **Tạo Request mới**:
   - Chọn "GET"
   - URL: `http://localhost:8000/health`
   - Nhấp **Send**

2. **Kết quả**: Sẽ thấy response JSON

### Bước 4: Test Endpoint 2 - Detect & Classify

1. **Chuẩn bị file ảnh**:
   - Chụp ảnh tay hoặc tải ảnh từ internet
   - Lưu dạng: JPG, PNG

2. **Setup Request trong Postman**:
   - Method: **POST**
   - URL: `http://localhost:8000/api/detect-and-classify`
   - Tab **Body**:
     - Chọn **form-data**
     - Hàng 1: Key = `file`, Type = **File**
     - Nhấp vào "Select Files" → chọn ảnh

3. **Gửi request**:
   - Nhấp **Send**
   - Xem kết quả trong phần Response

### Bước 5: Lặp lại với các ảnh khác

---

## 💻 Sử dụng cURL (Alternative)

Nếu không muốn dùng Postman, có thể test bằng Terminal:

### Health Check:
```bash
curl http://localhost:8000/health
```

### Get Gestures:
```bash
curl http://localhost:8000/api/gestures
```

### Detect & Classify (với file ảnh):
```bash
# Windows PowerShell:
$img = Get-Item "C:\path\to\image.jpg"
curl -X POST -F "file=@$img" http://localhost:8000/api/detect-and-classify

# Linux/Mac:
curl -X POST -F "file=@/path/to/image.jpg" http://localhost:8000/api/detect-and-classify
```

### Detect Only:
```bash
curl -X POST -F "file=@image.jpg" http://localhost:8000/api/detect-only
```

### Classify Only:
```bash
curl -X POST -F "file=@image.jpg" http://localhost:8000/api/classify-only
```

---

## 🐛 Troubleshooting

### ❌ Error: "Connection refused"
- **Nguyên nhân**: Server không chạy
- **Giải pháp**: Chạy `python inference/yolo_inference.py` trong terminal

### ❌ Error: "Invalid file format"
- **Nguyên nhân**: File không hỗ trợ (chỉ JPG, PNG)
- **Giải pháp**: Kiểm tra định dạng ảnh

### ❌ Error: "No hands detected"
- **Nguyên nhân**: Không có tay trong ảnh hoặc tay không rõ
- **Giải pháp**: Sử dụng ảnh có tay rõ ràng

### ⚠️ Demo Mode
- Nếu `"demo_mode": true` → Model đang dùng mock predictions
- Điều này bình thường nếu model file format không hỗ trợ

---

## 📸 Ảnh Test Recommendation

Để test tốt nhất:
1. **Chụp ảnh tay** từ camera (4K hoặc HD)
2. Hoặc **tải ảnh** từ:
   - Google Images: "Hand gesture sign language"
   - YouTube thumbnails
   - Dataset: https://www.kaggle.com/datasets/datamaz/sign-language-mnist

---

## ✅ Checklist Test

- [ ] Health check OK (GET /health)
- [ ] Server info OK (GET /info)
- [ ] Gesture list OK (GET /api/gestures)
- [ ] Detect & Classify OK (POST /api/detect-and-classify)
- [ ] Detect Only OK (POST /api/detect-only)
- [ ] Classify Only OK (POST /api/classify-only)

---

## 📊 Response Status Codes

| Code | Ý nghĩa |
|------|---------|
| 200 | Success - Request thành công |
| 400 | Bad Request - File không hợp lệ |
| 500 | Server Error - Lỗi server |
| 503 | Service Unavailable - Model chưa loaded |

---

## 🎯 Next Steps

Sau khi test API thành công:
1. **Tích hợp Frontend** - Sửa Recognition.tsx
2. **Deploy** - Docker hoặc cloud server
3. **Optimize** - Fine-tune model trên data riêng

