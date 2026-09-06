# Apex Learn Mobile

> React Native (Expo) mobile app for Apex Learn — a learning platform for GCE A Level students in Cameroon

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Expo | 54 | React Native framework |
| React Native | 0.81.5 | Mobile UI |
| Expo Router | 6.0.24 | File-based navigation |
| React | 19.1.0 | UI library |
| NativeWind / Tailwind CSS | 3.4.19 | Styling |
| Zustand | 5.0.14 | State management |
| React Query | 5.101.4 | Server state, caching |
| Axios | 1.19.0 | HTTP client |
| react-native-render-html | 6.3.4 | Render HTML lesson content |
| Victory Native | 37.3.6 | Charts, progress visualization |
| react-native-reanimated | 4.1.7 | Animations |
| react-native-mmkv | 4.3.2 | Fast disk storage |
| Zod | 4.4.3 | Validation |

## Getting Started

```bash
cd atlas-learn-client/mobile
npm install
npx expo start
```

- Scan QR with Expo Go, or
- Press `a` for Android emulator, `i` for iOS simulator
- For physical device: `npm run start:t` (tunnel mode)

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Expo dev server |
| `npm run start:t` | Start with tunnel (physical device) |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run apk:preview` | Build preview APK (EAS, local) |
| `npm run refresh` | Rebuild debug APK + install via adb |
| `npm run web` | Run on web |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Coverage report |
| `npm run lint` | ESLint |

## Project Structure

```
app/
├── _layout.tsx               # Root layout
├── (auth)/
│   ├── index.tsx             # Login screen
│   ├── signup.tsx            # Signup screen
│   ├── set-password.tsx      # Set password (invited users)
│   └── verify-email.tsx      # Email verification
├── (intro)/
│   └── index.tsx             # Onboarding intro
├── (onboarding)/
│   ├── school.tsx            # School selection
│   ├── role.tsx              # Role selection
│   └── subjects.tsx          # Subject selection (max 2 for teachers)
└── (tabs)/
    ├── index.tsx             # Home dashboard
    ├── _layout.tsx           # Tab bar layout
    ├── learn/
    │   ├── index.tsx         # Subject list
    │   ├── [id].tsx          # Chapter list
    │   ├── chapter/[id].tsx  # Chapter detail (lessons + quizzes)
    │   ├── lesson/[id].tsx   # Lesson detail (HTML content)
    │   ├── exam/
    │   │   ├── index.tsx     # Exam list
    │   │   └── [id].tsx      # Exam taking
    │   └── browse-subjects.tsx
    ├── exams/
    │   ├── index.tsx         # Exam list (all published)
    │   └── [id].tsx          # Exam taking (with safety features)
    ├── browse-subjects.tsx   # Browse all subjects
    └── profile/
        ├── index.tsx         # Profile + logout
        ├── notifications.tsx # Notification list
        └── settings.tsx      # Settings

components/
├── ui/                       # Shared UI (Button, Card, Badge, ScreenHeader, etc.)
├── quizzes/                  # Quiz-related components
└── ...

lib/
├── api/
│   ├── client.ts             # Axios instance + all API methods
│   └── endpoints.ts          # API endpoint constants
├── store/
│   ├── user.ts               # User state (Zustand)
│   ├── progress.ts           # Progress state
│   └── quizzes.ts            # Quiz state
├── hooks/
│   └── api.ts                # React Query hooks
├── utils/
│   ├── cache.ts              # MMKV disk cache with TTL
│   ├── validate.ts           # Form validation
│   └── format.ts             # Time/date formatting
└── constants/
    ├── api.ts                # Server URL config
    └── cachePolicy.ts        # Cache TTL values

tests/
├── unit/                     # Unit tests
└── integration/              # Integration tests
```

## Key Features

### Auth Flow
- Email/password login, OTP login, Google OAuth
- Signup with school selection (required for all roles)
- Set password for invited users with subject selection

### Onboarding
- School selection → Role selection → Subject selection
- Teachers limited to max 2 subjects

### Learning
- Subject list → Chapter list → Chapter detail (lessons + quizzes sidebar)
- Lessons rendered as HTML via `react-native-render-html`
- Rich text content with formatting, images, videos

### Exams
- Start confirmation dialog (warns: no retake, no restart, auto-submit on close)
- Timer with auto-submit on timeout
- AppState listener auto-submits when app goes to background
- BackHandler blocks hardware back button during exam
- Question pills (green=answered, dark teal=current)
- MCQ options, structural/essay text input
- Auto-refresh polling every 30s

### Notifications
- Exam published alerts
- Auto-polling every 30s while screen focused
- Unread badge on profile icon

### Offline
- Disk cache (MMKV) with TTL for exams, subjects, progress
- Cache-first loading with background refresh

### AI Chat
- Floating chatbot on learn screens only (not on exam screens)

## Branding

| Color | Hex | Usage |
|-------|-----|-------|
| Darkest | `#011C26` | Backgrounds, text |
| Dark Teal | `#084A59` | Primary buttons, headers, nav |
| Bright Teal | `#12A67C` | Accent, success |
| Gold | `#F2B138` | Highlights, icons |
| Terracotta | `#BF522A` | Error, warning |

**Rules**:
- Never use yellow buttons on white backgrounds
- Login/signup use `apex-yellow-icon.png` (yellow transparent bg)
- App icon uses `apex-yellow-icon-mobile.png` (yellow on black)
- All headers use `ScreenHeader` with dark teal background

## Environment

Server URL configured in `lib/constants/api.ts`:
- Default: `https://atlas-learn-server-production.up.railway.app/api/v1`
- Local: `http://10.0.2.2:3000/api/v1` (Android emulator)
