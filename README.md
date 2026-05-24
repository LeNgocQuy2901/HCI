# SmartSignLanguage

SmartSignLanguage là ứng dụng học và nhận diện ngôn ngữ ký hiệu, gồm frontend React/Vite, backend Express cho các chức năng web, và FastAPI inference server riêng để nhận diện ký hiệu bằng camera.

## Tính Năng Chính

- Học từ vựng ngôn ngữ ký hiệu qua bài học và video mẫu.
- Nhận diện ký hiệu realtime từ webcam.
- AI inference server dùng MediaPipe Hands + Pose và model Keras.
- Hỗ trợ model landmarks sequence từ `model_landmarks.keras` và `mapping.json`.
- Có đăng nhập, đăng ký, hồ sơ người dùng, phản hồi và các trang học tập.

## Công Nghệ

- Frontend: React 18, TypeScript, Vite, TailwindCSS, Radix UI.
- Web backend: Express, SQLite, JWT.
- AI backend: FastAPI, TensorFlow/Keras, MediaPipe, OpenCV.
- Database local: `data/app.db`.

## Cấu Trúc Thư Mục

```text
SmartSignLanguage/
  client/                     React frontend
    pages/                    Các route chính: Learn, Translate, Recognition...
    components/               Component UI và layout
    hooks/                    Custom hooks
    lib/                      Helper frontend

  server/                     Express backend
    routes/                   API routes
    models/                   Database models
    middleware/               Auth middleware
    db.ts                     SQLite setup

  ai-model/                   AI inference server
    inference/
      main.py                 FastAPI entrypoint
      wlasl_landmark_pipeline.py
    model/                    Model files
    requirements.txt          Python dependencies
    start-inference-server.bat

  public/                     Static assets
  data/                       SQLite database
  shared/                     Shared TypeScript types
```

## Yêu Cầu

- Node.js 20+.
- npm 10+.
- Python 3.10 hoặc mới hơn.
- Webcam nếu dùng trang nhận diện realtime.

Trên Windows, TensorFlow bản native mới thường chạy CPU. Điều này vẫn dùng được cho demo realtime, nhưng tốc độ phụ thuộc máy.

## Cài Đặt Frontend/Web Backend

Từ thư mục project:

```bash
cd D:\GitHub\HCL\SmartSignLanguage
npm install
```

Chạy kiểm tra TypeScript:

```bash
npm run typecheck
```

## Cài Đặt AI Backend

Từ thư mục `ai-model`:

```bash
cd D:\GitHub\HCL\SmartSignLanguage\ai-model
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Hoặc chạy script Windows:

```bat
cd D:\GitHub\HCL\SmartSignLanguage\ai-model
install-dependencies.bat
```

## File Model Cần Có

Các file model phải nằm trong:

```text
ai-model/model/
```

Danh sách cần thiết:

```text
model_landmarks.keras
mapping.json
hand_landmarker.task
pose_landmarker.task
```

File `model_weights.pkl` không cần cho runtime vì `model_landmarks.keras` đã chứa kiến trúc và weights.

## Chạy Project

Bạn cần chạy 2 server ở 2 terminal khác nhau.

### Terminal 1: AI Inference Server

```bash
cd D:\GitHub\HCL\SmartSignLanguage\ai-model
python -m uvicorn inference.main:app --host 0.0.0.0 --port 8000
```

Kiểm tra server AI:

```text
http://localhost:8000/health
```

Khi đúng model mới, response sẽ có:

```json
{
  "backend": "wlasl-hands-pose-sequence",
  "num_gestures": 10
}
```

### Terminal 2: Web App

```bash
cd D:\GitHub\HCL\SmartSignLanguage
npm run dev
```

Mở trình duyệt:

```text
http://localhost:8080
```

Trang nhận diện:

```text
http://localhost:8080/recognition
```

## Biến Môi Trường

File mẫu có sẵn tại `.env.example`.

Biến quan trọng cho frontend nhận diện:

```env
VITE_API_URL=http://localhost:8000
```

Nếu AI server chạy port khác, cập nhật biến này trong `.env` hoặc `.env.local`.

## Cách Hoạt Động Của Nhận Diện Realtime

Luồng xử lý:

```text
Webcam frame
  -> frontend gửi ảnh JPEG tới FastAPI
  -> MediaPipe trích xuất 2 tay + pose
  -> gom chuỗi 20 frame
  -> normalize landmarks
  -> model_landmarks.keras dự đoán 1 trong 10 từ
  -> frontend hiển thị kết quả và vẽ landmarks
```

Model cần đủ 20 frame trước khi dự đoán, nên lúc mới bấm Start Recognition, UI sẽ hiển thị trạng thái kiểu:

```text
Collecting frames 1/20
```

Sau khi đủ frame, kết quả nhận diện sẽ xuất hiện.

## API AI Backend

Base URL mặc định:

```text
http://localhost:8000
```

Endpoint chính:

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/health` | Kiểm tra server và model |
| GET | `/api/info` | Thông tin API |
| GET | `/api/gestures` | Danh sách từ model hỗ trợ |
| POST | `/api/predict` | Dự đoán từ file ảnh |
| POST | `/api/predict-base64` | Dự đoán từ ảnh base64 |
| POST | `/api/reset-sequence` | Reset buffer 20 frame |

Ví dụ kiểm tra health:

```bash
curl http://localhost:8000/health
```

## Scripts Hay Dùng

Frontend/web:

```bash
npm run dev          # chạy dev server
npm run build        # build production
npm start            # chạy production build
npm run typecheck    # kiểm tra TypeScript
npm test             # chạy test
npm run format.fix   # format code
```

AI backend:

```bash
python -m uvicorn inference.main:app --host 0.0.0.0 --port 8000
```

Windows script:

```bat
ai-model\start-inference-server.bat
```

## Troubleshooting

### Frontend báo không kết nối được inference server

Kiểm tra AI server đã chạy chưa:

```text
http://localhost:8000/health
```

Nếu không vào được, chạy lại:

```bash
cd D:\GitHub\HCL\SmartSignLanguage\ai-model
python -m uvicorn inference.main:app --host 0.0.0.0 --port 8000
```

### Server chạy nhưng chỉ nhận diện 1 tay

Đảm bảo `/health` trả về:

```json
"backend": "wlasl-hands-pose-sequence"
```

Nếu không phải backend này, bạn đang chạy server cũ. Tắt process cũ rồi chạy lại `inference.main:app`.

MediaPipe cũng có thể chỉ thấy 1 tay nếu:

- Hai tay chồng lên nhau.
- Một tay ra khỏi khung hình.
- Camera thiếu sáng.
- Tay quá xa camera.
- Chuyển động quá nhanh.

### Lỗi thiếu model file

Kiểm tra thư mục:

```text
ai-model/model/
```

Cần có:

```text
model_landmarks.keras
mapping.json
hand_landmarker.task
pose_landmarker.task
```

### Port 8000 hoặc 8080 đã được dùng

Windows:

```bat
netstat -ano | findstr :8000
netstat -ano | findstr :8080
```

Sau đó tắt process theo PID nếu cần:

```bat
taskkill /PID <PID> /F
```

### TensorFlow cảnh báo không dùng GPU trên Windows

Đây là cảnh báo bình thường với TensorFlow native Windows. App vẫn chạy bằng CPU.

## Ghi Chú Về Model

Model hiện tại được train với chuỗi landmarks:

```text
SEQ_LEN = 20
FEATURE_DIM = 225
```

Feature gồm:

```text
left hand  = 21 landmarks * 3 = 63
right hand = 21 landmarks * 3 = 63
pose       = 33 landmarks * 3 = 99
total      = 225
```

Vì model phụ thuộc vào chuỗi frame, kết quả realtime sẽ tốt hơn khi người dùng giữ ký hiệu ổn định trong một khoảng ngắn thay vì đổi động tác quá nhanh.

## Build Production

```bash
npm run build
npm start
```

Lưu ý: production web server không tự chạy AI backend. Nếu cần nhận diện realtime, vẫn phải chạy FastAPI server riêng ở port 8000 hoặc cấu hình lại `VITE_API_URL`.
