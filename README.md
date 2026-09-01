# Apex Learn Client

> Mobile and web clients for Apex Learn — A learning management platform for GCE A Level students in Cameroon

## Project Structure

```
atlas-learn-client/
├── mobile/                 # React Native (Expo) — primary student app
│   ├── app/
│   │   ├── (auth)/         # Login, signup, set-password
│   │   ├── (intro)/        # Onboarding intro screens
│   │   ├── (onboarding)/   # School, role, subject selection
│   │   └── (tabs)/         # Main tabbed app
│   │       ├── index.tsx           # Home dashboard
│   │       ├── learn/              # Learning flow (subjects, chapters, lessons, exams)
│   │       ├── exams/              # Exam list + exam taking
│   │       ├── browse-subjects.tsx  # Browse all subjects
│   │       └── profile/            # Profile, notifications, settings
│   ├── components/         # Reusable UI components
│   ├── lib/
│   │   ├── api/            # API client (Axios), endpoints
│   │   ├── store/          # Zustand stores (user, progress, quizzes)
│   │   ├── hooks/          # React Query hooks
│   │   ├── utils/          # Cache, validation, helpers
│   │   └── constants/      # API URLs, cache config
│   ├── tests/              # Jest unit + integration tests
│   └── assets/             # Fonts, images, icons
└── web/                    # React (Vite) — admin/content management
    ├── src/
    │   ├── pages/          # Login, signup, set-password, teachers, forgot-password
    │   └── components/     # TipTap rich text editor with LaTeX
    └── index.html
```

## Tech Stack

### Mobile

| Technology | Purpose |
|-----------|---------|
| Expo 54 | React Native framework |
| React Native 0.81 | Mobile UI |
| Expo Router 6 | File-based navigation |
| NativeWind / Tailwind CSS | Styling |
| Zustand | State management |
| React Query | Server state, caching |
| Axios | HTTP client |
| react-native-render-html | Render rich text / HTML lessons |
| Victory Native | Charts, progress visualization |
| react-native-reanimated | Animations |

### Web

| Technology | Purpose |
|-----------|---------|
| Vite 8 | Build tool |
| React 19 | UI library |
| Tailwind CSS 4 | Styling |
| TipTap | Rich text editor with LaTeX (`@tiptap/extension-mathematics` + `katex`) |
| React Router | Navigation |
| Axios | HTTP client |

## Quick Start

### Mobile

```bash
cd atlas-learn-client/mobile
npm install
npx expo start
```

- Scan QR with Expo Go, or
- Press `a` for Android emulator, `i` for iOS simulator
- Server URL: configured in `lib/constants/api.ts` (defaults to `https://atlas-learn-server-production.up.railway.app/api/v1`)

### Web

```bash
cd atlas-learn-client/web
npm install
npm run dev
```

Opens at http://localhost:8081

## Scripts

### Mobile

| Script | Description |
|--------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run apk:preview` | Build preview APK (EAS, local) |
| `npm run refresh` | Rebuild debug APK and install via adb |
| `npm run web` | Run on web |
| `npm test` | Run Jest tests |
| `npm run lint` | Run ESLint |

### Web

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run oxlint |

## Key Features

### Mobile

- **Auth flow** — Email/password, OTP login, Google OAuth, set-password for invited users
- **Onboarding** — School selection, role selection (student/teacher/admin), subject selection (max 2 for teachers)
- **Home dashboard** — Overall progress, streak, quizzes passed, study time
- **Learning flow** — Subjects → Chapters → Lessons (HTML rendered) → Quiz
- **Exams** — Start confirmation, auto-submit on timeout/background, back button blocking, question pills, timer, structural question support
- **Notifications** — Auto-polling every 30s while focused, unread badge on profile
- **Leaderboard** — Live scores, ranked by performance, shows `@username`
- **Profile** — User info, logout, notification settings
- **Offline caching** — Disk cache with TTL for exam lists, subjects, progress
- **AI chat** — Floating chatbot on learn screens (not on exam screens)

### Web

- **Set password** — Invited users set their password with subject selection
- **Rich text editor** — TipTap with LaTeX formula support (`$...$` inline, `$$...$$` block), images, code blocks, links
- **Teacher management** — Assign subjects to teachers (max 2)

## Branding

| Color | Hex | Usage |
|-------|-----|-------|
| Darkest | `#011C26` | Black backgrounds, text |
| Dark Teal | `#084A59` | Primary buttons, headers, nav |
| Bright Teal | `#12A67C` | Accent, success states |
| Gold | `#F2B138` | Highlights, app icon |
| Terracotta | `#BF522A` | Error, warning states |

**Rules**:
- Never use yellow buttons on white backgrounds — always dark teal
- Login/signup: yellow transparent icon on white (`apex-yellow-icon.png`)
- App icon: yellow on black (`apex-yellow-icon-mobile.png`)
- All headers use `ScreenHeader` with dark teal background

## Assets

Brand assets stored in `/apex-assets/`:
- `apex-yellow-icon.png` — Yellow icon (login/signup pages)
- `apex-yellow-icon-mobile.png` — Yellow on black (app icon)
- `apex-yellow-icon-dark-teal-text.png` — Full logo (emails, web)

## Deployment

- **Mobile**: EAS Build for Android APK / iOS
- **Web**: Static hosting (Vercel, Netlify, or VPS)
