# API Updates Summary

## Assessment Endpoints Updated

The assessment system has been updated to use the dedicated assessment endpoints instead of the quiz-based approach.

### New Endpoints

1. **Start Assessment** - `GET /api/v1/assessment/start`
   - Gets initial assessment questions
   - Replaces: `GET /api/v1/quizzes/{assessment-quiz-id}`

2. **Submit Assessment** - `POST /api/v1/assessment/submit`
   - Submits assessment answers
   - Replaces: `POST /api/v1/quizzes/{assessment-quiz-id}/submit`

3. **Get Assessment Result** - `GET /api/v1/assessment/result`
   - Gets assessment result after submission
   - New endpoint

4. **Get Assessment Status** - `GET /api/v1/assessment/status`
   - Checks if assessment is completed
   - Returns: `{ completed: boolean; level?: Level }`
   - New endpoint

### Code Changes

**File: `mobile/services/api.ts`**
- Updated `getAssessmentQuestions()` to call `startAssessment()`
- Added `startAssessment()` method
- Updated `submitAssessment()` to use `/assessment/submit` endpoint
- Added `getAssessmentResult()` method
- Added `getAssessmentStatus()` method

**File: `mobile/app/(onboarding)/assessment.tsx`**
- Updated to use `apiClient.startAssessment()` instead of `getAssessmentQuestions()`

### Backward Compatibility

The `getAssessmentQuestions()` method still exists and calls `startAssessment()` internally for backward compatibility.

## Chapter and Quiz Endpoints Updated

All chapter and quiz endpoints have been updated to match the new API structure.

### Chapter Quiz Endpoints

1. **Get Chapter Quizzes** - `GET /api/v1/chapters/{chapterId}/quizzes`
   - Get all quizzes for a chapter
   - Returns: `Quiz[]`

2. **Get Chapter Quiz** - `GET /api/v1/chapters/{chapterId}/quizzes` (first quiz)
   - Backward compatible method that returns the first quiz
   - Returns: `Quiz`

3. **Create Chapter Quiz** - `POST /api/v1/chapters/{chapterId}/quizzes`
   - Create a new quiz with questions for a chapter
   - Returns: `Quiz`

### Quiz Endpoints

1. **Get Quiz** - `GET /api/v1/quizzes/{quizId}`
   - Get a quiz by ID
   - Returns: `Quiz`

2. **Update Quiz** - `PUT /api/v1/quizzes/{quizId}`
   - Update a quiz
   - Returns: `Quiz`

3. **Delete Quiz** - `DELETE /api/v1/quizzes/{quizId}`
   - Delete a quiz
   - Returns: `void`

4. **Add Quiz Question** - `POST /api/v1/quizzes/{quizId}/questions`
   - Add a question to a quiz
   - Returns: Question object

5. **Update Quiz Question** - `PUT /api/v1/quizzes/{quizId}/questions/{questionId}`
   - Update a question in a quiz
   - Returns: Question object

6. **Delete Quiz Question** - `DELETE /api/v1/quizzes/{quizId}/questions/{questionId}`
   - Delete a question from a quiz
   - Returns: `void`

7. **Submit Quiz** - `POST /api/v1/quizzes/{quizId}/submit`
   - Submit quiz answers and get score
   - Returns: `QuizResult`

8. **Get Quiz Attempts** - `GET /api/v1/quizzes/{quizId}/attempts`
   - Get all attempts for a quiz
   - Returns: `QuizAttempt[]`

9. **Get User Quiz Attempts** - `GET /api/v1/users/{userId}/quiz-attempts`
   - Get all quiz attempts by a user
   - Returns: `QuizAttempt[]`

10. **Get Quiz Stats** - `GET /api/v1/quizzes/{quizId}/stats`
    - Get statistics for a quiz
    - Returns: `QuizStats`

### New Type Definitions

Added new types for better type safety:

```typescript
export interface QuizAttempt {
    id: string;
    quizId: string;
    userId: string;
    score: number;
    percentage: number;
    passed: boolean;
    completedAt: string;
    answers?: { questionId: string; answerIndex: number }[];
}

export interface QuizStats {
    quizId: string;
    totalAttempts: number;
    averageScore: number;
    averagePercentage: number;
    passRate: number;
    totalUsers: number;
    attempts: QuizAttempt[];
}
```

### Code Changes

**File: `mobile/services/api.ts`**
- Updated `getChapterQuiz()` to use `/chapters/{chapterId}/quizzes` and return first quiz
- Added `getChapterQuizzes()` to get all quizzes for a chapter
- Added `createChapterQuiz()` to create a new quiz
- Added `updateQuiz()`, `deleteQuiz()` methods
- Added quiz question management methods: `addQuizQuestion()`, `updateQuizQuestion()`, `deleteQuizQuestion()`
- Added `getQuizAttempts()`, `getUserQuizAttempts()`, `getQuizStats()` methods

**File: `mobile/services/types.ts`**
- Enhanced `QuizAttempt` interface with `userId` and optional `answers`
- Added `QuizStats` interface for quiz statistics

### Chapter Endpoint Issue

The error `GET https://atlas-learn-server.onrender.com/api/v1/chapters/chapter-1` returns 404.

**Possible causes:**
1. The chapter ID format might be incorrect (should it be `chapter-1` or just `1`?)
2. The chapter might not exist in the database
3. The endpoint path might need adjustment

**Current implementation:**
```typescript
async getChapter(chapterId: string): Promise<Chapter> {
    return this.request<Chapter>(`/chapters/${chapterId}`);
}
```

This constructs: `${API_BASE_URL}/chapters/${chapterId}`

If `API_BASE_URL` is `https://atlas-learn-server.onrender.com/api/v1`, then the full URL would be:
`https://atlas-learn-server.onrender.com/api/v1/chapters/chapter-1`

**To fix:**
- Verify the chapter ID format expected by the backend
- Check if chapters exist in the database
- Verify the API base URL includes `/api/v1` or if endpoints need to include it

## Storage Clearing

See `CLEAR_STORAGE.md` for detailed instructions on clearing all stored user data.

**Quick method:**
```typescript
import { clearAllStorage } from '@/utils/clearStorage';
await clearAllStorage();
```

This clears:
- Authentication token
- User data
- Progress data
- Assessment completion status
- Onboarding completion status
