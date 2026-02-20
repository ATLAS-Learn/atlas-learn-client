# ATLAS Learn Mobile – Requirements & Setup

This document lists everything required for the app to run end-to-end: environment variables, backend API contracts, and key flows (including the onboarding assessment).

---

## 1. Environment Variables

All env vars are read via `process.env` in the Expo app. Use a `.env` file in the `mobile/` directory (and/or Expo’s env handling). **Every variable below is required** unless marked optional.

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | **Yes** | Base URL of the backend API. All API requests are sent to `{EXPO_PUBLIC_API_URL}{endpoint}` (e.g. `https://api.example.com` or `https://api.example.com/api/v1`). | `https://api.example.com` |

**Where used:** `mobile/lib/constants/api.ts`

**Example `.env` in `mobile/`:**

```env
EXPO_PUBLIC_API_URL=https://your-api.example.com
```

---

## 2. Backend API Endpoints

The client assumes the following endpoints exist and follow the request/response shapes below. Base path is whatever you set in `EXPO_PUBLIC_API_URL` (e.g. if base is `https://api.example.com/api/v1`, then “Auth” means `https://api.example.com/api/v1/auth/...`).

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/sign-up/email` | Register: name, email, password (role defaults to student). |
| `POST` | `/auth/sign-in/email` | Legacy email+password login (optional if using OTP only). |
| `POST` | `/auth/request-otp` | Send OTP to email for login. Body: `{ "email": "..." }`. |
| `POST` | `/auth/verify-otp-login` | Verify OTP and return token + user. Body: `{ "email": "...", "otp": "..." }`. |
| `POST` | `/auth/sign-out` | Invalidate current token. |
| `GET` | `/auth/me` | Return current user (Bearer token). |
| `POST` | `/auth/forgot-password` | Body: `{ "email": "..." }`. |
| `POST` | `/auth/reset-password` | Body: `{ "token": "...", "password": "..." }`. |
| `POST` | `/auth/verify-email` | Body: `{ "code": "..." }`. |
| `POST` | `/auth/resend-verification` | Resend email verification. |
| `POST` | `/auth/request-role-upgrade` | Student requests teacher role. Returns `{ message, status: "pending" \| "approved" \| "rejected" }`. |

### Assessment (Onboarding)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/assessment/start` | Start assessment; returns array of 5 `AssessmentQuestion`. |
| `POST` | `/assessment/submit` | Submit answers. Body: `{ answers: [{ questionId, answerIndex }] }`. Returns `AssessmentResult`. |
| `GET` | `/assessment/result` | Get last assessment result (optional). |
| `GET` | `/assessment/status` | Returns `{ completed: boolean, level?: Level }` (optional). |

### Other (Chapters, Quizzes, Teacher)

- Chapters: `GET /chapters`, `GET /chapters/:id`, `GET /chapters/:id/quizzes`, etc.
- Quizzes: `GET /quizzes`, `GET /quizzes/:id`, `POST /quizzes/:id/submit`, etc.
- Teacher: `GET /teacher/dashboard`, `GET /teacher/students/:id`.

---

## 3. Onboarding Assessment (Mandatory After First Login)

**Yes, it is present and wired as a mandatory post-login step.**

### Flow

1. **First login (or signup)**  
   User signs in (e.g. OTP or password) or signs up.

2. **Root layout** (`app/_layout.tsx`)  
   - If not authenticated → `(auth)` (login/signup).  
   - If authenticated and **assessment not complete** → `(onboarding)`.  
   - If authenticated and **assessment complete** → `(tabs)` (main app).

3. **Onboarding**  
   - `(onboarding)/index` – intro screen: “We’ll ask you 5 questions…”.  
   - User taps “Start Assessment” → `(onboarding)/assessment`.

4. **Assessment**  
   - **5 questions** loaded from `GET /assessment/start`.  
   - User answers all 5, then submits via `POST /assessment/submit`.  
   - Backend returns **level** and result.

5. **Result**  
   - `(onboarding)/assessment-result`: shows score, **level**, and message.  
   - **Level** is one of:
     - **Beginner** → `Level.FOUNDATIONAL` (`"beginner"`)
     - **Intermediate** → `Level.CORE` (`"intermediate"`)
     - **Advanced** → `Level.ADVANCED` (`"advanced"`)
   - Result screen updates user level in the app and sets `assessmentComplete` in local storage, then navigates to `(tabs)`.

6. **Next launches**  
   - `assessmentComplete === "true"` → user goes straight to `(tabs)`; assessment is not shown again.

### Where it’s implemented

- **Routing:** `mobile/app/_layout.tsx` (auth → onboarding vs tabs).  
- **Intro:** `mobile/app/(onboarding)/index.tsx` (“5 questions”, “Start Assessment”).  
- **Quiz:** `mobile/app/(onboarding)/assessment.tsx` (load questions, submit, navigate to result).  
- **Result & level:** `mobile/app/(onboarding)/assessment-result.tsx` (level badge, “Continue to Dashboard”, `setItem("assessmentComplete", "true")`).  
- **Level labels:** `mobile/lib/constants/levels.ts` (Foundational / Core / Advanced).  
- **Flow hook:** `mobile/hooks/useAppFlow.ts` (reads `assessmentComplete` from storage).

So: **after first login, the 5-question assessment is mandatory**, and the **result sets user level (Beginner / Intermediate / Advanced) and starting recommendations** (via level and the content shown in the main app).

---

## 4. Summary Checklist

- [ ] Set `EXPO_PUBLIC_API_URL` in `mobile/.env`.
- [ ] Backend implements auth endpoints (sign-up, OTP request/verify, sign-out, me, etc.).
- [ ] Backend implements `/assessment/start` (5 questions) and `/assessment/submit` (returns level).

Onboarding assessment: **present and required after first login;** result drives user level (Beginner / Intermediate / Advanced) and starting experience.
