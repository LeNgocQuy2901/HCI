# ⚙️ Admin Panel - Complete Documentation

## Overview

Admin Panel là một giao diện quản lý toàn diện cho hệ thống SmartSign, cho phép quản trị viên:
- 📖 Quản lý bài học (tạo, sửa, xóa, xuất bản)
- ✅ Quản lý bài kiểm tra và câu hỏi
- 📚 Quản lý từ vựng
- 📊 Xem thống kê và phân tích
- 📈 Theo dõi hiệu suất học tập

---

## Architecture

### Backend - Admin Routes (`app/routes/admin_learning.py`)

#### Endpoints

**Dashboard**
```
GET /api/admin/dashboard/stats
  - Lấy thống kê tổng quát
  - Response: {
      total_lessons,
      total_quiz,
      total_questions,
      total_vocabularies,
      total_users_learning,
      average_quiz_score,
      recent_activities
    }
```

**Lesson Management**
```
GET    /api/admin/lessons              - Lấy tất cả bài học (có filter)
POST   /api/admin/lessons              - Tạo bài học mới
PUT    /api/admin/lessons/{lesson_id}  - Cập nhật bài học
DELETE /api/admin/lessons/{lesson_id}  - Xóa bài học
POST   /api/admin/lessons/{id}/publish     - Xuất bản bài học
POST   /api/admin/lessons/{id}/unpublish   - Hủy xuất bản
POST   /api/admin/lessons/bulk-publish     - Xuất bản nhiều bài học
POST   /api/admin/lessons/bulk-delete      - Xóa nhiều bài học
```

**Vocabulary Management**
```
GET    /api/admin/lessons/{lesson_id}/vocabularies  - Lấy từ vựng
POST   /api/admin/vocabularies                      - Tạo từ vựng
PUT    /api/admin/vocabularies/{vocab_id}           - Cập nhật từ vựng
DELETE /api/admin/vocabularies/{vocab_id}           - Xóa từ vựng
```

**Quiz Management**
```
GET    /api/admin/quizzes              - Lấy tất cả quiz
POST   /api/admin/quizzes              - Tạo quiz mới
PUT    /api/admin/quizzes/{quiz_id}    - Cập nhật quiz
DELETE /api/admin/quizzes/{quiz_id}    - Xóa quiz
```

**Question Management**
```
GET    /api/admin/quizzes/{quiz_id}/questions  - Lấy câu hỏi
POST   /api/admin/questions                    - Tạo câu hỏi
PUT    /api/admin/questions/{question_id}     - Cập nhật câu hỏi
DELETE /api/admin/questions/{question_id}     - Xóa câu hỏi
```

**Analytics**
```
GET /api/admin/analytics/lesson/{lesson_id}  - Phân tích bài học
GET /api/admin/analytics/quiz/{quiz_id}      - Phân tích quiz
```

**Export**
```
GET /api/admin/export/lessons  - Xuất dữ liệu bài học
```

---

### Frontend - Admin Components

#### Component Structure

```
AdminDashboard (Main)
├── AdminDashboardStats
│   ├── Dashboard statistics
│   └── Recent activities
├── AdminLessonManager
│   ├── Lesson form
│   ├── Lesson filters
│   └── Lesson table
├── AdminQuizManager
│   ├── Quiz form
│   ├── Quiz list
│   ├── Question form
│   └── Question list
└── (Future)
    ├── AdminVocabularyManager
    └── AdminAnalytics
```

#### File Structure

```
frontend/src/components/
├── AdminDashboard.jsx                 - Main admin component
├── AdminDashboardStats.jsx            - Dashboard statistics
├── AdminLessonManager.jsx             - Lesson management
├── AdminQuizManager.jsx               - Quiz & question management
├── AdminDashboard.css
├── AdminDashboardStats.css
├── AdminLessonManager.css
└── AdminQuizManager.css

frontend/src/services/
└── api.js                             - adminService methods
```

---

## Usage Guide

### For Admins

#### Accessing Admin Panel

```javascript
import AdminDashboard from '@/components/AdminDashboard'

function AdminPage() {
  return <AdminDashboard />
}
```

#### 1️⃣ Dashboard

**View System Statistics**
- Total lessons, quizzes, vocabulary items
- Number of users actively learning
- Average quiz scores
- Recent activities

**Refresh Statistics**
- Click "🔄 Refresh Stats" button

#### 2️⃣ Lesson Management

**Create Lesson**
1. Click "+ New Lesson" button
2. Fill in form:
   - Title (required)
   - Description
   - Video URL
   - Thumbnail URL
   - Content (lesson text)
   - Level (Beginner/Intermediate/Advanced)
   - Order (display order)
   - Active checkbox (publish)
3. Click "Create Lesson"

**Edit Lesson**
1. Click edit button (✎) on lesson row
2. Form will populate with lesson data
3. Update fields as needed
4. Click "Update Lesson"

**Publish/Unpublish Lesson**
- Click up arrow (↑) to publish
- Click down arrow (↓) to unpublish
- Unpublished lessons are hidden from users

**Delete Lesson**
1. Click delete button (🗑)
2. Confirm deletion
3. Lesson and related data will be deleted

**Filter Lessons**
- All: Show all lessons
- Active: Show only published lessons
- Inactive: Show only unpublished lessons

#### 3️⃣ Quiz Management

**Create Quiz**
1. Click "+ New Quiz" button
2. Fill in form:
   - Select Lesson (required)
   - Quiz Title (required)
   - Description
   - Passing Score (default 70%)
   - Time Limit (in seconds)
   - Active checkbox
3. Click "Create Quiz"

**Add Questions**
1. Select quiz from list
2. Click "+ Add Question"
3. Fill question form:
   - Question Text (required)
   - Question Type (Multiple Choice/True-False)
   - Options (A, B, C, D for multiple choice)
   - Correct Answer
4. Click "Add Question"

**Edit/Delete Questions**
- Questions appear in list below form
- Delete buttons next to each question

**View Quiz Analytics**
- Automatically shown when quiz selected
- Shows:
  - Total attempts
  - Pass rate
  - Average score
  - Average time taken

---

## API Request Examples

### Create Lesson

```javascript
const response = await adminService.createLessonAdmin({
  title: "Introduction to Sign Language",
  description: "Learn basic signs",
  video_url: "https://example.com/video.mp4",
  thumbnail_url: "https://example.com/thumb.jpg",
  content: "Lesson content here...",
  level: "beginner",
  order: 1,
  is_active: true
})
```

### Create Quiz

```javascript
const response = await adminService.createQuizAdmin({
  lesson_id: "uuid",
  title: "Beginner Quiz",
  description: "Test your knowledge",
  passing_score: 70,
  time_limit: 600,
  is_active: true
})
```

### Add Question

```javascript
const response = await adminService.createQuestionAdmin({
  quiz_id: "uuid",
  question_text: "What does this gesture mean?",
  question_type: "multiple_choice",
  option_a: "Hello",
  option_b: "Goodbye",
  option_c: "Thank you",
  option_d: "Sorry",
  correct_answer: "A",
  order: 1
})
```

### Get Lesson Analytics

```javascript
const response = await adminService.getLessonAnalytics(lessonId)

// Response:
{
  lesson_id: "uuid",
  users_accessed: 150,
  users_completed: 120,
  completion_rate: 80.0,
  average_quiz_score: 78.5
}
```

### Bulk Operations

```javascript
// Publish multiple lessons
await adminService.bulkPublishLessons([id1, id2, id3])

// Delete multiple lessons
await adminService.bulkDeleteLessons([id1, id2, id3])
```

### Export Data

```javascript
const response = await adminService.exportLessons()

// Response:
{
  total: 10,
  data: [...],
  exported_at: "2024-04-22T12:00:00"
}
```

---

## Form Validation

### Lesson Form

| Field | Required | Type | Min | Max |
|-------|----------|------|-----|-----|
| Title | Yes | String | 1 | 200 |
| Level | No | Enum | - | - |
| Order | No | Integer | 0 | ∞ |
| Video URL | No | URL | - | 500 |
| Thumbnail URL | No | URL | - | 500 |
| Content | No | Text | - | - |

### Quiz Form

| Field | Required | Type | Min | Max |
|-------|----------|------|-----|-----|
| Lesson | Yes | UUID | - | - |
| Title | Yes | String | 1 | 200 |
| Passing Score | No | Integer | 0 | 100 |
| Time Limit | No | Integer | 60 | ∞ |

### Question Form

| Field | Required | Type |
|-------|----------|------|
| Question Text | Yes | String |
| Question Type | No | Enum |
| Options (A-D) | Yes* | String |
| Correct Answer | Yes | Enum |

*Required for multiple choice questions

---

## Features

### ✅ Implemented Features

- [x] Dashboard with statistics
- [x] Full lesson CRUD operations
- [x] Lesson publish/unpublish
- [x] Quiz creation and management
- [x] Quiz question management
- [x] Multiple question types (MC, T/F)
- [x] Activity filters
- [x] Bulk operations (publish, delete)
- [x] Analytics per lesson/quiz
- [x] Export functionality
- [x] Responsive design

### 🎯 Future Features

- [ ] Vocabulary management UI
- [ ] Advanced analytics dashboard
- [ ] User management
- [ ] Activity logging
- [ ] Audit trail
- [ ] Import lessons from CSV
- [ ] Backup/restore
- [ ] Role-based access control
- [ ] Scheduled publishing
- [ ] A/B testing

---

## Security Considerations

### Authentication & Authorization

```javascript
// All admin endpoints should be protected
// Add middleware check:
@router.get("/admin/...")
async def admin_endpoint(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
```

### Input Validation

- All inputs are validated using Pydantic schemas
- File uploads should be scanned for malware
- URLs should be validated before storage
- Rate limiting on bulk operations

### Audit Trail

Consider implementing:
- Who made changes
- When changes were made
- What was changed
- Rollback capability

---

## Performance Optimization

### Database Queries

- Use pagination for large datasets
- Lazy load relationships
- Cache frequently accessed data

### Frontend Optimization

- Memoize expensive components
- Virtual scrolling for long lists
- Debounce filter operations

### Caching Strategy

```python
# Cache dashboard stats for 5 minutes
from functools import lru_cache
from datetime import timedelta

@lru_cache(maxsize=1)
def get_dashboard_stats():
    # Cached for performance
    pass
```

---

## Integration Steps

### 1. Backend Setup

1. Ensure `admin_learning.py` is in `app/routes/`
2. Update `main.py` to include admin router:

```python
from app.routes import admin_learning
app.include_router(admin_learning.router, prefix="/api", tags=["admin"])
```

3. Run migrations for new models
4. No new models required (uses existing ones)

### 2. Frontend Setup

1. Place admin components in `frontend/src/components/`
2. Import in your app:

```javascript
import AdminDashboard from '@/components/AdminDashboard'

// Use in route or page
<AdminDashboard />
```

3. Ensure API service is updated with `adminService`

### 3. Access Control

Add role checking in your auth system:

```javascript
function AdminRoute() {
  const user = useAuth()
  
  if (!user?.is_admin) {
    return <Redirect to="/unauthorized" />
  }
  
  return <AdminDashboard />
}
```

---

## Troubleshooting

### Quiz not showing questions
- Ensure questions are created after quiz
- Check quiz_id is correct
- Verify questions have valid correct_answer

### Lessons not appearing in list
- Check is_active flag
- Try refreshing the page
- Clear browser cache

### Form validation errors
- Check all required fields are filled
- Verify data types match schema
- Check URL formats

### API errors
- Check API is running (localhost:8000)
- Verify CORS is configured
- Check browser console for errors

---

## API Documentation

Full API documentation available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Testing Endpoints

Use Postman or curl:

```bash
# Get all lessons
curl http://localhost:8000/api/admin/lessons \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create lesson
curl -X POST http://localhost:8000/api/admin/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Lesson",
    "level": "beginner"
  }'
```

---

## Best Practices

### Before Publishing Lessons

- [ ] Fill all required fields
- [ ] Add preview image/thumbnail
- [ ] Upload or link video
- [ ] Add comprehensive description
- [ ] Review lesson content
- [ ] Test all multimedia

### Before Publishing Quiz

- [ ] Add all questions
- [ ] Review correct answers
- [ ] Set appropriate time limit
- [ ] Set passing score (typically 70%)
- [ ] Test quiz flow
- [ ] Verify question order

### Maintenance

- Regularly backup data
- Monitor user progress
- Update outdated content
- Remove irrelevant quizzes
- Archive old lessons

---

## Support

For issues or feature requests:
- Check API documentation: /docs
- Review error messages carefully
- Check browser console
- Verify API connection
- Contact development team

