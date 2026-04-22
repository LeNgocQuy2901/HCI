# Learn Page - Complete Feature Documentation

## Overview

The Learn page provides a comprehensive interactive vocabulary learning system with spaced repetition, quizzes, and progress tracking for sign language education.

## 🎯 5 Main Features

### 1. 📚 Interactive Vocabulary Cards with Video Demonstrations

**Component**: `VocabularyCardFlip.tsx`

Features:
- **Flip Animation**: Click card to flip between word and sign demonstration
- **Front Side**: Shows the word, category, difficulty, and example
- **Back Side**: Video player placeholder + detailed description of the sign
- **Action Buttons**:
  - ✅ "Got it!" - Mark as remembered
  - ❌ "Review Again" - Mark for later review
  - 🔄 Rotate button - Manual flip

**Usage Flow**:
1. User sees word on front
2. Clicks to view sign video & description
3. Marks as understood or for review
4. System tracks progress automatically

### 2. 🗂️ Organized Vocabulary by Category and Difficulty

**Organization Structure**:

**Categories**:
- Greetings (9 cards)
- Numbers (3 cards)
- Emotions (2 cards)
- Daily Life (2 cards)
- Actions (1 card)
- Family (0 - expandable)
- Health (0 - expandable)

**Difficulty Levels**:
- Beginner
- Intermediate
- Advanced

**Selection UI**:
- Dropdown selectors in Learn tab
- Automatic filtering
- Real-time card display update

### 3. 📊 Progress Tracking and Achievement Badges

**Components**: `ProgressTracker.tsx`

**Tracked Metrics**:
- Total words learned
- Mastered words count
- Current learning streak (🔥)
- Longest streak record
- Today's reviews count
- Progress percentage

**Display Modes**:
- **Compact**: 4-card grid (quick overview)
- **Full**: Detailed cards with icons & descriptions

**Stats Shown**:
- Overall mastery percentage (progress bar)
- Individual metric cards
- Streak information
- Daily activity tracking

### 4. 🧠 Spaced Repetition Learning System (SRS)

**Algorithm**: SM-2 (SuperMemo 2)

**How It Works**:

1. **New Card**: User learns a new word
2. **Review Scheduling**: System calculates next review based on:
   - User's quality rating (0-5)
   - Difficulty factor
   - Ease factor (starts at 2.5)

3. **Quality Ratings**:
   - 0-2: Failed → Review in 1 day
   - 3: Difficult → Review in 1-3 days
   - 4-5: Mastered → Review in 3-30+ days

4. **Intervals Grow**:
   - 1st review: 1 day
   - 2nd review: 3 days
   - 3rd review: 7 days
   - 4th review: 14+ days

5. **Mastery Status**:
   - "new" → "learning" → "mastered"

**Storage**:
- localStorage (persisted across sessions)
- Map data structure for O(1) lookup
- JSON serialization for storage

### 5. 🎯 Quizzes to Test Your Knowledge

**Component**: `QuizComponent.tsx`

**Quiz Types**:
1. **Video-to-Text**: Watch video → Select meaning
2. **Text-to-Video**: Read word → Identify correct sign
3. **Multiple-Choice**: General knowledge questions

**Quiz Flow**:
1. Select 10 cards from current category
2. Generate 10 questions (mix of types)
3. User answers each question
4. Real-time feedback:
   - ✅ Correct answer highlighted in green
   - ❌ Wrong answer in red with explanation
5. Final score display

**Features**:
- Progress bar
- Question counter
- Difficulty badge per question
- Automatic answer validation
- Score calculation & display

## 🏗️ Architecture

### Data Flow

```
User clicks Learn tab
    ↓
Learn.tsx loads user's progress
    ↓
useLearningStore() fetches SRS data
    ↓
Cards filtered by category/difficulty
    ↓
Display VocabularyCardFlip
    ↓
User marks correct/wrong
    ↓
Store calculates next review (SM-2)
    ↓
Progress updated in localStorage
    ↓
Stats recalculated on next load
```

### Components Hierarchy

```
Learn.tsx (Main page)
├── ProgressTracker.tsx (Quick stats)
├── VocabularyCardFlip.tsx (Learning cards)
├── QuizComponent.tsx (Quiz interface)
└── Tabs UI (Learn/Review/Quiz/Stats sections)
```

### State Management

**useLearningStore** (Zustand):
- Manages SRS progress for each card
- Calculates review schedules
- Tracks streaks
- Provides filtering methods
- Persists to localStorage

**Data Structure**:
```typescript
SRSProgress {
  cardId: string
  userId: string
  status: "new" | "learning" | "mastered"
  interval: number (days)
  difficulty: number (1-5)
  easeFactor: number (SM-2)
  nextReviewDate: string (ISO)
  attempts: number
  correctAttempts: number
  lastReviewedDate: string
  createdAt: string
  updatedAt: string
}
```

## 📊 Tabs Overview

### 1. Learn Tab
- Category & difficulty selectors
- Vocabulary card with flip animation
- Mark correct/wrong buttons
- Progress counter

### 2. Review Tab
- **Due for Review**: Cards needing practice (yellow)
- **New Cards**: Unlearned cards (blue)
- Click to jump to card in Learn tab

### 3. Quiz Tab
- Quiz statistics
- Quiz start button
- Shows available questions count
- Display today's practice sessions

### 4. Stats Tab
- Full progress dashboard
- Detailed metrics
- Streak information
- All tracking data

## 🚀 Usage Examples

### Basic Learning Flow

```typescript
// 1. Select category → cards filtered
setSelectedCategory("greetings") // 9 cards

// 2. View card
<VocabularyCardFlip card={currentCard} />

// 3. Mark as correct
handleMarkCorrect() 
// → SM-2 calculates: next review in 3 days
// → Status changes to "learning"

// 4. Next card automatically shown
handleNextCard()
```

### Taking a Quiz

```typescript
// 1. Click "Start Quiz"
generateQuiz()
// → Generates 10 questions from current category

// 2. Display quiz
<QuizComponent questions={quizQuestions} />

// 3. Complete quiz
handleQuizComplete({ score: 8, total: 10 })
// → Toast notification with results
```

### Reviewing Due Cards

```typescript
// Due cards calculated by SRS
const dueCards = learningStore.getDueCards(userId, 5)
// → Returns cards where nextReviewDate <= today

// Click card → Jump to Learn tab
// Study card → Mark correct/wrong
// System updates review schedule
```

## 🔄 Data Persistence

### localStorage Keys
- `learning-store`: Complete SRS progress & streak data
- Format: JSON with Map serialization
- Auto-syncs on every update

### Initialization

```typescript
// First load
useEffect(() => {
  vocabularyCards.forEach(card => {
    learningStore.addProgress(card.id, userId)
  })
}, [user?.id])
// → Creates SRS entry for each card
```

## 📈 Progress Metrics

### Stats Calculation

```typescript
getProgressStats(userId) {
  totalWords: vocabularyCards.length (17 default)
  masteredWords: count where status === "mastered"
  currentStreak: days of consecutive reviews
  longestStreak: all-time best streak
  totalReviewsToday: reviews completed today
  nextReviewDate: earliest due card's review date
}
```

### Example Stats

```
✓ 5 / 17 mastered (29%)
🔥 3 day current streak
📊 5 reviews today
📅 Next review: Tomorrow at 2pm
```

## 🎮 Gamification Elements

1. **Streaks**: 🔥 Counter motivates daily practice
2. **Mastery**: Visual progress bar
3. **Difficulty Badges**: Shows challenge level
4. **Quiz Scores**: Immediate feedback
5. **Statistics**: Tracks long-term progress

## 🔧 Configuration

### Available Adjustments

```typescript
// SRS intervals (in calculateSM2)
interval = 1, 3, 7, 14, 30+ days

// Quiz questions per session
const quizSize = 10 // in generateQuiz()

// Initial ease factor
easeFactor = 2.5 // SM-2 default

// Review cards per session
limit = 5 // in getDueCards()
```

## 📱 Responsive Design

- ✅ Desktop: Full layout with all features
- ✅ Tablet: Optimized grid layout
- ✅ Mobile: Stacked cards, readable text
- ✅ Touch-friendly buttons & interactions

## 🔐 Authentication

- Requires login to access
- Progress tied to user ID
- localStorage data per browser
- Syncs with backend (ready for API integration)

## 📝 Future Enhancements

1. **Backend Integration**:
   - Save progress to database
   - Multi-device sync
   - Collaborative learning

2. **Video Features**:
   - Real video demonstrations
   - Slow-motion playback
   - User-submitted videos

3. **More Features**:
   - Achievements system
   - Leaderboards
   - Social sharing
   - Mobile app version

4. **Advanced SRS**:
   - Weighted difficulty
   - Audio pronunciation
   - Handwriting recognition

## 🐛 Troubleshooting

### No progress showing
- Check browser localStorage enabled
- Ensure user is logged in
- Check console for errors

### Cards not updating
- Refresh page to reload SRS data
- Check category/difficulty filters
- Verify cards exist in database

### Quiz not starting
- Ensure cards in category exist
- Check if localStorage is full
- Try clearing old data

## 📚 Related Files

- `shared/vocabulary.ts` - Types & vocabulary data
- `hooks/use-learning-store.ts` - SRS logic & state
- `components/VocabularyCardFlip.tsx` - Card UI
- `components/ProgressTracker.tsx` - Stats display
- `components/QuizComponent.tsx` - Quiz interface
- `pages/Learn.tsx` - Main page
