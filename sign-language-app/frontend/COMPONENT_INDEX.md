# SmartSign Component & Page Index

## 📚 Quick Reference Guide

This file serves as a quick navigation guide for all components and pages in the SmartSign UI system.

---

## 🧩 UI Components (`src/components/UIComponents.jsx`)

### 1. Button
**Purpose**: Action element with multiple variants
**Props**:
- `variant`: primary, secondary, outline, ghost, danger
- `size`: xs, sm, md, lg, xl
- `disabled`: boolean
- `loading`: boolean
- `fullWidth`: boolean
- `children`: button text

**Usage**:
```jsx
<Button variant="primary" size="lg" onClick={handleClick}>
  Click Me
</Button>
```

### 2. Card
**Purpose**: Container with styling and effects
**Props**:
- `variant`: default, elevated, outline, gradient
- `hoverable`: boolean (adds lift effect)
- `glowEffect`: boolean
- `children`: card content

**Usage**:
```jsx
<Card hoverable className="p-6">
  <h2>Card Title</h2>
  Card content
</Card>
```

### 3. Badge
**Purpose**: Label or status indicator
**Props**:
- `variant`: primary, secondary, success, warning, error, neutral
- `size`: sm, md, lg
- `icon`: React component
- `children`: badge text

**Usage**:
```jsx
<Badge variant="success" size="md">
  Completed ✓
</Badge>
```

### 4. ProgressBar
**Purpose**: Show progress visualization
**Props**:
- `value`: current progress
- `max`: maximum value
- `label`: text label
- `showLabel`: boolean
- `animated`: boolean
- `variant`: primary, success, warning, error
- `size`: sm, md, lg

**Usage**:
```jsx
<ProgressBar 
  value={45} 
  max={100} 
  label="Progress"
  variant="primary"
/>
```

### 5. Input
**Purpose**: Text input field
**Props**:
- `label`: input label
- `type`: text, email, password, etc.
- `placeholder`: placeholder text
- `error`: error message
- `icon`: React component icon
- `onChange`: change handler
- `value`: input value

**Usage**:
```jsx
<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  error={emailError}
  onChange={(e) => setEmail(e.target.value)}
/>
```

### 6. Select
**Purpose**: Dropdown selector
**Props**:
- `label`: field label
- `options`: [{value, label}, ...]
- `error`: error message
- `icon`: React component
- `onChange`: change handler
- `value`: selected value

**Usage**:
```jsx
<Select
  label="Topic"
  options={[
    {value: 'family', label: 'Family'},
    {value: 'health', label: 'Healthcare'}
  ]}
  onChange={(e) => setTopic(e.target.value)}
/>
```

### 7. Modal
**Purpose**: Dialog box
**Props**:
- `isOpen`: boolean
- `onClose`: close handler
- `title`: modal title
- `size`: sm, md, lg, xl, 2xl
- `footer`: footer content
- `children`: modal content

**Usage**:
```jsx
<Modal
  isOpen={showModal}
  title="Confirm"
  onClose={handleClose}
  footer={<Button onClick={handleClose}>Close</Button>}
>
  <p>Modal content</p>
</Modal>
```

### 8. Toast
**Purpose**: Notification popup
**Props**:
- `message`: notification text
- `type`: info, success, warning, error
- `icon`: React component
- `onClose`: close handler
- `duration`: milliseconds

**Usage**:
```jsx
<Toast
  message="Lesson completed!"
  type="success"
  duration={3000}
  onClose={handleClose}
/>
```

### 9. Skeleton
**Purpose**: Loading placeholder
**Props**:
- `variant`: text (default)
- `width`: width value
- `height`: height value
- `circle`: boolean
- `count`: number of lines

**Usage**:
```jsx
<Skeleton count={3} height="20px" />
```

### 10. Avatar
**Purpose**: User profile image
**Props**:
- `src`: image URL
- `alt`: alt text
- `size`: xs, sm, md, lg, xl, 2xl
- `status`: online, offline, away
- `className`: additional classes

**Usage**:
```jsx
<Avatar
  src="/avatar.jpg"
  alt="User"
  size="lg"
  status="online"
/>
```

---

## 🎨 Layout Components (`src/components/Layout.jsx`)

### Sidebar
**Purpose**: Left navigation menu
**Props**:
- `isOpen`: boolean
- `onClose`: close handler
- `isAdmin`: boolean (shows admin menu)
- `userRole`: string

**Features**:
- Auto-collapses on mobile
- Active route indicator
- Badge support
- Smooth animations

### Navbar
**Purpose**: Top navigation bar
**Props**:
- `onMenuToggle`: sidebar toggle handler
- `userInfo`: user object with name, avatar

**Features**:
- Search bar
- Notification bell
- User dropdown menu
- Dark mode toggle
- Sticky positioning

### MainLayout
**Purpose**: Complete page wrapper
**Props**:
- `children`: page content
- `isAdmin`: boolean
- `userInfo`: user object

**Usage**:
```jsx
<MainLayout userInfo={userInfo}>
  <div className="p-8">
    Page content
  </div>
</MainLayout>
```

---

## 📄 Pages (`src/pages/`)

### 1. HomeDashboard.jsx
**Route**: `/`
**Purpose**: Main dashboard/home page
**Key Features**:
- Welcome message with streak
- 4 stat cards (streak, lessons, XP, level)
- Overall progress bar
- 4 quick action cards
- Recent activity feed

**Key Components**: Card, Button, Badge, ProgressBar

### 2. LearningPage.jsx
**Route**: `/learn`
**Purpose**: Browse and watch lessons
**Key Features**:
- Filter by topic and level
- Lesson grid with thumbnails
- Lesson player with video
- Video/Notes tabs
- Bookmark functionality
- Learning stats sidebar

**Key Components**: Card, Input, Select, Button, Badge

### 3. QuizPage.jsx
**Route**: `/quiz`
**Purpose**: Take quizzes and test knowledge
**Key Features**:
- Quiz selection grid
- Multiple choice questions
- Progress indicator
- Question navigation
- Results screen with stats
- Retry functionality

**Key Components**: Card, Button, Badge, Modal

### 4. AIGamePage.jsx
**Route**: `/ai-game`
**Purpose**: Interactive gesture recognition game
**Key Features**:
- Difficulty selection
- Webcam feed integration
- Real-time gesture recognition
- Score tracking
- Round progress
- Game over screen

**Key Components**: Card, Button, Badge, ProgressBar

### 5. AIRecognitionPage.jsx
**Route**: `/recognize`
**Purpose**: Real-time sign recognition
**Key Features**:
- Live webcam feed
- Real-time detection display
- FPS counter
- Confidence percentage
- Recognition history
- Settings panel

**Key Components**: Card, Button, Badge, Modal

### 6. UserProfilePage.jsx
**Route**: `/profile`
**Purpose**: User profile management
**Key Features**:
- User info header
- Edit profile form
- 4 stat cards
- Progress by topic
- Achievements display
- Activity history

**Key Components**: Card, Avatar, Badge, Input, Button, ProgressBar

### 7. AuthPages.jsx
**Routes**: `/login`, `/register`, `/forgot-password`
**Purpose**: Authentication pages
**Pages**:
- **LoginPage**: Email/password login
- **RegisterPage**: New account creation
- **ForgotPasswordPage**: Password reset flow

**Key Components**: Card, Input, Button, Modal

### 8. AdminDashboard.jsx
**Route**: `/admin`
**Purpose**: Admin management panel
**Features**:
- 4 quick stat cards
- 4 tabs: Users, Videos, Quizzes, Analytics
- User management table
- Video list with CRUD
- Quiz list with management
- Analytics charts

**Key Components**: Card, Button, Badge, Table, Modal

---

## 🎯 Theme/Styling (`src/styles/theme.js`)

### Color Palette
- **Primary**: Blue → Purple gradient
- **Secondary**: Purple shades
- **Success**: Green (#22c55e)
- **Warning**: Amber (#f59e0b)
- **Error**: Red (#ef4444)
- **Dark Mode**: Navy backgrounds

### Typography Scale
- **xs**: 12px (timestamps)
- **sm**: 14px (secondary text)
- **base**: 16px (body text)
- **lg**: 18px (subtitle)
- **xl**: 20px (subheading)
- **2xl**: 24px (section title)
- **3xl**: 30px (page subtitle)
- **4xl**: 36px (page title)
- **5xl**: 48px (hero title)
- **6xl**: 60px (display)

### Spacing Scale
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px

---

## 🚀 Routing Map

```
/                          → HomeDashboard (home page)
/learn                     → LearningPage (lesson browser)
/quiz                      → QuizPage (quizzes)
/ai-game                   → AIGamePage (interactive game)
/recognize                 → AIRecognitionPage (real-time)
/profile                   → UserProfilePage (user profile)
/admin                     → AdminDashboard (admin panel)
/login                     → LoginPage (authentication)
/register                  → RegisterPage (sign up)
/forgot-password           → ForgotPasswordPage (password reset)
```

---

## 🎨 Styling Guide

### Tailwind CSS Usage
```jsx
// Layout
className="flex items-center justify-between gap-4"

// Colors
className="bg-blue-500 text-white dark:bg-slate-800"

// Responsive
className="p-4 md:p-6 lg:p-8"

// Dark Mode
className="text-gray-900 dark:text-white"

// Shadows
className="shadow-lg hover:shadow-xl"

// Rounded
className="rounded-xl"
```

### Animation with Framer Motion
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

---

## 📋 Component Props Reference

### Button Props
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  loading?: boolean
  icon?: React.ComponentType
  fullWidth?: boolean
  children: React.ReactNode
}
```

### Card Props
```typescript
interface CardProps {
  variant: 'default' | 'elevated' | 'outline' | 'gradient'
  hoverable?: boolean
  glowEffect?: boolean
  className?: string
  children: React.ReactNode
}
```

### Input Props
```typescript
interface InputProps {
  label?: string
  type?: string
  placeholder?: string
  error?: string
  icon?: React.ComponentType
  value?: string
  onChange?: (e) => void
}
```

---

## ✨ Animation Presets

### Fade In
```jsx
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ duration: 0.3 }}
```

### Slide Up
```jsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}
```

### Hover Scale
```jsx
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}
```

### Stagger Children
```jsx
variants={{
  visible: { transition: { staggerChildren: 0.1 } }
}}
```

---

## 🔗 Import Examples

### Import Components
```jsx
import {
  Button,
  Card,
  Badge,
  Input,
  ProgressBar,
  Modal,
  Avatar
} from '../components/UIComponents'
```

### Import Layout
```jsx
import { MainLayout, Sidebar, Navbar } from '../components/Layout'
```

### Import Pages
```jsx
import HomeDashboard from '../pages/HomeDashboard'
import LearningPage from '../pages/LearningPage'
import QuizPage from '../pages/QuizPage'
```

### Import Theme
```jsx
import theme from '../styles/theme'
```

---

## 📱 Responsive Breakpoints

- **Mobile**: 320px - 639px (sm)
- **Tablet**: 640px - 1023px (md)
- **Desktop**: 1024px+ (lg, xl)

**Usage**:
```jsx
className="
  grid-cols-1        // mobile: 1 column
  md:grid-cols-2     // tablet: 2 columns
  lg:grid-cols-4     // desktop: 4 columns
"
```

---

## 🎯 Common Patterns

### Form with Validation
```jsx
const [email, setEmail] = useState('')
const [error, setError] = useState('')

const handleSubmit = (e) => {
  e.preventDefault()
  if (!email) setError('Email required')
  else handleLogin()
}

<Input
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={error}
/>
<Button onClick={handleSubmit}>Submit</Button>
```

### List with Cards
```jsx
{items.map((item) => (
  <Card key={item.id} hoverable>
    <h3>{item.title}</h3>
    <p>{item.description}</p>
    <Button size="sm">Action</Button>
  </Card>
))}
```

### Modal Dialog
```jsx
const [showModal, setShowModal] = useState(false)

<Modal
  isOpen={showModal}
  title="Confirm"
  onClose={() => setShowModal(false)}
>
  <p>Are you sure?</p>
</Modal>
```

---

## 🐛 Debugging Tips

### React DevTools
- Inspect component tree
- View props and state
- Profile performance

### Console Logs
```javascript
console.log('Debug:', value)
console.error('Error:', error)
```

### Network Tab
- Check API calls
- Monitor response times
- Debug errors

---

## 📚 Related Documentation

- **DESIGN_SYSTEM.md**: Complete design system guide
- **IMPLEMENTATION_GUIDE.md**: Setup and installation
- **UI_SUMMARY.md**: Project overview

---

**SmartSign Component & Page Index**
✨ Last Updated: April 22, 2026
🚀 Status: Production Ready
