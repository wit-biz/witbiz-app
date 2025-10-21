
'use client';

import { useFirebase } from '@/firebase/provider';
import { UserHookResult } from '@/firebase/provider';

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserAuthHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError, auth } = useFirebase();
  return { user, isUserLoading, userError, auth };
};
