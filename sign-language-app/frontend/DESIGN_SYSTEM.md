# SmartSign UI Design System - Complete Documentation

## 🎨 Design Overview

SmartSign is a modern, clean, and highly interactive web application for sign language learning with real-time AI gesture recognition. The design emphasizes accessibility, responsiveness, and engaging user interactions.

---

## 📐 Design System Architecture

### Color Palette

#### Primary Gradient
- **Blue to Purple**: `linear-gradient(135deg, #5b8fff 0%, #7b68ff 100%)`
- Used for primary buttons, main CTAs, highlights

#### Secondary Gradient
- **Purple Gradient**: `linear-gradient(135deg, #7b68ff 0%, #9a7fff 100%)`
- Used for secondary actions, accents

#### Status Colors
- **Success**: `#22c55e` (Green)
- **Warning**: `#f59e0b` (Amber)
- **Error**: `#ef4444` (Red)
- **Info**: `#3b82f6` (Blue)

#### Dark Mode
- **Background**: `#0f172a` (Deep Navy)
- **Surface**: `#1e293b` (Card background)
- **Border**: `#475569` (Subtle dividers)
- **Text**: `#f1f5f9` (Primary text)

### Typography

- **Font Family**: System fonts (SF Pro, Segoe UI, Roboto)
- **Font Weights**:
  - Light: 300 (body text)
  - Normal: 400 (regular content)
  - Medium: 500 (labels, badges)
  - Semibold: 600 (card titles)
  - Bold: 700 (headings)

### Spacing Scale
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px

### Border Radius
- **sm**: 6px (small elements)
- **md**: 8px (input fields)
- **lg**: 12px (cards)
- **xl**: 16px (large cards)
- **2xl**: 24px (modals)

### Shadows
- **sm**: Light subtle shadow
- **md**: Medium depth
- **lg**: Large elevated elements
- **glow**: Blue glow effect (UI focus states)

---

## 🧩 Core Components

### 1. Button
**Variants**: Primary, Secondary, Outline, Ghost, Danger
**Sizes**: xs, sm, md, lg, xl
**Features**: 
- Hover animations (scale: 1.02)
- Tap animations (scale: 0.98)
- Loading states with spinner
- Icon support
- Full width option

```jsx
<Button variant="primary" size="lg" fullWidth loading={false}>
  Start Learning
</Button>
```

### 2. Card
**Variants**: Default, Elevated, Outline, Gradient
**Features**:
- Smooth shadows
- Hover lift effect
- Glow effect option
- Responsive padding

```jsx
<Card hoverable glowEffect variant="gradient">
  Content here
</Card>
```

### 3. Badge
**Variants**: Primary, Secondary, Success, Warning, Error, Neutral
**Sizes**: sm, md, lg
**Features**:
- Icon support
- Color-coded by variant

```jsx
<Badge variant="success" size="md">
  Completed ✓
</Badge>
```

### 4. Progress Bar
**Features**:
- Animated filling
- Multiple variants
- Label option
- Customizable size

```jsx
<ProgressBar value={45} max={100} label="Progress" />
```

### 5. Input
**Features**:
- Icon support
- Error states
- Label
- Accessible focus states

```jsx
<Input label="Email" type="email" error={error} />
```

### 6. Modal
**Features**:
- Backdrop blur
- Centered layout
- Title and footer support
- Multiple sizes

```jsx
<Modal isOpen={true} title="Confirm" onClose={() => {}}>
  Content
</Modal>
```

### 7. Avatar
**Features**:
- Multiple sizes (xs-2xl)
- Status indicators (online/offline/away)
- Image support

```jsx
<Avatar src={url} size="lg" status="online" />
```

### 8. Skeleton
**Features**:
- Animated loading placeholders
- Circle and rectangle variants
- Multiple row support

---

## 📱 Layout Components

### Sidebar Navigation
- **Width**: 16rem (desktop), full (mobile)
- **Features**:
  - Active indicator
  - Badge support
  - Smooth animations
  - Mobile overlay

### Top Navigation Bar
- **Features**:
  - Search bar
  - Notification bell (with badge)
  - User menu dropdown
  - Theme toggle
  - Sticky positioning

### Main Layout Wrapper
- **Structure**: Sidebar + Navbar + Main Content
- **Responsive**: Sidebar collapses on mobile
- **Features**: Overlay when sidebar open on mobile

---

## 🎯 Pages & Screens

### 1. Home Dashboard
**Path**: `/`
**Features**:
- Welcome section with user name
- Learning stats (4 cards)
- Overall progress bar
- 4 Quick action cards
- Recent activity feed

**Key Metrics Displayed**:
- Daily Streak
- Lessons Completed
- Experience Points
- Current Level

### 2. Learning Page
**Path**: `/learn`
**Features**:
- Filter by topic & level
- Lesson grid/list
- Lesson card with:
  - Thumbnail
  - Duration badge
  - Completion indicator
  - Difficulty badge
- Lesson player with video
- Tabs: Video & Notes
- Bookmark functionality
- Learning stats sidebar

### 3. Quiz Page
**Path**: `/quiz`
**Features**:
- Quiz selection grid
- Multiple choice questions
- Progress bar
- Answer selection UI
- Question indicators (1-10)
- Results screen with score
- Retry functionality
- Detailed stats on results

### 4. AI Game Page
**Path**: `/ai-game`
**Features**:
- Difficulty selection (Easy/Normal/Hard)
- Webcam feed with:
  - Target sign display
  - Countdown timer (with color change at 3s)
  - Hand skeleton animation
  - Feedback messages
- Round progress
- Score tracking
- Accuracy display
- Game over screen with detailed stats

### 5. AI Recognition Page
**Path**: `/recognize`
**Features**:
- Webcam feed with:
  - Real-time detection
  - FPS counter
  - Hand tracking indicator
- Recognized text display
- Confidence percentage
- Stats sidebar (FPS, Confidence, Detections)
- Recognition history
- Quick action buttons

### 6. User Profile Page
**Path**: `/profile`
**Features**:
- User header with:
  - Avatar
  - Name, role, location
  - Edit mode toggle
- Stats grid (4 cards)
- Progress by topic (6 topics)
- Achievements display
- Recent activity feed

### 7. Authentication Pages
**Paths**: `/login`, `/register`, `/forgot-password`
**Features**:
- Centered card layout
- Logo animation
- Form validation
- Error messages
- Password reset flow
- Link between pages

### 8. Admin Dashboard
**Path**: `/admin`
**Features**:
- Quick stats (4 cards)
- 4 Tab sections:
  - **Users**: Table with name, email, role, status, progress
  - **Videos**: List of lesson videos with CRUD
  - **Quizzes**: Quiz management
  - **Analytics**: Charts and metrics
- CRUD operations (Edit/Delete buttons)

---

## ✨ Animation & Interactions

### Page Transitions
- **Duration**: 300-500ms
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1)
- **Effect**: Fade + Slide Up

### Component Animations
- **Button Hover**: Scale up 1.02, shadow increase
- **Button Click**: Scale down 0.98
- **Card Hover**: Lift up 4px (if hoverable)
- **Progress Bar**: Smooth animated fill
- **Modal**: Scale 0.95→1 + fade

### Loading States
- **Spinner**: Rotating border animation
- **Skeleton**: Pulse animation
- **Progress**: Width animation

### Micro-interactions
- **Confetti** on quiz completion
- **Glow effect** on focused elements
- **Pulse animations** on notifications
- **Smooth scroll** behavior

---

## 🎨 Visual Hierarchy

### Typography Hierarchy
1. **H1**: 48px bold (page titles)
2. **H2**: 36px bold (section titles)
3. **H3**: 24px bold (card titles)
4. **Body**: 16px regular (content)
5. **Small**: 14px regular (metadata)
6. **xs**: 12px regular (timestamps)

### Color Hierarchy
- **Primary Colors**: Main CTAs, navigation active state
- **Secondary Colors**: Secondary actions, accents
- **Neutral Colors**: Text, backgrounds, borders
- **Status Colors**: Feedback, alerts

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 320px - 639px
- **Tablet**: 640px - 1023px
- **Desktop**: 1024px+

### Key Responsive Changes
- **Sidebar**: Hidden on mobile, visible on tablet+
- **Grid Layouts**: 
  - Mobile: 1 column
  - Tablet: 2-3 columns
  - Desktop: 4+ columns
- **Fonts**: Slightly smaller on mobile
- **Spacing**: Reduced padding on mobile
- **Modals**: Full-screen on mobile, centered on desktop

---

## ♿ Accessibility Features

### WCAG 2.1 AA Compliance
- **Color Contrast**: Minimum 4.5:1 for text
- **Focus States**: Visible focus rings on all interactive elements
- **Keyboard Navigation**: Tab through all controls
- **ARIA Labels**: All buttons and icons have labels
- **Alt Text**: All images have alt text
- **Form Labels**: Associated with inputs

### Interactive Elements
- **Buttons**: Min 44px height for touch targets
- **Links**: Underlined or obvious focus state
- **Forms**: Clear error messages and labels
- **Icons**: Always paired with text or aria-label

---

## 🌙 Dark Mode

### Implementation
- Uses `dark:` prefix in Tailwind CSS
- System preference detection
- Manual toggle in navbar
- Persistent preference in localStorage

### Color Adjustments
- **Background**: Darker shades maintain contrast
- **Text**: Light colors for readability
- **Cards**: Elevated backgrounds
- **Borders**: Subtle gray for dividers
- **Shadows**: More pronounced in dark mode

---

## 🚀 Performance Optimizations

### Image Optimization
- Lazy loading for images
- WebP format with fallback
- Responsive image sizes
- Placeholder images while loading

### Code Splitting
- Page-based route splitting
- Component lazy loading
- Modal content loaded on demand

### Animations
- GPU-accelerated transforms (scale, rotate)
- Will-change hints for heavy animations
- Reduced motion support

---

## 📦 Component Library Structure

```
src/
├── styles/
│   └── theme.js
├── components/
│   ├── UIComponents.jsx (all basic components)
│   └── Layout.jsx (Sidebar, Navbar, MainLayout)
├── pages/
│   ├── HomeDashboard.jsx
│   ├── LearningPage.jsx
│   ├── QuizPage.jsx
│   ├── AIGamePage.jsx
│   ├── AIRecognitionPage.jsx
│   ├── UserProfilePage.jsx
│   ├── AuthPages.jsx
│   └── AdminDashboard.jsx
└── App.jsx
```

---

## 🎓 Usage Examples

### Creating a New Page with Layout
```jsx
import { MainLayout } from '../components/Layout';
import { Card, Button } from '../components/UIComponents';

export const MyPage = () => {
  return (
    <MainLayout>
      <div className="p-8">
        <h1 className="text-4xl font-bold mb-4">My Page</h1>
        <Card className="p-6">
          <Button variant="primary">Click me</Button>
        </Card>
      </div>
    </MainLayout>
  );
};
```

### Using Animations
```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

### Form with Validation
```jsx
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={error}
/>
```

---

## 🎯 Best Practices

### Component Usage
- Always use semantic HTML
- Provide meaningful aria-labels
- Keep components focused and reusable
- Use TypeScript interfaces for props

### Styling
- Use theme colors instead of hardcoding
- Leverage Tailwind CSS for consistency
- Use dark: prefix for dark mode support
- Maintain consistent spacing

### Performance
- Lazy load images and components
- Memoize expensive computations
- Use proper key prop in lists
- Avoid inline function definitions

### Accessibility
- Test with keyboard navigation
- Verify color contrast
- Add alt text to images
- Use semantic HTML elements

---

## 📚 Resources

- **Framer Motion**: Animation library
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Page navigation
- **Zustand**: State management (optional)
- **Axios**: HTTP client for API calls

---

**Last Updated**: April 22, 2026
**Version**: 1.0.0
**Status**: Production Ready
