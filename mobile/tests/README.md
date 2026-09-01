# Apex Learn Mobile Tests

> Jest unit and integration tests for the Apex Learn mobile app

## Test Structure

```
tests/
├── unit/               # Unit tests for utilities, hooks, stores
└── integration/        # Integration tests for API client, auth flows
```

## Running Tests

```bash
cd atlas-learn-client/mobile

# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Test Examples

### Unit Tests

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

### Integration Tests

```typescript
import { describe, it, expect } from '@jest/globals';
import { apiClient } from '@/lib/api';

describe('API Client', () => {
  it('should fetch subjects', async () => {
    const subjects = await apiClient.getSubjects();
    expect(Array.isArray(subjects)).toBe(true);
  });
});
```

## What to Test

- **Utils**: Validation, formatting, cache operations
- **Stores**: User state, progress tracking, quiz state
- **Hooks**: API call handling, loading states, error states
- **API Client**: Request/response handling, auth headers, error handling
- **Components**: Rendering, user interactions, prop handling

## Guidelines

1. Use descriptive test names explaining what is being tested
2. Test both success and error cases
3. Mock external dependencies (API calls, AsyncStorage, etc.)
4. Keep tests isolated and independent
5. Use TypeScript for type safety
6. Follow the existing test patterns in the codebase

## Configuration

Jest config in `package.json`:
- Module aliases: `@/` → `./`
- Transform: Babel with Expo preset
- Test environment: Node (unit) / jsdom (components)
