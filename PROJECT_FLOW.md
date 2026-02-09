# Atlas Learn Client - Current Project Flow

## Overview
This document explains the complete flow of the Atlas Learn mobile application from startup to main features.

---

## 1. App Startup Flow (`app/_layout.tsx`)

### Initial State Check
1. **Splash Screen** (5 seconds minimum)
   - Shows app logo/branding
   - Loads authentication state

2. **State Loading** (`useAppFlow` hook)
   - Checks if user is authenticated (loads token from AsyncStorage)
   - If authenticated, loads user data and progress
   - Checks if assessment is completed (`assessmentComplete` flag)

3. **Navigation Decision**
   ```
   ┌─────────────────────────────────┐
   │     App Starts                  │
   └────────────┬────────────────────┘
                │
                ▼
   ┌─────────────────────────────────┐
   │  Is Authenticated?              │
   └────────────┬────────────────────┘
                │
        ┌───────┴───────┐
        │               │
       NO              YES
        │               │
        ▼               ▼
   ┌─────────┐   ┌──────────────────┐
   │  Auth   │   │ Assessment Done? │
   │ Screen  │   └──────┬───────────┘
   └─────────┘          │
                   ┌────┴────┐
                   │         │
                  NO        YES
                   │         │
                   ▼         ▼
            ┌──────────┐ ┌──────────────┐
            │Onboarding│ │ After-Auth    │
            │  Screen  │ │   (Main App)  │
            └──────────┘ └──────────────┘
   ```

---

## 2. Authentication Flow

### 2.1 Sign Up (`app/(auth)/signup.tsx`)

**Flow:**
1. User enters:
   - Full Name
   - Email
   - Password
   - Selects role: **Student** or **Teacher**
   - Agrees to Terms & Conditions

2. **API Call:** `POST /api/v1/auth/sign-up/email`
   - Sends: `{ name, email, password, image, role }`
   - Returns: `{ token, user }`

3. **After Successful Signup:**
   - **Students:** → `/(onboarding)` (Assessment flow)
   - **Teachers:** → `/(auth)/pending-approval` (Wait for admin approval)

4. **Storage:**
   - Token saved to AsyncStorage (`authToken`)
   - User data saved to AsyncStorage (`user`)
   - Auth state updated in Zustand store

### 2.2 Sign In (`app/(auth)/index.tsx`)

**Flow:**
1. User enters email and password
2. **API Call:** `POST /api/v1/auth/sign-in/email`
3. **After Successful Login:**
   - Checks `assessmentComplete` flag from AsyncStorage
   - If `true` → `/(after-auth)` (Main app)
   - If `false` → `/(onboarding)` (Assessment flow)

### 2.3 Teacher Pending Approval (`app/(auth)/pending-approval.tsx`)

**Flow:**
- Shows message: "Pending Approval"
- Teacher must wait for admin to approve their account
- Can sign out to return to auth screen
- Once approved (server-side), teacher can sign in normally

---

## 3. Onboarding & Assessment Flow

### 3.1 Onboarding Welcome (`app/(onboarding)/index.tsx`)

**Purpose:** Introduces the assessment to users

**Flow:**
1. Shows welcome message explaining the assessment
2. User clicks "Start Assessment"
3. Navigates to → `/(onboarding)/assessment`

### 3.2 Assessment Test (`app/(onboarding)/assessment.tsx`)

**Current Status:** ⚠️ **NOT FULLY IMPLEMENTED** (as you mentioned)

**Intended Flow:**
1. **API Call:** `GET /api/v1/assessment/start`
   - Should fetch assessment questions from server
   - Currently calls `apiClient.startAssessment()`

2. **User Experience:**
   - Shows questions one by one
   - User selects answers
   - Can navigate Previous/Next
   - Must answer all questions before submitting

3. **Submit Assessment:**
   - **API Call:** `POST /api/v1/assessment/submit`
   - Sends: `{ answers: [{ questionId, answerIndex }] }`
   - Returns: `{ score, totalQuestions, level, message }`

4. **Navigate to:** `/(onboarding)/assessment-result`

### 3.3 Assessment Result (`app/(onboarding)/assessment-result.tsx`)

**Flow:**
1. Displays:
   - Score (e.g., "4 / 5")
   - Percentage
   - Assigned Level (FOUNDATIONAL, CORE, or ADVANCED)
   - Personalized message

2. **Updates:**
   - User level in Zustand store
   - Sets `assessmentComplete = "true"` in AsyncStorage

3. **User clicks "Continue to Dashboard"**
   - Navigates to → `/(after-auth)`

---

## 4. Main App Flow (After Authentication)

### 4.1 Entry Point (`app/(after-auth)/index.tsx`)

**Flow:**
- Automatically redirects to → `/(after-auth)/dashboard`

### 4.2 Dashboard (`app/(after-auth)/dashboard.tsx`)

**Current Status:** ⚠️ **HAS ISSUES**

**Intended Flow:**
1. **Should fetch from:** `GET /api/v1/dashboard` (not implemented yet)
2. **Currently:**
   - Constructs dashboard from local stores (user, progress)
   - Tries to fetch current chapter: `GET /api/v1/chapters/{chapterId}`
   - **Problem:** If `currentChapterId` is invalid (e.g., "chapter-1"), gets 404 error
   - **Problem:** No endpoint to list all chapters (`GET /api/v1/chapters` doesn't exist)

3. **Displays:**
   - Welcome header with user name and streak
   - Progress bar
   - Current chapter card
   - Next chapter card (if available)

4. **User Actions:**
   - Can tap chapter card to view chapter details
   - Can pull to refresh

### 4.3 Chapter View (`app/(after-auth)/chapters/[id].tsx`)

**Flow:**
1. **API Call:** `GET /api/v1/chapters/{id}`
   - Fetches chapter content from server
   - Returns: `{ id, title, description, level, order, content, subject, estimatedTime }`

2. **Displays:**
   - Chapter header with title and description
   - Chapter sections (content)
   - "Start Quiz" button

3. **User Actions:**
   - Can read chapter content
   - Can start quiz → `/(after-auth)/chapters/{id}/quiz`

### 4.4 Chapter Quiz (`app/(after-auth)/chapters/[id]/quiz.tsx`)

**Flow:**
1. **API Call:** `GET /api/v1/chapters/{id}/quizzes`
   - Fetches quizzes for the chapter
   - Gets first quiz (or specific quiz if multiple)

2. **User Experience:**
   - Shows questions one by one
   - User selects answers
   - Can navigate Previous/Next
   - Must answer all before submitting

3. **Submit Quiz:**
   - **API Call:** `POST /api/v1/quizzes/{quizId}/submit`
   - Sends: `{ answers: [{ questionId, answerIndex }] }`
   - Returns: `{ score, totalQuestions, percentage, passed, unlockedNextChapter }`

4. **Navigate to:** `/(after-auth)/chapters/{id}/quiz-result`

### 4.5 Quiz Result (`app/(after-auth)/chapters/[id]/quiz-result.tsx`)

**Flow:**
1. Displays quiz results
2. Updates progress (marks chapter as completed if passed)
3. User can:
   - Return to chapter
   - Retake quiz
   - Continue to next chapter

---

## 5. Teacher Flow

### 5.1 Teacher Dashboard (`app/(after-auth)/teacher/dashboard.tsx`)

**Flow:**
1. **API Call:** `GET /api/v1/teacher/dashboard`
   - Returns: `{ students: [], totalStudents, onTrackCount, behindCount, atRiskCount }`

2. **Displays:**
   - Summary statistics
   - List of students with status indicators
   - Student statuses: ON_TRACK, BEHIND, AT_RISK

3. **User Actions:**
   - Can tap student to view details
   - Can pull to refresh

### 5.2 Student Detail (`app/(after-auth)/teacher/students/[id].tsx`)

**Flow:**
1. **API Call:** `GET /api/v1/teacher/students/{id}`
   - Returns detailed student information

2. **Displays:**
   - Student name, email, status
   - Level, streak, progress
   - Current chapter
   - Quiz attempts history
   - Chapter progress

---

## 6. Data Storage

### AsyncStorage Keys:
- `authToken` - JWT authentication token
- `user` - User profile data (JSON)
- `progress` - User progress data (JSON)
- `assessmentComplete` - "true" or "false" (string)

### Zustand Stores:
- `useAuthStore` - Authentication state (token, isAuthenticated)
- `useUserStore` - User data (user object, level)
- `useProgressStore` - Progress data (currentChapterId, completedChapters, streak, etc.)

---

## 7. Current Issues & Missing Features

### ❌ **Assessment Not Implemented**
- Assessment endpoints exist in API client but may not be working
- Server may not have assessment endpoints ready
- Assessment flow may fail when trying to start assessment

### ❌ **No Chapters List Endpoint**
- Server doesn't have `GET /api/v1/chapters` endpoint
- Dashboard can't fetch all chapters to determine first/next chapter
- Dashboard tries to use stored `currentChapterId` which may be invalid

### ❌ **Dashboard API Missing**
- No `GET /api/v1/dashboard` endpoint
- Dashboard constructs data from local stores
- Can't get proper chapter progression from server

### ⚠️ **Chapter ID Format Unknown**
- Old static data used "chapter-1" format
- Server may use different ID format (e.g., "1", "ch-1", UUID, etc.)
- Need to verify correct chapter ID format from server

### ✅ **Working Features**
- Authentication (signup/login)
- Role selection (Student/Teacher)
- Teacher pending approval screen
- Chapter viewing (if valid ID)
- Quiz taking (if valid chapter/quiz IDs)
- Teacher dashboard (if API available)

---

## 8. Recommended Next Steps

1. **Fix Assessment Flow**
   - Verify assessment endpoints on server
   - Test `GET /api/v1/assessment/start`
   - Test `POST /api/v1/assessment/submit`

2. **Add Chapters List Endpoint**
   - Implement `GET /api/v1/chapters` on server
   - Update dashboard to use it
   - Determine first chapter for new users

3. **Add Dashboard Endpoint**
   - Implement `GET /api/v1/dashboard` on server
   - Return: user, progress, current chapter, next chapter, etc.

4. **Verify Chapter ID Format**
   - Check what format server uses for chapter IDs
   - Update any hardcoded references
   - Clear old invalid chapter IDs from stored progress

5. **Handle Empty States**
   - Show proper empty states when no chapters available
   - Handle case when user has no current chapter
   - Guide users to start learning

---

## 9. API Endpoints Summary

### ✅ Implemented (Client Side)
- `POST /api/v1/auth/sign-up/email` - Signup
- `POST /api/v1/auth/sign-in/email` - Login
- `POST /api/v1/auth/sign-out` - Logout
- `GET /api/v1/auth/me` - Get current user
- `GET /api/v1/chapters/{id}` - Get chapter
- `GET /api/v1/chapters/{id}/quizzes` - Get chapter quizzes
- `POST /api/v1/quizzes/{id}/submit` - Submit quiz
- `GET /api/v1/teacher/dashboard` - Teacher dashboard
- `GET /api/v1/teacher/students/{id}` - Student details
- `GET /api/v1/assessment/start` - Start assessment
- `POST /api/v1/assessment/submit` - Submit assessment

### ❌ Missing/Not Working
- `GET /api/v1/chapters` - List all chapters
- `GET /api/v1/dashboard` - Student dashboard
- Assessment endpoints (may not be implemented on server)

---

This is the current state of the project flow. The main blockers are:
1. Assessment not working
2. No chapters list endpoint
3. Dashboard trying to use invalid chapter IDs
