# 🛠️ API Complete Documentation

**Sign Language App - Full API Reference**

---

## 📍 Base URL

```
http://localhost:8000/api
```

## 🔑 Authentication

Tất cả endpoints (ngoại trừ `/auth/register` và `/auth/login`) cần JWT token:

```http
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

---

## 🔐 Auth Endpoints

### 1️⃣ Register (Đăng ký tài khoản)

**Endpoint:** `POST /auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "Nguyen Van A",
  "phone": "0123456789",
  "date_of_birth": "1990-01-01"
}
```

**Response (200 OK):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "full_name": "Nguyen Van A",
  "created_at": "2026-03-31T10:00:00Z",
  "status": "active"
}
```

**Error Response (400):**
```json
{
  "detail": "Email already registered"
}
```

---

### 2️⃣ Login (Đăng nhập)

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "Nguyen Van A"
  }
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

---

### 3️⃣ Logout (Đăng xuất)

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

### 4️⃣ Refresh Token

**Endpoint:** `POST /auth/refresh`

**Headers:**
```
Authorization: Bearer YOUR_REFRESH_TOKEN
```

**Response (200 OK):**
```json
{
  "access_token": "new_access_token_here",
  "token_type": "bearer",
  "expires_in": 3600
}
```

---

## 🎥 Gesture Recognition Endpoints

### 1️⃣ Recognize Gesture (Nhận diện ký hiệu từ ảnh)

**Endpoint:** `POST /gesture/recognize`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data
```

**Request (Form Data):**
```
image: [binary image file]
```

**Response (200 OK):**
```json
{
  "gesture_id": 0,
  "gesture_label": "A",
  "confidence": 0.95,
  "timestamp": "2026-03-31T10:05:30Z",
  "landmarks": [
    {"x": 0.5, "y": 0.4, "z": -0.1},
    {"x": 0.51, "y": 0.41, "z": -0.09},
    ...
  ]
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/gesture/recognize" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/hand_image.jpg"
```

---

### 2️⃣ Get Recognition History (Xem lịch sử)

**Endpoint:** `GET /gesture/history`

**Parameters:**
```
?limit=10&offset=0&date_from=2026-03-01&date_to=2026-03-31
```

**Response (200 OK):**
```json
{
  "total": 25,
  "items": [
    {
      "recognition_id": "uuid-here",
      "gesture_label": "A",
      "confidence": 0.95,
      "timestamp": "2026-03-31T10:05:30Z"
    },
    ...
  ]
}
```

---

### 3️⃣ Delete Recognition History (Xóa lịch sử)

**Endpoint:** `DELETE /gesture/history/{recognition_id}`

**Response (200 OK):**
```json
{
  "message": "History deleted successfully"
}
```

---

### 4️⃣ Real-time Gesture Stream (WebSocket)

**WebSocket URL:**
```
ws://localhost:8000/ws/gesture/stream?token=YOUR_TOKEN
```

**Message Format (Incoming):**
```json
{
  "type": "gesture_detected",
  "gesture": "A",
  "confidence": 0.92,
  "timestamp": "2026-03-31T10:05:30Z"
}
```

**JavaScript Example:**
```javascript
const ws = new WebSocket(
  'ws://localhost:8000/ws/gesture/stream?token=' + token
);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Gesture detected:', data.gesture);
};
```

---

## 💬 Chat Endpoints

### 1️⃣ Send Message (Gửi tin nhắn)

**Endpoint:** `POST /chat/messages`

**Request:**
```json
{
  "room_id": "room-uuid-here",
  "content": "Xin chào!",
  "message_type": "text"
}
```

**Response (201 Created):**
```json
{
  "message_id": "msg-uuid-here",
  "room_id": "room-uuid-here",
  "sender_id": "user-uuid-here",
  "content": "Xin chào!",
  "message_type": "text",
  "created_at": "2026-03-31T10:05:30Z",
  "edited_at": null
}
```

---

### 2️⃣ Get Messages (Lấy tin nhắn)

**Endpoint:** `GET /chat/messages/{room_id}`

**Parameters:**
```
?limit=50&offset=0
```

**Response (200 OK):**
```json
{
  "room_id": "room-uuid-here",
  "total": 100,
  "messages": [
    {
      "message_id": "msg-uuid",
      "sender_id": "user-uuid",
      "sender_name": "Nguyen Van A",
      "content": "Xin chào!",
      "message_type": "text",
      "created_at": "2026-03-31T10:05:30Z"
    },
    ...
  ]
}
```

---

### 3️⃣ Create Chat Room (Tạo phòng chat)

**Endpoint:** `POST /chat/rooms`

**Request:**
```json
{
  "name": "Nhóm học ký hiệu",
  "participants": [
    "user-id-1",
    "user-id-2"
  ],
  "is_group": true
}
```

**Response (201 Created):**
```json
{
  "room_id": "room-uuid-here",
  "name": "Nhóm học ký hiệu",
  "created_by": "user-uuid-here",
  "created_at": "2026-03-31T10:05:30Z",
  "is_group": true,
  "participants_count": 2
}
```

---

### 4️⃣ List Chat Rooms (Danh sách phòng)

**Endpoint:** `GET /chat/rooms`

**Response (200 OK):**
```json
{
  "total": 5,
  "rooms": [
    {
      "room_id": "room-uuid",
      "name": "Nhóm học",
      "last_message": "Xin chào!",
      "last_message_at": "2026-03-31T10:05:30Z",
      "unread_count": 2
    },
    ...
  ]
}
```

---

### 5️⃣ Real-time Chat (WebSocket)

**WebSocket URL:**
```
ws://localhost:8000/ws/chat/{room_id}?token=YOUR_TOKEN
```

**Send Message:**
```json
{
  "type": "message",
  "content": "Hello!",
  "message_type": "text"
}
```

**Receive Message:**
```json
{
  "type": "message",
  "message_id": "msg-uuid",
  "sender_id": "user-uuid",
  "sender_name": "Nguyen Van A",
  "content": "Hello!",
  "timestamp": "2026-03-31T10:05:30Z"
}
```

---

## 📚 Learning Endpoints

### 1️⃣ Get Lessons (Danh sách bài học)

**Endpoint:** `GET /learn/lessons`

**Parameters:**
```
?category=beginner&limit=20&offset=0
```

**Response (200 OK):**
```json
{
  "total": 50,
  "lessons": [
    {
      "lesson_id": "lesson-uuid",
      "title": "Giới thiệu ngôn ngữ ký hiệu",
      "description": "Học cơ bản về ký hiệu",
      "category": "beginner",
      "duration_minutes": 15,
      "video_url": "https://...",
      "difficulty": "easy",
      "completed": false,
      "progress": 0
    },
    ...
  ]
}
```

---

### 2️⃣ Get Lesson Details (Chi tiết bài học)

**Endpoint:** `GET /learn/lessons/{lesson_id}`

**Response (200 OK):**
```json
{
  "lesson_id": "lesson-uuid",
  "title": "Giới thiệu ngôn ngữ ký hiệu",
  "description": "...",
  "video_url": "https://...",
  "content": "HTML content here",
  "gestures": [
    {
      "gesture_id": "gest-uuid",
      "label": "A",
      "video_url": "https://..."
    },
    ...
  ],
  "quiz_id": "quiz-uuid",
  "completed": false
}
```

---

### 3️⃣ Complete Lesson (Hoàn thành bài học)

**Endpoint:** `POST /learn/lessons/{lesson_id}/complete`

**Request:**
```json
{
  "score": 85,
  "time_spent_minutes": 12
}
```

**Response (200 OK):**
```json
{
  "lesson_id": "lesson-uuid",
  "completed": true,
  "score": 85,
  "certificate_url": "https://..."
}
```

---

### 4️⃣ Get Vocabulary (Danh sách từ vựng)

**Endpoint:** `GET /learn/vocabulary`

**Parameters:**
```
?level=A1&limit=30&search=hello
```

**Response (200 OK):**
```json
{
  "total": 150,
  "vocabulary": [
    {
      "word_id": "word-uuid",
      "word": "Xin chào",
      "gesture_label": "A",
      "gesture_video": "https://...",
      "audio_url": "https://...",
      "example": "Xin chào bạn",
      "level": "A1",
      "bookmarked": false
    },
    ...
  ]
}
```

---

### 5️⃣ Take Quiz (Làm bài kiểm tra)

**Endpoint:** `POST /learn/quiz/{quiz_id}/start`

**Response (200 OK):**
```json
{
  "quiz_id": "quiz-uuid",
  "title": "Quiz: Gestures A-Z",
  "total_questions": 10,
  "time_limit_seconds": 600,
  "questions": [
    {
      "question_id": "q-uuid",
      "type": "multiple_choice",
      "text": "Gesture này là gì?",
      "image_url": "https://...",
      "options": ["A", "B", "C", "D"],
      "order": 1
    },
    ...
  ]
}
```

**Submit Answers:**

**Endpoint:** `POST /learn/quiz/{quiz_id}/submit`

**Request:**
```json
{
  "answers": [
    {"question_id": "q-uuid", "answer": "A"},
    {"question_id": "q-uuid-2", "answer": "B"},
    ...
  ]
}
```

**Response (200 OK):**
```json
{
  "quiz_id": "quiz-uuid",
  "score": 90,
  "total_questions": 10,
  "correct_answers": 9,
  "percentage": 90,
  "results": [
    {
      "question_id": "q-uuid",
      "your_answer": "A",
      "correct_answer": "A",
      "is_correct": true
    },
    ...
  ]
}
```

---

## 👤 Profile Endpoints

### 1️⃣ Get Current User (Thông tin cá nhân)

**Endpoint:** `GET /profile/me`

**Response (200 OK):**
```json
{
  "user_id": "user-uuid",
  "email": "user@example.com",
  "full_name": "Nguyen Van A",
  "phone": "0123456789",
  "date_of_birth": "1990-01-01",
  "profile_picture_url": "https://...",
  "bio": "Learning sign language",
  "created_at": "2026-03-31T10:00:00Z"
}
```

---

### 2️⃣ Update Profile (Cập nhật thông tin)

**Endpoint:** `PUT /profile/me`

**Request:**
```json
{
  "full_name": "Nguyen Van A",
  "phone": "0123456789",
  "bio": "Learning sign language",
  "profile_picture_url": "https://..."
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

---

### 3️⃣ Get Statistics (Thống kê)

**Endpoint:** `GET /profile/statistics`

**Response (200 OK):**
```json
{
  "total_gestures_learned": 150,
  "total_lessons_completed": 12,
  "total_quiz_score": 85,
  "current_streak": 7,
  "badges": ["Beginner", "Week Warrior"],
  "learning_hours": 42.5,
  "last_activity": "2026-03-31T10:05:30Z"
}
```

---

### 4️⃣ Bookmark Vocabulary (Lưu từ)

**Endpoint:** `POST /profile/bookmarks`

**Request:**
```json
{
  "word_id": "word-uuid"
}
```

**Response (201 Created):**
```json
{
  "bookmark_id": "bookmark-uuid",
  "word_id": "word-uuid",
  "created_at": "2026-03-31T10:05:30Z"
}
```

---

### 5️⃣ Get Bookmarks (Xem bookmark)

**Endpoint:** `GET /profile/bookmarks`

**Response (200 OK):**
```json
{
  "total": 15,
  "bookmarks": [
    {
      "word_id": "word-uuid",
      "word": "Xin chào",
      "gesture_label": "A",
      "bookmarked_at": "2026-03-31T10:05:30Z"
    },
    ...
  ]
}
```

---

## 📝 Translation Endpoints

### 1️⃣ Text to Gesture (Dịch văn bản → ký hiệu)

**Endpoint:** `POST /translate/text-to-gesture`

**Request:**
```json
{
  "text": "Xin chào bạn",
  "language": "vi"
}
```

**Response (200 OK):**
```json
{
  "text": "Xin chào bạn",
  "gestures": [
    {
      "word": "Xin chào",
      "gesture_label": "A",
      "gesture_video": "https://...",
      "confidence": 0.95
    },
    {
      "word": "bạn",
      "gesture_label": "B",
      "gesture_video": "https://...",
      "confidence": 0.92
    }
  ],
  "animation_url": "https://..."
}
```

---

### 2️⃣ Gesture to Text (Dịch ký hiệu → văn bản)

**Endpoint:** `POST /translate/gesture-to-text`

**Request:**
```json
{
  "gestures": ["A", "B", "C"],
  "language": "vi"
}
```

**Response (200 OK):**
```json
{
  "gestures": ["A", "B", "C"],
  "text": "Xin chào bạn",
  "confidence": 0.89
}
```

---

## 🔄 Status Codes

| Code | Meaning |
|------|---------|
| **200** | OK - Request successful |
| **201** | Created - Resource created |
| **400** | Bad Request - Invalid data |
| **401** | Unauthorized - No valid token |
| **403** | Forbidden - Access denied |
| **404** | Not Found - Resource not found |
| **429** | Too Many Requests - Rate limited |
| **500** | Server Error - Internal error |

---

## ⚠️ Error Response Format

Tất cả errors trả về dạng này:

```json
{
  "error": "error_code",
  "message": "Human readable message",
  "details": {
    "field": "error description"
  }
}
```

**Example:**
```json
{
  "error": "INVALID_EMAIL",
  "message": "Email is not valid",
  "details": {
    "email": "Must be a valid email address"
  }
}
```

---

## 🧪 Testing APIs

### Postman Collection Import

1. Mở Postman
2. Click "File" > "Import"
3. Paste URL hoặc select file
4. Collections sẽ import tất cả endpoints

### cURL Commands

```bash
# Get all lessons
curl -X GET "http://localhost:8000/api/learn/lessons" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send message
curl -X POST "http://localhost:8000/api/chat/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"room_id": "uuid", "content": "Hello"}'
```

---

**For more details, visit http://localhost:8000/docs when running the app**
