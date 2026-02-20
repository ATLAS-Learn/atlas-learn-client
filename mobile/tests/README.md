# Testing Guide

This directory contains tests for the ATLAS mobile application.

## Test Structure

```
tests/
├── unit/           # Unit tests for utilities, hooks, and stores
├── integration/    # Integration tests for API client and flows
└── components/     # Component tests for UI components
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Test Examples

### Unit Tests
- `lib/utils/validate.test.ts` - Validation utility tests
- `lib/store/auth.test.ts` - Auth store tests
- `lib/hooks/api/useAuth.test.ts` - Auth hook tests

### Integration Tests
- `lib/api/client.test.ts` - API client tests
- `app/(auth)/index.test.tsx` - Login flow tests

### Component Tests
- `components/quizzes/question-card.test.tsx` - Question card component tests

## Writing Tests

Follow these guidelines:
1. Use descriptive test names that explain what is being tested
2. Test both success and error cases
3. Mock external dependencies (API calls, storage, etc.)
4. Keep tests isolated and independent
5. Use TypeScript for type safety

## Example Test

```typescript
import { describe, it, expect } from '@jest/globals';
import { validateFields } from '@/lib/utils/validate';

describe('validateFields', () => {
  it('should return empty object for valid fields', () => {
    const result = validateFields({
      email: 'test@example.com',
      password: 'password123'
    });
    expect(result).toEqual({});
  });

  it('should return errors for invalid email', () => {
    const result = validateFields({
      email: 'invalid-email',
      password: 'password123'
    });
    expect(result.email).toBeDefined();
  });
});
```
