# How to Clear All Stored User Data

This guide explains how to clear all stored user data from the app, which is useful for:
- Starting fresh during development
- Testing registration flows
- Resetting app state

## Method 1: Using the Utility Function (Recommended)

Import and use the `clearAllStorage` function in your code:

```typescript
import { clearAllStorage } from '@/utils/clearStorage';

// Clear all storage
await clearAllStorage();
```

This will clear:
- ✅ Authentication token (`authToken`)
- ✅ User data (`user`)
- ✅ Progress data (`progress`)
- ✅ Assessment completion status (`assessmentComplete`)
- ✅ Onboarding completion status (`onboardingComplete`)

## Method 2: Using AsyncStorage Directly

If you need to clear everything (more aggressive):

```typescript
import { clearAllAsyncStorage } from '@/utils/clearStorage';

// Clear ALL AsyncStorage (everything)
await clearAllAsyncStorage();
```

## Method 3: Manual Clearing via Code

You can also manually clear specific items:

```typescript
import { removeItem } from '@/utils/storage';
import { useAuthStore } from '@/store/auth';
import { useUserStore } from '@/store/user';
import { useProgressStore } from '@/store/progress';

// Clear individual items
await removeItem('authToken');
await removeItem('user');
await removeItem('progress');
await removeItem('assessmentComplete');
await removeItem('onboardingComplete');

// Clear stores
const { logout } = useAuthStore.getState();
const { clearUser } = useUserStore.getState();
const { clearProgress } = useProgressStore.getState();

await logout();
await clearUser();
await clearProgress();
```

## Method 4: Using React Native Debugger / DevTools

If you have React Native Debugger or similar tools, you can also clear AsyncStorage through the console:

```javascript
// In React Native Debugger console
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.clear();
```

## Quick Test Command

To quickly test clearing storage, you can add this to any screen temporarily:

```typescript
import { clearAllStorage } from '@/utils/clearStorage';
import { useRouter } from 'expo-router';

// In a button handler or useEffect
const handleClearStorage = async () => {
  try {
    await clearAllStorage();
    Alert.alert('Success', 'All storage cleared!');
    router.replace('/(auth)');
  } catch (error) {
    Alert.alert('Error', 'Failed to clear storage');
  }
};
```

## Storage Keys Used

The app stores data under these keys:
- `authToken` - JWT authentication token
- `user` - User profile data (JSON stringified)
- `progress` - User progress data (JSON stringified)
- `assessmentComplete` - Assessment completion flag ("true"/"false")
- `onboardingComplete` - Onboarding completion flag ("true"/"false")
