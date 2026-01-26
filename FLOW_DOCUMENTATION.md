# Complete Application Flow Documentation

## 🚀 Starting Point: App Launch

1. **App Starts** → `app/_layout.tsx` (Root Layout)
   - Shows **Splash Screen** for 5 seconds
   - Calls `useAppFlow()` hook to check authentication state
   - Uses `useAuthStore` to check if user has a token stored

---

## 🔐 Authentication Flow

### Path A: User is NOT Authenticated

2. **Redirect to Auth** → `/(auth)/index.tsx` (Login Screen)
   - User sees login form
   - Can click "Sign up" link to go to signup

3a. **Login Path** (`/(auth)/index.tsx`):
   - User enters email/password
   - Calls `apiClient.login()`
   - Sets auth token and user data
   - **CHECK**: Is assessment complete?
     - ✅ **YES** → Goes to `/(after-auth)` → Dashboard
     - ❌ **NO** → Goes to `/(onboarding)` → Assessment

3b. **Signup Path** (`/(auth)/signup.tsx`):
   - User enters: name, email, password (NO school/exam year - server doesn't require it)
   - Calls `apiClient.signup()`
   - Sets auth token and user data
   - **ROUTES TO**: `/(onboarding)` → Assessment flow

---

## 📚 Onboarding/Assessment Flow

### Path B: New User Assessment (After Signup/Login)

4. **Onboarding Welcome** → `/(onboarding)/index.tsx`
   - Shows explanation: "We'll ask 5 questions to find your perfect starting point"
   - User clicks "Start Assessment"

5. **Assessment Quiz** → `/(onboarding)/assessment.tsx`
   - Shows 5 multiple-choice questions
   - User answers all questions
   - Submits answers → `apiClient.submitAssessment()`
   - Gets result with level (Foundational, Core, or Advanced)

6. **Assessment Result** → `/(onboarding)/assessment-result.tsx`
   - Shows level assigned (Foundational/Core/Advanced)
   - Shows score and percentage
   - Explains what the level means
   - User clicks "Continue to Dashboard"
   - Sets `assessmentComplete = true` in storage
   - Redirects to `/(after-auth)`

---

## 🏠 Main App Flow (After Authentication)

### Path C: Authenticated User (Assessment Complete)

7. **After Auth Index** → `/(after-auth)/index.tsx`
   - Simply redirects to `/(after-auth)/dashboard`

8. **Dashboard** → `/(after-auth)/dashboard.tsx`
   - Shows:
     - Welcome header with name and streak
     - Overall progress bar
     - Current chapter card (clickable)
     - Next chapter card (locked if current chapter not completed)
   - Fetches dashboard data from API (with fallback to local data)

9. **Chapter Screen** → `/(after-auth)/chapters/[id].tsx`
   - Shows chapter content (title, description, sections with text/images)
   - "Start Quiz" button at bottom

10. **Chapter Quiz** → `/(after-auth)/chapters/[id]/quiz.tsx`
    - Shows quiz questions one at a time
    - User answers questions
    - Submits quiz → `apiClient.submitQuiz()`
    - Gets result (score, percentage, passed/failed, pastPaperReference)

11. **Quiz Result** → `/(after-auth)/chapters/[id]/quiz-result.tsx`
    - **IF PASSED (≥80%)**:
      - Shows celebration screen with trophy
      - Shows past paper reference: "You can now tackle questions like [Past Paper Code, Question Number]"
      - "Continue to Next Chapter" or "Back to Dashboard" button
      - Unlocks next chapter
    - **IF FAILED (<80%)**:
      - Shows "Let's Review That Again" message
      - Options: "Review Chapter" or "Try Again"
      - Next chapter stays locked

12. **Back to Dashboard** → Repeat from step 8

---

## 👨‍🏫 Teacher Dashboard Flow

13. **Teacher Dashboard** → `/(after-auth)/teacher/dashboard.tsx`
    - Shows class statistics:
      - Total students
      - On Track count (Green)
      - Behind count (Yellow)
      - At Risk count (Red)
    - Lists all students with:
      - Status indicator (color-coded)
      - Name, email
      - Current chapter
      - Progress percentage
      - Last active date

14. **Student Detail** → `/(after-auth)/teacher/students/[id].tsx`
    - Shows student information:
      - Name, email, status badge
      - Level badge (Foundational/Core/Advanced)
      - Statistics (streak, completed chapters, overall progress)
      - Current chapter
      - Quiz attempt history with scores
      - Activity information

---

## ✅ FLOW STATUS

All routing issues have been fixed:

- **Signup**: Now routes to `/(onboarding)` for assessment
- **Login**: Checks assessment completion and routes to `/(onboarding)` if not complete
- **Root Layout**: Checks both authentication and assessment completion status
- **Routes**: Assessment screen only exists in onboarding flow, removed from after-auth

---

## 🔄 CURRENT FLOW (Fixed - According to Sprint 1 Spec)

1. **App Launch** → Splash → Check Auth
2. **Not Authenticated** → `/(auth)` → Login/Signup
3. **Signup/Login Success** → Check Assessment Complete?
   - ❌ **NO** → `/(onboarding)` → Assessment → Result → Dashboard
   - ✅ **YES** → `/(after-auth)` → Dashboard
4. **Dashboard** → Chapter → Quiz → Result → Back to Dashboard
5. **Teacher** → Teacher Dashboard → Student Detail

---

## 📋 File Structure

```
app/
├── _layout.tsx                    # Root layout (splash + routing)
├── (auth)/
│   ├── _layout.tsx               # Auth routes layout
│   ├── index.tsx                 # Login screen
│   └── signup.tsx                # Signup screen (BYPASSES ASSESSMENT!)
├── (onboarding)/
│   ├── _layout.tsx               # Onboarding routes layout
│   ├── index.tsx                 # Onboarding welcome screen
│   ├── assessment.tsx            # Assessment quiz (5 questions)
│   └── assessment-result.tsx     # Assessment result with level
└── (after-auth)/
    ├── _layout.tsx               # Main app routes layout
    ├── index.tsx                 # Redirects to dashboard
    ├── dashboard.tsx             # Main dashboard
    ├── chapters/
    │   └── [id]/
    │       ├── index.tsx         # Chapter content
    │       ├── quiz.tsx          # Chapter quiz
    │       └── quiz-result.tsx   # Quiz result
    └── teacher/
        ├── dashboard.tsx         # Teacher dashboard
        └── students/
            └── [id].tsx          # Student detail
```

---

## 🎯 Key Routes

- `/(auth)` - Authentication (login/signup)
- `/(onboarding)` - Assessment flow (should be after signup)
- `/(after-auth)` - Main app (dashboard, chapters, quizzes)
- `/(after-auth)/teacher` - Teacher features

---

## 🔑 Storage Keys Used

- `token` - Auth token
- `user` - User data (JSON string)
- `assessmentComplete` - "true" or undefined/null
- `progress` - User progress data

