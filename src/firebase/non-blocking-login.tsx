
'use client';
import {
  Auth, 
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { errorEmitter } from './error-emitter';

function handleAuthError(error: any) {
    if (error instanceof FirebaseError) {
        // Here you could emit a more specific error or handle it
        console.error("Auth Error:", error.code, error.message);
    } else {
        console.error("An unexpected error occurred during authentication:", error);
    }
    // You could potentially throw a custom, serializable error here
    // for the global error boundary to catch.
}


/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch(handleAuthError);
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password).catch(handleAuthError);
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password).catch(handleAuthError);
}

/** Initiate sign-out (non-blocking). */
export function initiateSignOut(authInstance: Auth): void {
    signOut(authInstance).catch(handleAuthError);
}
