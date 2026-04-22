# Luồng Hoạt Động Của Ứng Dụng Smart Sign Language

## 1. Mục tiêu của ứng dụng
Smart Sign Language là ứng dụng học ngôn ngữ ký hiệu, gồm các chức năng chính:
- Học từ vựng theo chủ đề
- Ôn tập lại những từ đã nắm vững
- Làm bài kiểm tra trắc nghiệm
- Dịch văn bản sang ký hiệu
- Nhận dạng ký hiệu từ camera
- Trò chuyện và kết nối người dùng

## 2. Luồng hoạt động chung của app
### Bước 1: Người dùng mở app
- Ứng dụng khởi chạy giao diện React ở trình duyệt.
- Trang chủ hiển thị tên Smart Sign Language, logo và các nút vào từng chức năng.
- Thanh điều hướng cho phép chuyển nhanh giữa các màn hình.

### Bước 2: Người dùng chọn chức năng
- Nếu chọn **Học**, app mở màn hình học theo chủ đề.
- Nếu chọn **Ôn tập**, app hiển thị các từ đã bấm “Đã hiểu”.
- Nếu chọn **Kiểm tra**, app sinh câu hỏi trắc nghiệm theo chủ đề.
- Nếu chọn **Dịch**, app đi tới màn hình dịch văn bản.
- Nếu chọn **Nhận dạng**, app đi tới màn hình camera nhận dạng ký hiệu.
- Nếu chọn **Trò chuyện**, app mở màn hình giao tiếp giữa người dùng.

### Bước 3: Dữ liệu được lấy từ đâu
- Dữ liệu từ vựng được lưu trong `shared/vocabulary.ts`.
- Link video và tên video Google Drive được quản lý trong `shared/google-drive.ts`.
- Ảnh/video và các card học đều lấy từ hai file này.
- Phần tiến độ học được lưu tạm ở store của frontend.

### Bước 4: Khi người dùng học
- App hiển thị từ vựng theo chủ đề.
- Mỗi thẻ có mặt chữ và mặt video.
- Người dùng bấm **Đã hiểu** hoặc **Xem lại**.
- App chuyển sang từ tiếp theo.
- Từ đã bấm **Đã hiểu** sẽ được đưa vào danh sách ôn tập.

### Bước 5: Khi người dùng ôn tập
- Tab Ôn tập đọc lại danh sách từ đã đánh dấu hiểu.
- Người dùng có thể bấm vào từng từ để quay lại học lại từ đó.
- Mục này giúp ôn lại những từ đã học trước đó.

### Bước 6: Khi làm kiểm tra
- App chọn chủ đề người dùng muốn làm bài.
- Hệ thống tạo câu hỏi ngẫu nhiên trong đúng chủ đề đó.
- Mỗi câu sẽ có 4 lựa chọn cùng chủ đề để tránh lẫn đáp án.
- Sau khi nộp bài, app chấm điểm và báo kết quả.

### Bước 7: Khi dịch hoặc nhận dạng
- Màn hình Dịch dùng để chuyển nội dung văn bản sang hỗ trợ giao tiếp ký hiệu.
- Màn hình Nhận dạng dùng camera và luồng video để hỗ trợ nhận dạng ký hiệu.
- Hai màn này là các chức năng riêng, tách với phần Học/Kiểm tra.

## 3. Luồng hoạt động chi tiết theo từng màn hình
### 3.1 Trang chủ
- Hiển thị tên ứng dụng Smart Sign Language.
- Có logo, mô tả, và các nút điều hướng.
- Có phần giới thiệu tính năng chính của app.

### 3.2 Màn hình Học
- Chọn chủ đề: Chào hỏi, Số đếm, Cảm xúc, Hành động, Gia đình, Động vật, Màu sắc.
- App lọc dữ liệu theo chủ đề đã chọn.
- Người dùng xem thẻ từ vựng.
- Bấm **Đã hiểu** để ghi nhận từ đó.
- Bấm **Xem lại** nếu chưa nắm chắc.

### 3.3 Màn hình Ôn tập
- Hiển thị những từ đã được bấm **Đã hiểu**.
- Người dùng bấm vào từ nào thì app quay lại màn hình học của từ đó.
- Đây là cách app tạo vòng lặp học -> hiểu -> ôn lại.

### 3.4 Màn hình Kiểm tra
- Chọn chủ đề để làm bài.
- Câu hỏi sinh tự động từ đúng chủ đề.
- Mỗi câu có 4 đáp án cùng chủ đề.
- Nộp bài xong sẽ có điểm số và phần phản hồi.

### 3.5 Màn hình Thống kê
- Đếm số từ đã nắm vững.
- Đếm chuỗi ngày học.
- Đếm số từ đã học trong ngày.
- Đếm tổng số từ có sẵn.

## 4. Công nghệ sử dụng cho từng phần
### Frontend
- **React 18**: xây dựng giao diện theo component.
- **Vite**: chạy app nhanh và build frontend.
- **TypeScript**: tăng an toàn kiểu dữ liệu.
- **React Router 6**: chuyển trang SPA.
- **Zustand**: quản lý state học tập, ôn tập, tiến độ.
- **Tailwind CSS 3**: tạo giao diện nhanh bằng class.
- **Radix UI**: các component UI như Tabs, Select, Dropdown, Button.
- **Lucide React**: icon cho giao diện.
- **Framer Motion**: hiệu ứng chuyển động nếu có dùng trong UI.

### Backend
- **Express**: server API chính.
- **JWT**: xác thực đăng nhập.
- **bcryptjs**: mã hóa mật khẩu.
- **SQLite / better-sqlite3**: lưu dữ liệu người dùng và nghiệp vụ server.
- **zod**: kiểm tra dữ liệu đầu vào.

### Dữ liệu và video
- **Google Drive**: lưu video bài học.
- **shared/vocabulary.ts**: danh sách từ vựng chung cho Learn và Quiz.
- **shared/google-drive.ts**: map tên video với fileId và tên hiển thị.
- **API `/api/video-stream/:videoKey`**: stream video từ server.

### Lưu tiến độ
- **Zustand persist / localStorage**: lưu tiến độ học tạm thời ở trình duyệt.
- Sau này có thể đổi sang database nếu muốn lưu thật trên server.

## 5. Vai trò của từng file chính
- `client/pages/Index.tsx`: trang chủ.
- `client/pages/Learn.tsx`: màn hình học, ôn tập, kiểm tra.
- `client/components/VocabularyCardFlip.tsx`: hiển thị thẻ học và video.
- `client/components/QuizComponent.tsx`: hiển thị câu hỏi kiểm tra.
- `client/components/ProgressTracker.tsx`: hiển thị thống kê.
- `client/components/Layout.tsx`: thanh menu, logo, footer.
- `client/hooks/use-learning-store.ts`: lưu trạng thái học và ôn tập.
- `shared/vocabulary.ts`: nguồn dữ liệu từ vựng, chủ đề, câu hỏi.
- `shared/google-drive.ts`: nguồn video Google Drive.
- `server/routes/video.ts`: stream video.
- `server/routes/auth.ts`: xử lý đăng ký, đăng nhập.

## 6. Cách giải thích ngắn khi cô hỏi vấn đáp
### Nếu cô hỏi: App hoạt động như nào?
- App là SPA bằng React. Người dùng vào trang chủ, chọn Học, Ôn tập, Kiểm tra, Dịch hoặc Nhận dạng. Dữ liệu từ vựng lấy từ shared, video lấy từ Google Drive, tiến độ được lưu bằng Zustand/localStorage.

### Nếu cô hỏi: Vì sao dùng shared?
- Vì Learn và Quiz đều dùng chung một nguồn dữ liệu để tránh lệch nội dung.

### Nếu cô hỏi: Vì sao dùng Zustand?
- Vì nó nhẹ, đơn giản, phù hợp để lưu trạng thái học tập và tiến độ ngay trên frontend.

### Nếu cô hỏi: Vì sao dùng React Router?
- Vì ứng dụng nhiều màn hình nhưng vẫn chạy dạng SPA, chuyển trang nhanh mà không reload toàn bộ.

### Nếu cô hỏi: Video lấy từ đâu?
- Video được map trong `shared/google-drive.ts`, rồi server stream qua API để frontend phát.

### Nếu cô hỏi: Thống kê lấy từ đâu?
- Thống kê lấy từ store tiến độ học và danh sách từ đã bấm “Đã hiểu”.

## 7. Kết luận ngắn
Smart Sign Language là ứng dụng học ngôn ngữ ký hiệu theo kiểu SPA. Frontend dùng React + Vite + TypeScript, dữ liệu từ vựng đặt trong shared để Learn và Quiz dùng chung, video được stream từ Google Drive qua Express, còn tiến độ học được lưu tạm bằng Zustand và localStorage.
