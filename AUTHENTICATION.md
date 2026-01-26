# Authentication & Role-Based Management

## Overview

ATLAS uses a **token-based authentication system** with **role-based access control (RBAC)**. The authentication is handled through JWT tokens, and roles determine what features and endpoints users can access.

---

## Authentication Flow

### 1. **Token-Based Authentication**

The app uses **Bearer token authentication**:

- **Token Storage**: JWT tokens are stored in AsyncStorage under the key `authToken`
- **Token Transmission**: Tokens are sent in the `Authorization` header as `Bearer <token>`
- **Token Management**: Managed through `useAuthStore` (Zustand store)

### 2. **Authentication State Management**

**Location**: `mobile/store/auth.ts`

```typescript
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  setAuth: (token: string | null) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}
```

**Key Functions**:
- `setAuth(token)`: Sets the auth token and updates API client
- `logout()`: Calls backend sign-out endpoint and clears local token
- `loadAuth()`: Loads token from storage on app startup

### 3. **User Data Management**

**Location**: `mobile/store/user.ts`

The user object includes:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;  // STUDENT, TEACHER, or ADMIN
  school?: string;
  examYear?: number;
  level?: Level;   // FOUNDATIONAL, CORE, or ADVANCED
  createdAt: string;
}
```

---

## Role-Based Access Control (RBAC)

### 1. **User Roles**

**Location**: `mobile/services/types.ts`

```typescript
export enum UserRole {
  STUDENT = "student",
  TEACHER = "teacher",
  ADMIN = "admin",
}
```

### 2. **How Roles Work**

#### **Server-Side Authorization** (Primary)
- The **backend server** enforces role-based access control
- API endpoints check the user's role from the JWT token
- Different endpoints are accessible based on role:
  - **Students**: Can access `/chapters/*`, `/quizzes/*`, `/dashboard`
  - **Teachers**: Can access `/teacher/dashboard`, `/teacher/students/*`
  - **Admins**: Can access admin endpoints (if implemented)

#### **Client-Side Role Storage** (Secondary)
- User role is stored in the `User` object after login/signup
- Stored in Zustand store (`useUserStore`) and AsyncStorage
- Can be used for UI conditional rendering (e.g., showing teacher dashboard link)

### 3. **API Client Token Management**

**Location**: `mobile/services/api.ts`

```typescript
class APIClient {
  private token: string | null = null;
  
  setToken(token: string | null) {
    this.token = token;
  }
  
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    
    // Add Bearer token if available
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    
    // ... rest of request logic
  }
}
```

**How it works**:
1. When user logs in, `apiClient.setToken(token)` is called
2. All subsequent API requests automatically include the token
3. Server validates the token and extracts user role
4. Server returns data or 401/403 errors based on role permissions

---

## Authentication Endpoints

### Available Auth Endpoints

**Location**: `mobile/services/api.ts`

1. **Sign Up**: `POST /auth/sign-up/email`
   - Creates new user account
   - Returns: `{ token, user }`

2. **Sign In**: `POST /auth/sign-in/email`
   - Authenticates user
   - Returns: `{ token, user }`

3. **Sign Out**: `POST /auth/sign-out`
   - Invalidates token on server
   - Clears local token

4. **Get Current User**: `GET /auth/me`
   - Returns current authenticated user
   - Used to refresh user data (e.g., after assessment)

5. **Forgot Password**: `POST /auth/forgot-password`
6. **Reset Password**: `POST /auth/reset-password`
7. **Verify Email**: `POST /auth/verify-email`
8. **Resend Verification**: `POST /auth/resend-verification`

---

## Role-Based Endpoints

### Student Endpoints
- `GET /chapters/:id` - View chapter content
- `GET /chapters/:id/quiz` - Get chapter quiz
- `POST /quizzes/:id/submit` - Submit quiz answers
- `GET /dashboard` - Get student dashboard (when implemented)

### Teacher Endpoints
- `GET /teacher/dashboard` - Get teacher dashboard with student list
- `GET /teacher/students/:id` - Get student detail view

### Assessment Endpoints (All Users)
- `GET /quizzes/:assessment-quiz-id` - Get assessment questions
- `POST /quizzes/:assessment-quiz-id/submit` - Submit assessment

---

## Authentication Flow in App

### 1. **App Launch** (`app/_layout.tsx`)
```typescript
// Checks for stored token
const { isAuthenticated, loadAuth } = useAuthStore();
await loadAuth(); // Loads token from AsyncStorage
```

### 2. **Login/Signup** (`app/(auth)/index.tsx` & `signup.tsx`)
```typescript
// After successful login
const response = await apiClient.login(email, password);
setAuth(response.token);  // Store token
setUser(response.user);   // Store user (includes role)
```

### 3. **Protected Routes** (`app/(after-auth)/_layout.tsx`)
- All routes under `(after-auth)` require authentication
- Token is automatically sent with API requests
- Server validates token and role for each request

### 4. **Role-Based UI** (Future Enhancement)
Currently, role-based UI is minimal. Potential enhancements:
- Show/hide teacher dashboard link based on `user.role === UserRole.TEACHER`
- Redirect teachers to teacher dashboard on login
- Show admin panel for admins

---

## Security Notes

1. **Token Storage**: Tokens are stored in AsyncStorage (not encrypted by default)
2. **Token Validation**: Server validates tokens on every request
3. **Role Enforcement**: Server-side enforcement is primary; client-side is for UX only
4. **Token Expiration**: Handled by server (returns 401 if expired)
5. **Logout**: Calls server endpoint to invalidate token

---

## Current Implementation Status

✅ **Implemented**:
- Token-based authentication
- User role storage
- API client with automatic token injection
- Auth state management with Zustand
- Login/signup/logout flows

⚠️ **Server-Dependent**:
- Role-based endpoint access (enforced by server)
- Token validation and expiration
- User role assignment (set by server during signup)

🔮 **Potential Enhancements**:
- Client-side role-based route protection
- Role-based UI conditional rendering
- Token refresh mechanism
- Encrypted token storage
