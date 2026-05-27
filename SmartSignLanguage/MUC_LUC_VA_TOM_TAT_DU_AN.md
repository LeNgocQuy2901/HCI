# Mục lục và nội dung tóm tắt dự án SmartSignLanguage

## Mục lục

1. [Giới thiệu bài toán](#1-giới-thiệu-bài-toán)
   - 1.1 [Bối cảnh và động lực](#11-bối-cảnh-và-động-lực)
   - 1.2 [Mục tiêu dự án](#12-mục-tiêu-dự-án)
   - 1.3 [Phạm vi và giới hạn](#13-phạm-vi-và-giới-hạn)
2. [Cơ sở lý thuyết và nghiệp vụ](#2-cơ-sở-lý-thuyết-và-nghiệp-vụ)
   - 2.1 [Người dùng mục tiêu](#21-người-dùng-mục-tiêu)
   - 2.2 [Khó khăn trong giao tiếp và học ngôn ngữ ký hiệu](#22-khó-khăn-trong-giao-tiếp-và-học-ngôn-ngữ-ký-hiệu)
   - 2.3 [Tổng quan ngôn ngữ ký hiệu trong hệ thống](#23-tổng-quan-ngôn-ngữ-ký-hiệu-trong-hệ-thống)
3. [Giới thiệu giải pháp SmartSignLanguage](#3-giới-thiệu-giải-pháp-smartsignlanguage)
   - 3.1 [Tổng quan hệ thống](#31-tổng-quan-hệ-thống)
   - 3.2 [Các nhóm chức năng chính](#32-các-nhóm-chức-năng-chính)
   - 3.3 [Đối tượng và các bên liên quan](#33-đối-tượng-và-các-bên-liên-quan)
4. [Phân tích yêu cầu người dùng](#4-phân-tích-yêu-cầu-người-dùng)
   - 4.1 [Tác nhân của hệ thống](#41-tác-nhân-của-hệ-thống)
   - 4.2 [Bảng ca sử dụng](#42-bảng-ca-sử-dụng)
   - 4.3 [Mô tả tóm tắt các ca sử dụng chính](#43-mô-tả-tóm-tắt-các-ca-sử-dụng-chính)
   - 4.4 [Yêu cầu phi chức năng](#44-yêu-cầu-phi-chức-năng)
5. [Thiết kế hệ thống](#5-thiết-kế-hệ-thống)
   - 5.1 [Kiến trúc tổng thể](#51-kiến-trúc-tổng-thể)
   - 5.2 [Tầng trình diễn](#52-tầng-trình-diễn)
   - 5.3 [Tầng nghiệp vụ](#53-tầng-nghiệp-vụ)
   - 5.4 [Tầng dữ liệu](#54-tầng-dữ-liệu)
   - 5.5 [Tích hợp mô hình AI](#55-tích-hợp-mô-hình-ai)
6. [Thiết kế dữ liệu và nội dung học](#6-thiết-kế-dữ-liệu-và-nội-dung-học)
   - 6.1 [Từ vựng, bài học và chủ đề](#61-từ-vựng-bài-học-và-chủ-đề)
   - 6.2 [Video, landmark và metadata ký hiệu](#62-video-landmark-và-metadata-ký-hiệu)
   - 6.3 [Tiến độ học tập và lịch ôn tập](#63-tiến-độ-học-tập-và-lịch-ôn-tập)
7. [Kiểm thử và đánh giá](#7-kiểm-thử-và-đánh-giá)
   - 7.1 [Kiểm thử chức năng](#71-kiểm-thử-chức-năng)
   - 7.2 [Kiểm thử AI và nhận diện](#72-kiểm-thử-ai-và-nhận-diện)
   - 7.3 [Kết quả đạt được](#73-kết-quả-đạt-được)
8. [Khó khăn và định hướng phát triển](#8-khó-khăn-và-định-hướng-phát-triển)
   - 8.1 [Khó khăn hiện tại](#81-khó-khăn-hiện-tại)
   - 8.2 [Định hướng tương lai](#82-định-hướng-tương-lai)
9. [Tổng kết](#9-tổng-kết)

## 1. Giới thiệu bài toán

### 1.1 Bối cảnh và động lực

Người khiếm thính, người gặp khó khăn trong giao tiếp bằng lời nói và người muốn học ngôn ngữ ký hiệu thường thiếu một môi trường học tập có tính tương tác, có video minh họa, có kiểm tra kiến thức và có phản hồi khi luyện tập. SmartSignLanguage được xây dựng để hỗ trợ việc học, tra cứu và luyện nhận diện ký hiệu ngay trên trình duyệt.

### 1.2 Mục tiêu dự án

Dự án hướng tới một ứng dụng web giúp người dùng học từ vựng ngôn ngữ ký hiệu theo bài học, xem video minh họa, làm quiz, ôn tập theo tiến độ cá nhân, tra cứu ký hiệu, chuyển văn bản sang hoạt ảnh landmark và nhận diện ký hiệu từ camera hoặc video tải lên.

### 1.3 Phạm vi và giới hạn

Phạm vi hiện tại tập trung vào bộ từ vựng đã được cấu hình trong hệ thống, các bài học đã xuất bản, video mẫu và mô hình nhận diện có sẵn. Chức năng nhận diện phụ thuộc vào chất lượng camera/video, ánh sáng, góc tay, số lượng dữ liệu huấn luyện và việc inference server FastAPI đang hoạt động.

## 2. Cơ sở lý thuyết và nghiệp vụ

### 2.1 Người dùng mục tiêu

Người dùng chính gồm người mới học ngôn ngữ ký hiệu, người cần ôn luyện từ vựng ký hiệu, giáo viên/người hướng dẫn cần quản lý nội dung học, và quản trị viên cần theo dõi chất lượng nội dung cũng như hiệu quả học tập.

### 2.2 Khó khăn trong giao tiếp và học ngôn ngữ ký hiệu

Ngôn ngữ ký hiệu yêu cầu người học ghi nhớ chuyển động tay, vị trí tay, biểu cảm, hướng chuyển động và ngữ cảnh sử dụng. Nếu chỉ học bằng chữ, người học khó hình dung động tác. Nếu chỉ xem video rời rạc, người học thiếu hệ thống kiểm tra và lộ trình ôn tập. Vì vậy dự án kết hợp video, quiz, nhận diện camera và dashboard tiến độ.

### 2.3 Tổng quan ngôn ngữ ký hiệu trong hệ thống

Trong project, mỗi ký hiệu được biểu diễn bằng từ vựng, chủ đề, độ khó, mô tả, ví dụ, video hoặc dữ liệu landmark. Các ký hiệu được gom vào bài học, bài quiz và các luồng luyện tập camera để tạo thành vòng học: xem mẫu, ghi nhớ, kiểm tra, luyện nhận diện và ôn lại.

## 3. Giới thiệu giải pháp SmartSignLanguage

### 3.1 Tổng quan hệ thống

SmartSignLanguage là ứng dụng web dùng React, TypeScript và Vite cho frontend; Express, SQLite và JWT cho backend web; FastAPI, MediaPipe, OpenCV và TensorFlow/Keras cho AI inference. Ứng dụng có các route chính: trang chủ, học, tra cứu, dịch, nhận diện, dashboard, hồ sơ, đăng nhập, đăng ký, phản hồi, quản trị nội dung và quản trị analytics.

### 3.2 Các nhóm chức năng chính

- Học theo lộ trình: người dùng chọn bài học, xem thẻ từ vựng, video minh họa, hướng dẫn ký hiệu, lỗi thường gặp và mẹo luyện tập.
- Ôn tập và SRS: hệ thống lưu tiến độ, trạng thái từ mới/đang học/thành thạo, lịch ôn tập, streak và các từ yếu.
- Quiz: hệ thống tạo hoặc tải câu hỏi theo bài học/chủ đề, có nhiều dạng như video-to-word, word-to-sign, meaning quiz và common mistake.
- Từ điển/tra cứu: người dùng tìm từ trong bộ từ vựng học và phát video ký hiệu tương ứng.
- Text to Sign: người dùng nhập văn bản, hệ thống chuẩn hóa câu, bỏ stopword, ánh xạ từ/cụm từ sang chuỗi landmark và hiển thị hoạt ảnh skeleton.
- Sign to Text/Recognition: người dùng dùng camera hoặc tải video lên để nhận diện ký hiệu, xem độ tin cậy, lịch sử nhận diện và thống kê phiên.
- Dashboard học tập: hiển thị mastery, accuracy, lesson completion, review queue, weak words, recognition history và đề xuất ôn tập.
- Quản trị nội dung: admin tạo/sửa/xóa ký hiệu, metadata, video, bài học, câu hỏi quiz và kiểm tra mức độ hoàn thiện nội dung.
- Quản trị analytics: admin xem ký hiệu khó, tỷ lệ hoàn thành bài học, tỷ lệ fail quiz, tỷ lệ fail recognition và nội dung cần cải thiện.

### 3.3 Đối tượng và các bên liên quan

Người học sử dụng các chức năng học, ôn tập, quiz, tra cứu, dịch và nhận diện. Quản trị viên quản lý nội dung, xuất bản bài học và theo dõi analytics. Hệ thống AI đảm nhiệm nhận diện landmark và dự đoán ký hiệu. Backend lưu người dùng, tiến độ, lịch sử luyện tập và sự kiện học tập.

## 4. Phân tích yêu cầu người dùng

### 4.1 Tác nhân của hệ thống

| Tác nhân | Vai trò |
|---|---|
| Guest | Có thể xem một số nội dung và dùng tiến độ cục bộ trên trình duyệt. |
| Learner | Đăng ký, đăng nhập, học, ôn tập, làm quiz, luyện camera, xem dashboard và cập nhật hồ sơ. |
| Admin | Quản lý ký hiệu, bài học, metadata, quiz, trạng thái xuất bản và xem analytics. |
| AI Inference Server | Nhận frame/video từ frontend, trích xuất landmark và trả kết quả dự đoán. |

### 4.2 Bảng ca sử dụng

| Mã | Ca sử dụng | Tác nhân | Kết quả mong muốn |
|---|---|---|---|
| UC01 | Đăng ký tài khoản | Guest | Tạo tài khoản, nhận JWT, chuyển sang trạng thái đăng nhập. |
| UC02 | Đăng nhập | Guest/Learner | Xác thực tài khoản, tải hồ sơ và đồng bộ tiến độ. |
| UC03 | Học bài theo lộ trình | Learner | Xem bài học, học từng ký hiệu và ghi nhận hiểu/chưa hiểu. |
| UC04 | Ôn tập theo lịch | Learner | Xem các thẻ đến hạn và các từ yếu cần luyện thêm. |
| UC05 | Làm quiz | Learner | Trả lời câu hỏi, nhận điểm, xác định đạt/chưa đạt. |
| UC06 | Luyện nhận diện bằng camera | Learner | Camera/video được phân tích, hệ thống trả ký hiệu và độ tin cậy. |
| UC07 | Tra cứu video ký hiệu | Learner | Tìm từ vựng và xem video minh họa tương ứng. |
| UC08 | Chuyển văn bản sang ký hiệu | Learner | Văn bản được chuyển thành chuỗi landmark/hoạt ảnh ký hiệu. |
| UC09 | Xem dashboard học tập | Learner | Theo dõi mastery, accuracy, bài học, queue ôn tập và lịch sử recognition. |
| UC10 | Quản lý nội dung học | Admin | Tạo/sửa/xuất bản ký hiệu, bài học, metadata, video và quiz. |
| UC11 | Xem analytics quản trị | Admin | Phát hiện nội dung khó, bài học tụt tiến độ và lỗi nhận diện thường gặp. |

### 4.3 Mô tả tóm tắt các ca sử dụng chính

Đăng ký và đăng nhập dùng API auth, mật khẩu được băm bằng bcryptjs, phiên đăng nhập dùng JWT và thông tin user được lưu trên frontend để gọi các API cần xác thực.

Luồng học bắt đầu từ learning path. Người dùng mở một lesson, xem từng vocabulary card, đọc hướng dẫn, xem video và đánh dấu kết quả. Khi hoàn thành phần học, người dùng làm quiz bắt buộc và luyện recognition để hoàn thành bài.

Luồng quiz lấy câu hỏi đã xuất bản từ server nếu có, nếu không có thì tạo câu hỏi từ bộ từ vựng hiện tại. Kết quả quiz được ghi vào lesson progress và learning event để dashboard/analytics sử dụng.

Luồng recognition dùng camera hoặc video upload. Frontend gửi frame JPEG tới FastAPI theo chu kỳ, server trả về gesture, confidence, landmarks và trạng thái warming up nếu chưa đủ frame. Với lesson practice, hệ thống so sánh kết quả dự đoán với từ kỳ vọng, tính độ ổn định và lưu kết quả luyện tập.

Luồng quản trị nội dung cho phép admin kiểm tra ký hiệu còn thiếu video, thiếu metadata hoặc thiếu quiz. Chỉ nội dung đạt điều kiện và ở trạng thái published mới được đưa vào bài học của người dùng.

### 4.4 Yêu cầu phi chức năng

- Dễ sử dụng: giao diện chia theo các màn hình rõ ràng như Learn, Lookup, Translate, Recognition và Dashboard.
- Phản hồi nhanh: frontend chạy SPA, thao tác học và ôn tập được lưu cục bộ trước khi đồng bộ server.
- Bảo mật cơ bản: xác thực JWT, phân quyền admin cho trang quản trị.
- Khả năng mở rộng nội dung: ký hiệu, bài học, metadata, media và quiz có luồng quản trị riêng.
- Khả năng quan sát: dashboard learner và admin analytics giúp theo dõi tiến độ, lỗi học tập và chất lượng nội dung.
- Phụ thuộc môi trường: recognition cần inference server riêng, model files và camera/video đủ chất lượng.

## 5. Thiết kế hệ thống

### 5.1 Kiến trúc tổng thể

Hệ thống gồm ba phần chính: frontend React/Vite, backend Express và AI backend FastAPI. Frontend gọi backend web qua `/api/*` để lấy nội dung, auth, tiến độ và analytics; đồng thời gọi FastAPI qua `VITE_API_URL` để nhận diện ký hiệu.

### 5.2 Tầng trình diễn

Frontend nằm trong `client/`, sử dụng React Router cho điều hướng, Tailwind CSS và Radix UI cho giao diện, Zustand cho state học tập và auth, React Query cho nền tảng gọi dữ liệu. Các trang quan trọng gồm `Learn.tsx`, `Recognition.tsx`, `Translate.tsx`, `Lookup.tsx`, `Dashboard.tsx`, `AdminContent.tsx` và `AdminAnalytics.tsx`.

### 5.3 Tầng nghiệp vụ

Backend Express nằm trong `server/`, xử lý auth, learning progress, published content, quiz, recognition practice, content management, video streaming và analytics. Các nghiệp vụ quan trọng gồm đồng bộ tiến độ học, ghi learning event, lưu lịch sử nhận diện, quản lý trạng thái xuất bản nội dung và tính toán analytics.

### 5.4 Tầng dữ liệu

SQLite lưu người dùng, tiến độ học, tiến độ bài học, ký hiệu, media, metadata, câu hỏi quiz, sự kiện học tập và lịch sử luyện recognition. Dữ liệu tĩnh dùng chung như vocabulary, curriculum, content type và google drive mapping nằm trong thư mục `shared/`.

### 5.5 Tích hợp mô hình AI

AI backend nằm trong `ai-model/`, dùng FastAPI làm server inference. Pipeline nhận ảnh từ frontend, dùng MediaPipe để trích xuất hai tay và pose, gom chuỗi frame, chuẩn hóa landmark và dùng model Keras để dự đoán ký hiệu. Hệ thống hỗ trợ chế độ words và alphabet/number, đồng thời trả landmarks để frontend vẽ overlay.

## 6. Thiết kế dữ liệu và nội dung học

### 6.1 Từ vựng, bài học và chủ đề

Từ vựng được phân loại theo chủ đề và độ khó. Bài học thuộc các level/lộ trình, có danh sách card, thứ tự bài, điểm quiz yêu cầu và yêu cầu luyện recognition. Điều này giúp hệ thống mở rộng từ học tự do sang lộ trình có điều kiện hoàn thành.

### 6.2 Video, landmark và metadata ký hiệu

Mỗi ký hiệu có thể có video minh họa, hướng dẫn cách ký hiệu, lỗi thường gặp, mẹo luyện tập và câu ví dụ. Text-to-sign dùng dữ liệu landmark trung bình để dựng hoạt ảnh skeleton, còn Learn/Lookup dùng video để người học quan sát động tác thực tế.

### 6.3 Tiến độ học tập và lịch ôn tập

Tiến độ học được lưu theo user và card. Hệ thống ghi trạng thái `new`, `learning`, `mastered`, số lần thử, số lần đúng, ngày ôn tiếp theo và streak. Thuật toán ôn tập theo hướng SRS giúp đưa các từ yếu hoặc đến hạn quay lại queue luyện tập.

## 7. Kiểm thử và đánh giá

### 7.1 Kiểm thử chức năng

Các luồng cần kiểm thử gồm đăng ký, đăng nhập, tải nội dung đã xuất bản, bắt đầu bài học, đánh dấu thẻ, làm quiz, đồng bộ tiến độ, tra cứu video, nhập văn bản để sinh hoạt ảnh, xem dashboard và thao tác quản trị nội dung.

### 7.2 Kiểm thử AI và nhận diện

Recognition cần kiểm thử kết nối FastAPI, health check, reset sequence, camera permission, upload video, hai chế độ words/alnum, trạng thái warming up, confidence threshold, stability window và lưu kết quả lesson practice. Nên kiểm thử với nhiều điều kiện ánh sáng, khoảng cách camera và tốc độ chuyển động.

### 7.3 Kết quả đạt được

Project đã có nền tảng học ngôn ngữ ký hiệu tương đối đầy đủ: có lộ trình học, quiz, SRS, dashboard, tra cứu video, text-to-sign bằng landmark, sign-to-text bằng model AI, quản trị nội dung và analytics. Đây là cơ sở tốt để phát triển thành hệ thống học và luyện ký hiệu có dữ liệu mở rộng.

## 8. Khó khăn và định hướng phát triển

### 8.1 Khó khăn hiện tại

- Chất lượng nhận diện phụ thuộc mạnh vào dữ liệu huấn luyện, ánh sáng, góc quay và độ ổn định của tay.
- Bộ từ vựng và video/landmark còn cần mở rộng để đáp ứng nhiều tình huống giao tiếp hơn.
- Text-to-sign hiện dựa trên ánh xạ từ/cụm từ và landmark có sẵn, chưa xử lý sâu ngữ pháp ngôn ngữ ký hiệu.
- Đồng bộ tiến độ đã có API nhưng trải nghiệm đa thiết bị cần tiếp tục hoàn thiện và kiểm thử.
- Cần quy trình chuẩn để đánh giá chất lượng nội dung trước khi published.

### 8.2 Định hướng tương lai

- Mở rộng bộ dữ liệu ký hiệu, bao gồm nhiều chủ đề, nhiều người ký, nhiều góc quay và nhiều điều kiện ánh sáng.
- Cải thiện mô hình recognition, tăng số lớp nhận diện, tối ưu tốc độ inference và bổ sung phản hồi chi tiết hơn cho từng lỗi động tác.
- Nâng cấp text-to-sign bằng xử lý ngôn ngữ tự nhiên, chuyển đổi câu sang cấu trúc phù hợp ngôn ngữ ký hiệu.
- Đồng bộ tiến độ học đa thiết bị, thêm achievement, leaderboard hoặc cộng đồng học tập nếu phù hợp.
- Phát triển phiên bản mobile hoặc PWA để thuận tiện luyện tập bằng camera.
- Hoàn thiện dashboard quản trị để hỗ trợ ra quyết định mở rộng nội dung dựa trên dữ liệu học thật.

## 9. Tổng kết

SmartSignLanguage là một hệ thống học và nhận diện ngôn ngữ ký hiệu có đầy đủ các khối nghiệp vụ chính: học theo bài, ôn tập, quiz, tra cứu, dịch văn bản sang ký hiệu, nhận diện ký hiệu bằng camera/video, theo dõi tiến độ và quản trị nội dung. Kiến trúc tách frontend, backend web và AI backend giúp dự án có khả năng mở rộng cả về chức năng học tập lẫn năng lực nhận diện trong tương lai.
