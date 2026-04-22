# 📚 Learning Module - Complete Documentation

## Overview

Learning Module là một hệ thống toàn diện cho phép người dùng học ngôn ngữ ký hiệu thông qua:
- **📖 Lessons**: Bài học với video, nội dung, từ vựng
- **📚 Vocabulary**: Danh sách từ vựng với hình ảnh, video, phát âm
- **✅ Quiz**: Bài kiểm tra trắc nghiệm để đánh giá kiến thức
- **📊 Progress**: Theo dõi tiến độ học và thống kê cá nhân

---

## Architecture

### Backend (FastAPI)

#### Database Models

```
Lesson
├── Vocabulary (1:N)
├── Quiz (1:1)
│   ├── QuizQuestion (1:N)
│   └── UserQuizResult (1:N)
├── UserProgress (1:N)
└── User (1:N)
```

#### Models (app/models/learning_model.py)

| Model | Description |
|-------|-------------|
| `Lesson` | Bài học chính |
| `Vocabulary` | Từ vựng trong bài học |
| `Quiz` | Bài kiểm tra |
| `QuizQuestion` | Câu hỏi trong quiz |
| `UserProgress` | Tiến độ của người dùng |
| `UserQuizResult` | Kết quả làm quiz |

#### API Endpoints

**Lessons**
```
GET    /api/learn/lessons              - Lấy tất cả bài học
GET    /api/learn/lessons/{lesson_id}  - Lấy chi tiết bài học
POST   /api/learn/lessons              - Tạo bài học (Admin)
PUT    /api/learn/lessons/{lesson_id}  - Cập nhật bài học (Admin)
DELETE /api/learn/lessons/{lesson_id}  - Xóa bài học (Admin)
```

**Vocabulary**
```
GET    /api/learn/lessons/{lesson_id}/vocabularies       - Lấy từ vựng theo bài
POST   /api/learn/vocabularies                           - Tạo từ vựng (Admin)
PUT    /api/learn/vocabularies/{vocab_id}                - Cập nhật từ vựng (Admin)
DELETE /api/learn/vocabularies/{vocab_id}                - Xóa từ vựng (Admin)
```

**Quiz**
```
GET    /api/learn/lessons/{lesson_id}/quiz              - Lấy quiz của bài học
GET    /api/learn/quizzes/{quiz_id}                     - Lấy chi tiết quiz
POST   /api/learn/quizzes                               - Tạo quiz (Admin)
PUT    /api/learn/quizzes/{quiz_id}                     - Cập nhật quiz (Admin)
DELETE /api/learn/quizzes/{quiz_id}                     - Xóa quiz (Admin)
```

**Quiz Questions**
```
GET    /api/learn/quizzes/{quiz_id}/questions           - Lấy câu hỏi
POST   /api/learn/questions                             - Tạo câu hỏi (Admin)
PUT    /api/learn/questions/{question_id}               - Cập nhật câu hỏi (Admin)
```

**User Progress**
```
GET    /api/learn/users/{user_id}/progress              - Lấy tiến độ của người dùng
GET    /api/learn/users/{user_id}/progress/summary      - Lấy tóm tắt tiến độ
POST   /api/learn/progress                              - Tạo/cập nhật tiến độ
PUT    /api/learn/users/{user_id}/lessons/{lesson_id}/progress - Cập nhật tiến độ
```

**Quiz Submission**
```
POST   /api/learn/quiz/submit                           - Submit bài quiz
GET    /api/learn/users/{user_id}/quiz/{quiz_id}/results       - Lấy kết quả quiz
GET    /api/learn/users/{user_id}/quiz/{quiz_id}/latest-result - Lấy kết quả mới nhất
```

---

### Frontend (React)

#### Components Structure

```
LearningDashboard (Main)
├── LessonList
│   ├── Filter by level
│   └── Lesson cards
├── LessonDetail
│   ├── Video player
│   └── Tab navigation
│       ├── Content (video + text)
│       ├── VocabularyView
│       │   ├── Vocabulary list
│       │   └── Vocabulary detail
│       └── QuizView
│           ├── Start screen
│           ├── Question display
│           ├── Answer options
│           └── Result screen
└── ProgressView
    ├── Summary cards
    ├── Progress bar
    └── Lesson progress list
```

#### File Structure

```
frontend/src/components/
├── LearningDashboard.jsx        - Main component
├── LessonList.jsx               - Danh sách bài học
├── LessonDetail.jsx             - Chi tiết bài học
├── VocabularyView.jsx           - Xem từ vựng
├── QuizView.jsx                 - Làm bài quiz
├── ProgressView.jsx             - Xem tiến độ
├── LearningDashboard.css
├── LessonList.css
├── LessonDetail.css
├── VocabularyView.css
├── QuizView.css
└── ProgressView.css

frontend/src/services/
└── api.js                       - API client (learnService)
```

---

## Data Flows

### 1️⃣ Learning Flow

```
User → LessonList → Select Lesson → LessonDetail
                                    ├── Watch Video
                                    ├── Read Content
                                    ├── Review Vocabulary
                                    └── Take Quiz
```

### 2️⃣ Quiz Flow

```
User → Quiz Screen → Answer Questions → Submit
                                       → Calculate Score
                                       → Save Result
                                       → Show Result
```

### 3️⃣ Progress Tracking Flow

```
User → ProgressView → Display Summary
                    → Show Lesson Progress
                    → Calculate Stats
```

---

## Usage Guide

### For Students

#### Taking a Lesson

1. Open **LessonList**
2. Filter by level (Beginner, Intermediate, Advanced)
3. Click **"Learn Now"** on desired lesson
4. In **LessonDetail**:
   - Watch the video
   - Read the content
   - Review vocabulary
   - Take the quiz

#### Vocabulary Learning

1. Go to **Vocabulary tab** in LessonDetail
2. Browse vocabulary list
3. Click on each word to view:
   - Definition
   - Pronunciation
   - Image/Video
   - Example sentences

#### Taking Quiz

1. Go to **Quiz tab** in LessonDetail
2. Click **"Start Quiz"**
3. Answer all questions:
   - Multiple choice
   - True/False
   - Short answer
4. Submit quiz
5. View score and results

#### Tracking Progress

1. Click **"My Progress"** in header
2. View:
   - Completed lessons
   - Average quiz score
   - Total study time
   - Current level
3. See detailed progress per lesson

### For Admins

#### Creating a Lesson

```bash
POST /api/learn/lessons
{
  "title": "Lesson Title",
  "description": "Description",
  "video_url": "https://example.com/video.mp4",
  "thumbnail_url": "https://example.com/thumb.jpg",
  "content": "Lesson content",
  "level": "beginner",
  "order": 1,
  "is_active": true
}
```

#### Adding Vocabulary

```bash
POST /api/learn/vocabularies
{
  "lesson_id": "uuid",
  "word": "Hello",
  "description": "A greeting",
  "image_url": "https://example.com/hello.jpg",
  "video_url": "https://example.com/hello.mp4",
  "pronunciation": "hə-ˈlō",
  "order": 1
}
```

#### Creating Quiz

```bash
POST /api/learn/quizzes
{
  "lesson_id": "uuid",
  "title": "Quiz Title",
  "description": "Quiz description",
  "passing_score": 70,
  "time_limit": 300
}
```

#### Adding Quiz Questions

```bash
POST /api/learn/questions
{
  "quiz_id": "uuid",
  "question_text": "What does this gesture mean?",
  "question_type": "multiple_choice",
  "option_a": "Hello",
  "option_b": "Goodbye",
  "option_c": "Thank you",
  "option_d": "Sorry",
  "correct_answer": "A",
  "order": 1
}
```

---

## API Request Examples

### Get All Lessons with Filter

```javascript
// Get beginner lessons
const response = await learnService.getLessons('beginner')

// Get all lessons
const response = await learnService.getLessons()
```

### Get Lesson Detail with Vocabulary and Quiz

```javascript
const response = await learnService.getLesson(lessonId)

// Response includes:
// - lesson data
// - vocabularies array
// - quiz array with questions
```

### Submit Quiz

```javascript
const response = await learnService.submitQuiz(userId, {
  quiz_id: quizId,
  answers: {
    'question_id_1': 'A',
    'question_id_2': 'B',
    'question_id_3': 'true'
  },
  time_taken: 180  // seconds
})

// Response includes:
// - score (0-100)
// - correct_answers count
// - is_passed boolean
// - timestamp
```

### Get Learning Summary

```javascript
const response = await learnService.getProgressSummary(userId)

// Response includes:
// - total_lessons
// - completed_lessons
// - total_quiz_attempts
// - average_quiz_score
// - total_time_spent
// - current_level
```

---

## Features

### ✅ Features Implemented

- [x] Lesson management (CRUD)
- [x] Vocabulary management with images/videos
- [x] Quiz system with multiple question types
- [x] User progress tracking
- [x] Quiz result calculation
- [x] Learning summary statistics
- [x] Responsive UI components
- [x] Level-based filtering
- [x] Time-based progress tracking

### 🎯 Future Enhancements

- [ ] AI-based gesture recognition in quiz
- [ ] Gamification (badges, points, leaderboard)
- [ ] Social learning (share achievements)
- [ ] Mobile app version
- [ ] Offline mode
- [ ] Audio pronunciation guide
- [ ] Interactive exercises
- [ ] Live instructor sessions

---

## Integration Steps

### 1. Backend Setup

1. Update `app/models/__init__.py` to import learning models ✅
2. Create migration files for new tables
3. Run migrations: `alembic upgrade head`

### 2. Frontend Setup

1. Import components in your page:

```javascript
import LearningDashboard from '@/components/LearningDashboard'

// In your page component
<LearningDashboard userId={currentUserId} />
```

2. Or use individual components:

```javascript
import LessonList from '@/components/LessonList'
import ProgressView from '@/components/ProgressView'
```

### 3. Seed Data

```bash
# Create sample lessons
curl -X POST http://localhost:8000/api/learn/lessons \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to Sign Language",
    "description": "Learn basic signs",
    "level": "beginner",
    "order": 1
  }'
```

---

## Environment Variables

Add to `.env`:

```
# Learning Module
LEARNING_ENABLED=true
MAX_QUIZ_TIME=3600
DEFAULT_PASSING_SCORE=70
```

---

## Testing

### Test Endpoints

```bash
# Get all lessons
curl http://localhost:8000/api/learn/lessons

# Get specific lesson
curl http://localhost:8000/api/learn/lessons/{lesson_id}

# Get quiz
curl http://localhost:8000/api/learn/lessons/{lesson_id}/quiz

# Submit quiz
curl -X POST http://localhost:8000/api/learn/quiz/submit \
  -H "Content-Type: application/json" \
  -d '{
    "quiz_id": "uuid",
    "answers": {"question_id": "A"},
    "time_taken": 180
  }'
```

---

## Performance Considerations

- Use pagination for large lesson lists
- Cache vocabulary and quiz data
- Optimize video streaming
- Lazy load components
- Use React.memo for expensive components

---

## Security

- Validate all user inputs
- Check authorization for admin endpoints
- Use JWT for authentication
- Rate limit quiz submissions
- Prevent quiz answer spoofing

---

## Troubleshooting

### Quiz doesn't submit
- Check user_id is provided
- Verify quiz_id exists
- Check answers format

### Progress not updating
- Ensure UserProgress record exists
- Check user authentication
- Verify lesson_id is valid

### Videos not playing
- Check video URL is accessible
- Verify CORS headers
- Check file format support

---

## Support & Documentation

For more information:
- API Docs: http://localhost:8000/docs
- Postman Collection: [learning_module.postman_collection.json]
- Issues: GitHub Issues

