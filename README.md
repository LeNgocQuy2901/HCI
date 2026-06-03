# Smart Sign Language

Smart Sign Language là ứng dụng web hỗ trợ học, tra cứu, dịch và nhận diện ngôn ngữ ký hiệu. Dự án kết hợp giao diện React, API Express, cơ sở dữ liệu SQLite cục bộ và một inference server FastAPI riêng cho tính năng nhận diện bằng camera.

## Tính Năng Chính

- Học ngôn ngữ ký hiệu theo chủ đề, bài học và video minh họa.
- Tra cứu từ vựng ký hiệu và xem nội dung liên quan.
- Dịch văn bản sang chuỗi ký hiệu dựa trên dữ liệu landmark.
- Nhận diện ký hiệu từ camera thông qua AI inference server.
- Đăng ký, đăng nhập, quản lý hồ sơ và tiến độ học tập.
- Gửi phản hồi từ người dùng.
- Trang quản trị cho nội dung, vận hành và thống kê.
- Proxy video từ Google Drive thông qua service account.

## Công Nghệ Sử Dụng

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Radix UI
- Zustand
- TanStack Query
- Framer Motion
- MediaPipe Tasks Vision

### Backend

- Node.js
- Express
- SQLite với `better-sqlite3`
- JWT authentication
- Google Drive API

### AI Inference

- Python
- FastAPI
- Uvicorn
- TensorFlow
- MediaPipe
- OpenCV
- ONNX Runtime

## Cấu Trúc Thư Mục

```text
.
|-- SmartSignLanguage/
|   |-- client/                 # React app
|   |-- server/                 # Express API và database logic
|   |-- shared/                 # Shared types/config
|   |-- ai-model/
|   |   |-- inference/          # FastAPI inference service
|   |   |-- model/              # Model files
|   |   `-- training/           # Notebook/script huấn luyện
|   |-- public/                 # Static assets
|   |-- docs/                   # Tài liệu báo cáo/Overleaf
|   |-- tests/                  # K6 tests
|   `-- package.json
`-- README.md
```

## Yêu Cầu Môi Trường

- Node.js 20 trở lên được khuyến nghị.
- npm hoặc pnpm.
- Python 3.10 trở lên cho AI inference server.
- Git.
- Camera/webcam nếu muốn dùng tính năng nhận diện.

## Cài Đặt Web App

```bash
cd SmartSignLanguage
npm install
```

Tạo file `.env` từ file mẫu:

```bash
cp .env.example .env
```

Các giá trị mặc định quan trọng:

```env
DATABASE_PATH=./data/app.db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
VITE_API_URL=http://localhost:8000
PORT=8080
HOST=localhost
NODE_ENV=development
```

Chạy ứng dụng web:

```bash
npm run dev
```

Mặc định web app chạy tại:

```text
http://localhost:8080
```

## Cài Đặt AI Inference Server

Di chuyển vào thư mục AI model:

```bash
cd SmartSignLanguage/ai-model
python -m pip install -r requirements.txt
```

Chạy inference server:

```bash
python -m uvicorn inference.main:app --host 0.0.0.0 --port 8000 --reload
```

Trên Windows có thể dùng script:

```bat
start-inference-server.bat
```

API inference mặc định:

```text
http://localhost:8000
```

## Chạy Toàn Bộ Dự Án Trên Windows

Trong thư mục `SmartSignLanguage`, có thể dùng:

```bat
run-project.bat
```

Script này sẽ:

- Kiểm tra/cài đặt dependency Node nếu chưa có.
- Kiểm tra các file model cần thiết.
- Mở inference server tại `http://localhost:8000`.
- Mở web app tại `http://localhost:8080`.

## Build Production

```bash
cd SmartSignLanguage
npm run build
npm start
```

Lệnh build tạo output trong:

```text
SmartSignLanguage/dist/
```

## Kiểm Tra Chất Lượng Code

```bash
npm run typecheck
npm run test
```

Nếu cần format lại code:

```bash
npm run format.fix
```

## Dữ Liệu Và File Không Nên Commit

Một số file được tạo cục bộ hoặc có kích thước lớn, không nên đưa lên GitHub:

- `SmartSignLanguage/node_modules/`
- `SmartSignLanguage/dist/`
- `SmartSignLanguage/data/`
- `SmartSignLanguage/.env`
- `SmartSignLanguage/service-account-key.json`
- `SmartSignLanguage/public/data/combined_avg_landmarks.json`
- Cache Python như `__pycache__/`
- File log như `*.log`

Nếu cần dùng tính năng dịch dựa trên landmark, đặt file dữ liệu landmark tại:

```text
SmartSignLanguage/public/data/combined_avg_landmarks.json
```

File này có thể rất lớn, nên được tải về hoặc sinh lại cục bộ thay vì commit vào repository.

## Google Drive Video

Backend có endpoint proxy video từ Google Drive. Nếu dùng tính năng này, cần đặt service account key tại:

```text
SmartSignLanguage/service-account-key.json
```

Không commit file này lên GitHub. Tài khoản service account cần có quyền đọc các file video tương ứng trong Google Drive.

## Các Route Chính

```text
/                  Trang chủ
/learn             Học theo bài/chuyên mục
/lookup            Tra cứu ký hiệu
/translate         Dịch văn bản sang ký hiệu
/recognition       Nhận diện ký hiệu bằng camera
/dashboard         Bảng điều khiển người dùng
/profile           Hồ sơ cá nhân
/feedback          Gửi phản hồi
/admin/content     Quản lý nội dung
/admin/analytics   Thống kê quản trị
/admin/operations  Vận hành hệ thống
```

## Ghi Chú Phát Triển

- Express API được gắn vào Vite dev server trong quá trình development.
- SQLite database được tạo tự động theo `DATABASE_PATH`.
- AI inference server chạy riêng và được frontend gọi qua `VITE_API_URL`.
- Các notebook và script huấn luyện nằm trong `SmartSignLanguage/ai-model/training`.
