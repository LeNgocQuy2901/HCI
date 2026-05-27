# Mô tả chi tiết dự án SmartSignLanguage

## 1. Tổng quan dự án

SmartSignLanguage là một ứng dụng web hỗ trợ học, tra cứu, luyện tập và nhận diện ngôn ngữ ký hiệu. Dự án tập trung vào việc giúp người học tiếp cận ký hiệu thông qua video minh họa, bài học theo lộ trình, quiz kiểm tra, ôn tập theo tiến độ cá nhân, nhận diện ký hiệu bằng camera/video và chuyển văn bản sang hoạt ảnh landmark.

Hệ thống được xây dựng theo mô hình tách lớp:

- Frontend: React, TypeScript, Vite, TailwindCSS, Radix UI.
- Backend web: Express, SQLite, JWT.
- Backend AI: FastAPI, MediaPipe, TensorFlow/Keras, OpenCV.
- Dữ liệu dùng chung: thư mục `shared/` chứa từ vựng, bài học, metadata và type chung.

## 2. Mục tiêu dự án

### 2.1 Mục tiêu tổng quát

Xây dựng một nền tảng học ngôn ngữ ký hiệu có tính tương tác, dễ sử dụng và có khả năng mở rộng dữ liệu, giúp người dùng học ký hiệu theo bài học, kiểm tra mức độ ghi nhớ và luyện nhận diện bằng camera.

### 2.2 Mục tiêu cụ thể

- Cung cấp lộ trình học từ vựng ngôn ngữ ký hiệu theo bài học và chủ đề.
- Hỗ trợ người học xem video minh họa, hướng dẫn cách ký hiệu, lỗi thường gặp và mẹo luyện tập.
- Cho phép người học làm quiz để kiểm tra kiến thức sau mỗi bài học.
- Theo dõi tiến độ học, số từ đã học, streak, độ chính xác và các từ yếu cần ôn lại.
- Hỗ trợ tra cứu nhanh video ký hiệu theo từ vựng.
- Hỗ trợ chuyển văn bản sang hoạt ảnh landmark ký hiệu.
- Hỗ trợ nhận diện ký hiệu từ camera hoặc video tải lên.
- Cung cấp giao diện quản trị để quản lý nội dung học, quiz, metadata và video.
- Cung cấp analytics cho admin để đánh giá nội dung khó, bài học có tỷ lệ hoàn thành thấp và lỗi recognition thường gặp.

## 3. Bối cảnh và vấn đề cần giải quyết

Người học ngôn ngữ ký hiệu thường gặp các khó khăn sau:

- Khó hình dung động tác nếu chỉ học bằng chữ hoặc hình ảnh tĩnh.
- Thiếu môi trường luyện tập có phản hồi.
- Khó biết từ nào đã thành thạo, từ nào cần ôn lại.
- Thiếu lộ trình học rõ ràng theo chủ đề và mức độ.
- Khó tra cứu lại video ký hiệu nhanh trong quá trình học.
- Chức năng nhận diện ký hiệu thường cần mô hình AI và camera, khó tích hợp vào ứng dụng học đơn giản.

SmartSignLanguage giải quyết các vấn đề này bằng cách kết hợp học qua video, quiz, dashboard tiến độ, recognition camera và quản trị nội dung.

## 4. Đối tượng sử dụng

### 4.1 Người học

Người học là đối tượng chính của hệ thống. Người học có thể:

- Đăng ký và đăng nhập tài khoản.
- Học theo lộ trình bài học.
- Xem video minh họa ký hiệu.
- Làm quiz kiểm tra.
- Ôn tập các từ đến hạn hoặc các từ còn yếu.
- Luyện nhận diện ký hiệu bằng camera.
- Tra cứu video ký hiệu.
- Xem dashboard tiến độ cá nhân.

### 4.2 Khách chưa đăng nhập

Khách chưa đăng nhập có thể truy cập một số màn hình cơ bản. Tiến độ có thể được lưu cục bộ theo chế độ guest, nhưng để đồng bộ dữ liệu và gắn với hồ sơ cá nhân, người dùng nên đăng nhập.

### 4.3 Quản trị viên

Admin có quyền quản lý nội dung và xem analytics. Admin có thể:

- Quản lý danh sách ký hiệu.
- Thêm/sửa/xóa nội dung từ vựng.
- Gán ký hiệu vào bài học.
- Quản lý video, metadata, hướng dẫn, lỗi thường gặp, mẹo luyện tập.
- Quản lý câu hỏi quiz.
- Đổi trạng thái xuất bản nội dung.
- Xem các thống kê quản trị.

## 5. Các chức năng chính

## 5.1 Xác thực người dùng

Hệ thống hỗ trợ đăng ký, đăng nhập, đăng xuất và lấy thông tin người dùng hiện tại.

Nghiệp vụ chính:

- Người dùng đăng ký bằng email, username, mật khẩu và họ tên.
- Mật khẩu được hash bằng `bcryptjs`.
- Khi đăng nhập thành công, backend trả JWT.
- Frontend lưu token và user trong `localStorage`.
- Các API cần đăng nhập sử dụng header `Authorization: Bearer <token>`.
- Role người dùng gồm `user` và `admin`.

## 5.2 Học theo lộ trình

Trang Learn là trung tâm học tập của hệ thống. Người dùng học theo các bài học đã được cấu hình trong curriculum.

Luồng nghiệp vụ:

1. Người dùng mở trang Learn.
2. Hệ thống hiển thị learning path gồm các khóa/bài học.
3. Người dùng chọn bài học.
4. Hệ thống hiển thị từng thẻ từ vựng trong bài.
5. Người dùng xem từ, video, mô tả, hướng dẫn ký hiệu.
6. Người dùng đánh dấu đã hiểu hoặc cần xem lại.
7. Sau khi hoàn thành các thẻ, hệ thống yêu cầu làm quiz.
8. Người dùng luyện recognition nếu bài học yêu cầu.
9. Khi đạt điều kiện, bài học được đánh dấu hoàn thành.

Thông tin hiển thị trong bài học:

- Tên bài học.
- Chủ đề.
- Số lượng thẻ.
- Tiến độ thành thạo.
- Điểm quiz.
- Bước hiện tại: learn, quiz, recognition hoặc completed.

## 5.3 Thẻ từ vựng và video minh họa

Mỗi ký hiệu được biểu diễn thành một thẻ học.

Một thẻ học gồm:

- Từ vựng.
- Chủ đề.
- Độ khó.
- Mô tả.
- Ví dụ.
- Video ký hiệu.
- Hướng dẫn cách ký hiệu.
- Lỗi thường gặp.
- Mẹo luyện tập.

Người dùng có thể lật thẻ để xem nội dung chi tiết và đánh dấu kết quả học.

## 5.4 Ôn tập và SRS

Hệ thống có cơ chế theo dõi tiến độ theo từng card. Mục tiêu là giúp người học tập trung vào các từ đến hạn hoặc các từ còn yếu.

Dữ liệu tiến độ gồm:

- `status`: `new`, `learning`, `mastered`.
- `attempts`: số lần luyện tập.
- `correctAttempts`: số lần đúng.
- `nextReviewDate`: ngày cần ôn tiếp theo.
- `lastReviewedDate`: lần ôn gần nhất.
- `easeFactor`, `interval`, `difficulty`: thông tin phục vụ lịch ôn tập.

Các nhóm ôn tập:

- Today's Review: các từ đến hạn ôn hôm nay.
- Weak Words: các từ có tỷ lệ đúng thấp hoặc cần luyện thêm.

## 5.5 Quiz kiểm tra kiến thức

Quiz dùng để kiểm tra mức độ hiểu bài của người học.

Các dạng quiz:

- Meaning quiz: chọn nghĩa đúng của ký hiệu.
- Video to word: xem video và chọn từ đúng.
- Word to sign: đọc từ và chọn ký hiệu đúng.
- Common mistake: nhận diện lỗi thường gặp.

Luồng quiz:

1. Người dùng bắt đầu quiz.
2. Hệ thống lấy câu hỏi từ backend nếu đã có câu hỏi published/active.
3. Nếu chưa có, frontend tạo câu hỏi tạm từ bộ từ vựng.
4. Người dùng trả lời từng câu.
5. Hệ thống tính điểm.
6. Nếu là quiz bắt buộc trong bài học, điểm được ghi vào lesson progress.

## 5.6 Nhận diện ký hiệu bằng camera hoặc video

Trang Recognition hỗ trợ nhận diện ký hiệu từ webcam hoặc video tải lên.

Luồng xử lý:

1. Người dùng chọn nguồn nhận diện: camera hoặc video upload.
2. Frontend lấy frame từ video/camera.
3. Frame được gửi tới FastAPI inference server.
4. Server dùng MediaPipe để trích xuất landmark tay và pose.
5. Server gom chuỗi frame theo `SEQ_LEN`.
6. Model Keras dự đoán ký hiệu.
7. Frontend hiển thị kết quả, confidence, trạng thái tay và lịch sử nhận diện.

Các chế độ nhận diện:

- Words: nhận diện các từ trong model chính.
- Alphabet/Number: nhận diện chữ cái và số nếu có `model_alnum.keras`.

Thông tin hiển thị:

- Ký hiệu mới nhất.
- Độ tin cậy.
- Tay được phát hiện.
- Trạng thái server.
- Lịch sử nhận diện.
- Thống kê phiên: tổng số lần nhận diện, confidence trung bình, số gesture khác nhau, thời lượng phiên.

## 5.7 Luyện recognition trong bài học

Khi người học luyện camera từ bài học, hệ thống biết trước từ cần luyện.

Nghiệp vụ:

- Người dùng chọn Practice with Camera trong bài học.
- Trang Recognition nhận `lessonId`, `cardId`, `expectedWord`.
- Khi model dự đoán, hệ thống so sánh `predictedWord` với `expectedWord`.
- Hệ thống tính confidence và stability score.
- Kết quả luyện tập được lưu vào backend.
- Nếu đạt số lần đúng yêu cầu, recognition practice được tính là hoàn thành.

## 5.8 Tra cứu ký hiệu

Trang Lookup cho phép tìm nhanh video ký hiệu theo từ.

Nghiệp vụ:

- Người dùng nhập từ khóa.
- Hệ thống chuẩn hóa chuỗi tìm kiếm.
- Hệ thống lọc trong danh sách từ vựng đang dùng trong Learn.
- Người dùng chọn từ.
- Hệ thống phát video ký hiệu tương ứng.

Thông tin hiển thị:

- Từ vựng.
- Mô tả.
- Video.
- Chủ đề.
- Độ khó.
- Ví dụ nếu có.

## 5.9 Chuyển văn bản sang ký hiệu

Trang Translate chuyển văn bản thành hoạt ảnh landmark.

Luồng nghiệp vụ:

1. Người dùng nhập câu tiếng Anh.
2. Hệ thống chuẩn hóa văn bản: chuyển lowercase, bỏ ký tự không cần thiết.
3. Hệ thống bỏ stopword.
4. Hệ thống tìm cụm từ hoặc từ trong dữ liệu landmark.
5. Nếu không tìm thấy từ, hệ thống fallback sang fingerspelling bằng chữ cái nếu có.
6. Canvas hiển thị hoạt ảnh pose và hand landmarks.

Dữ liệu chính:

- File landmark: `public/data/combined_avg_landmarks.json`.
- Nếu file không tồn tại, hệ thống có fallback landmark cơ bản để trang vẫn hoạt động.

## 5.10 Dashboard người học

Dashboard giúp người học theo dõi tiến độ tổng quan.

Thông tin dashboard:

- Số từ đã thành thạo.
- Số từ đang học.
- Độ chính xác.
- Số bài học đã hoàn thành.
- Thời gian học trong tuần.
- Xu hướng điểm quiz.
- Chủ đề yếu.
- Tiến bộ recognition.
- Mức độ đều đặn ôn tập.
- Bài học nên học tiếp.
- Review queue.
- Từ yếu.
- Lịch sử recognition practice.
- Đề xuất ôn tập.

## 5.11 Quản trị nội dung

Trang Admin Content dành cho admin.

Chức năng:

- Xem toàn bộ danh sách ký hiệu.
- Lọc theo trạng thái nội dung.
- Lọc theo trạng thái xuất bản.
- Lọc theo ưu tiên.
- Tạo ký hiệu mới.
- Sửa ký hiệu.
- Xóa ký hiệu.
- Quản lý video chính.
- Quản lý metadata.
- Gán ký hiệu vào bài học.
- Tạo/sửa/xóa câu hỏi quiz.
- Xem preview quiz.
- Đổi trạng thái bài học.

Các trạng thái nội dung:

- `draft`: bản nháp.
- `ready`: sẵn sàng kiểm tra/xuất bản.
- `published`: được đưa vào nội dung học.
- `archived`: lưu trữ, không dùng chính.

Hệ thống cũng tính completeness score để admin biết nội dung nào thiếu video, metadata hoặc quiz.

## 5.12 Admin Analytics

Trang Admin Analytics giúp admin đánh giá chất lượng học và nội dung.

Các nhóm analytics:

- Most Difficult Signs: ký hiệu khó nhất theo tỷ lệ đúng.
- Lesson Completion Rate: tỷ lệ hoàn thành bài học.
- Quiz Fail Rate: tỷ lệ làm quiz chưa đạt.
- Recognition Fail Rate: tỷ lệ luyện recognition sai.
- Content Needing Improvement: nội dung thiếu video, metadata hoặc quiz.
- Event Volume: số lượng sự kiện học tập theo loại.

## 6. Nghiệp vụ phân quyền

Hệ thống có hai role:

| Role | Quyền |
|---|---|
| user | Học, quiz, tra cứu, dịch, recognition, dashboard cá nhân, hồ sơ. |
| admin | Có toàn bộ quyền user và thêm quyền quản lý nội dung, xem analytics quản trị. |

Admin được xác định bằng:

- Cột `role` trong bảng `users`.
- Middleware `requireAdmin` kiểm tra role trong database.
- Frontend chỉ hiện menu admin nếu `user.role === "admin"`.

Các route admin được bảo vệ:

- `/api/content/*`
- `/api/admin/analytics/*`

## 7. Kiến trúc hệ thống

### 7.1 Frontend

Frontend nằm trong thư mục `client/`.

Các trang chính:

- `Index.tsx`: trang chủ.
- `Learn.tsx`: học theo lộ trình, quiz, review, stats.
- `Recognition.tsx`: nhận diện ký hiệu.
- `Translate.tsx`: text-to-sign.
- `Lookup.tsx`: tra cứu video ký hiệu.
- `Dashboard.tsx`: dashboard người học.
- `Profile.tsx`: hồ sơ.
- `Login.tsx`, `Register.tsx`: xác thực.
- `AdminContent.tsx`: quản trị nội dung.
- `AdminAnalytics.tsx`: analytics admin.

Các thành phần quan trọng:

- `Layout.tsx`: navbar, footer, menu, theme toggle.
- `VocabularyCardFlip.tsx`: thẻ học từ vựng.
- `QuizComponent.tsx`: giao diện quiz.
- `ProgressTracker.tsx`: thống kê nhanh.

### 7.2 Backend web

Backend nằm trong thư mục `server/`.

Các route chính:

- `/api/auth`: đăng ký, đăng nhập, lấy user hiện tại, cập nhật hồ sơ, logout.
- `/api/learning`: tiến độ học, quiz, published content, recognition practice, analytics cá nhân.
- `/api/content`: quản trị nội dung.
- `/api/admin/analytics`: analytics quản trị.
- `/api/video-stream`: stream video.

### 7.3 AI backend

AI backend nằm trong `ai-model/`.

Thành phần chính:

- `inference/main.py`: FastAPI server.
- `inference/wlasl_landmark_pipeline.py`: pipeline trích xuất landmark và dự đoán.
- `model/model_landmarks.keras`: model nhận diện từ.
- `model/model_alnum.keras`: model nhận diện chữ cái/số nếu có.
- `model/mapping.json`: mapping từ cho model words.
- `model/mapping_alnum.json`: mapping cho model alnum.
- `model/hand_landmarker.task`, `model/pose_landmarker.task`: MediaPipe task files.

## 8. Thiết kế dữ liệu

Các nhóm bảng chính:

- `users`: tài khoản, role, thông tin người dùng.
- `learning_progress`: tiến độ theo từng card.
- `user_lesson_progress`: tiến độ theo từng bài học.
- `user_recognition_practice`: lịch sử luyện recognition.
- `user_learning_events`: sự kiện học tập phục vụ analytics.
- `signs`: danh sách ký hiệu.
- `sign_metadata`: hướng dẫn, lỗi thường gặp, mẹo luyện tập.
- `sign_media`: video/media của ký hiệu.
- `lessons`: bài học.
- `lesson_signs`: quan hệ bài học - ký hiệu.
- `quiz_questions`: câu hỏi quiz.

## 9. Luồng dữ liệu chính

### 9.1 Luồng học

```text
User mở Learn
-> Frontend tải published content
-> User chọn lesson
-> Xem card/video/metadata
-> Đánh dấu đúng hoặc cần ôn
-> Zustand cập nhật local progress
-> Nếu đăng nhập, sync progress lên backend
-> Dashboard đọc dữ liệu để hiển thị tiến độ
```

### 9.2 Luồng quiz

```text
User bắt đầu quiz
-> Frontend gọi API quiz theo lesson
-> Backend trả câu hỏi active/published
-> User trả lời
-> Frontend tính điểm
-> Ghi lesson progress và learning event
-> Dashboard/Admin Analytics sử dụng dữ liệu này
```

### 9.3 Luồng recognition

```text
Camera/video frame
-> Frontend gửi ảnh JPEG đến FastAPI
-> MediaPipe trích xuất hand + pose landmarks
-> Gom đủ SEQ_LEN frame
-> Normalize sequence
-> Keras model dự đoán
-> Frontend hiển thị gesture + confidence
-> Nếu là lesson practice, lưu kết quả vào backend
```

### 9.4 Luồng quản trị nội dung

```text
Admin đăng nhập
-> Mở /admin/content
-> Backend kiểm tra JWT và role admin
-> Admin sửa sign/metadata/video/quiz/lesson
-> Backend lưu SQLite
-> Nội dung published được đưa vào Learn
```

## 10. Yêu cầu phi chức năng

- Dễ sử dụng: giao diện rõ ràng, chia theo chức năng học, dịch, nhận diện, dashboard.
- Tính phản hồi: trạng thái học được cập nhật ngay trên frontend.
- Bảo mật cơ bản: JWT, hash mật khẩu, middleware kiểm tra admin.
- Khả năng mở rộng: admin có thể thêm ký hiệu, metadata, quiz và bài học mới.
- Khả năng theo dõi: dashboard và analytics hỗ trợ đánh giá tiến độ.
- Khả năng chạy local: project có thể chạy bằng Node.js, npm và Python/FastAPI.
- Khả năng phục hồi: text-to-sign có fallback nếu thiếu file landmark JSON.

## 11. Giới hạn hiện tại

- Chất lượng recognition phụ thuộc vào dataset, ánh sáng, camera và mô hình.
- Text-to-sign hiện chủ yếu dựa vào ánh xạ từ/cụm từ có sẵn, chưa xử lý ngữ pháp ký hiệu chuyên sâu.
- Nếu model không có đủ lớp, hệ thống chỉ có thể dự đoán trong phạm vi mapping hiện tại.
- Một số dữ liệu video/landmark cần được bổ sung và chuẩn hóa thêm.
- Chưa có hệ sinh thái cộng đồng/forum trong app.
- Chưa có mobile app native, hiện chủ yếu là web app.

## 12. Định hướng phát triển

- Mở rộng bộ dữ liệu ký hiệu theo nhiều chủ đề hơn.
- Train model recognition với nhiều người ký, nhiều góc quay và nhiều điều kiện ánh sáng.
- Bổ sung model nhận diện chữ cái, số và câu giao tiếp phổ biến.
- Cải thiện text-to-sign bằng NLP để chuyển câu tự nhiên sang cấu trúc ký hiệu phù hợp hơn.
- Đồng bộ tiến độ học đa thiết bị ổn định hơn.
- Thêm achievement, leaderboard hoặc cộng đồng học tập nếu phù hợp.
- Tối ưu UI mobile và phát triển PWA.
- Bổ sung công cụ đánh giá chất lượng dữ liệu cho admin.

## 13. Kết luận

SmartSignLanguage là một hệ thống học ngôn ngữ ký hiệu có đầy đủ các thành phần quan trọng: học theo lộ trình, video minh họa, quiz, ôn tập, dashboard, tra cứu, text-to-sign, sign-to-text và quản trị nội dung. Với kiến trúc tách frontend, backend web và AI backend, project có nền tảng tốt để tiếp tục mở rộng dữ liệu, nâng cấp mô hình AI và hoàn thiện trải nghiệm học tập.
