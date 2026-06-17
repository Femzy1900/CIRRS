import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import authApi from '../api/authApi';

const CLIENT_URL = import.meta.env.VITE_CLIENT_URL || 'http://localhost:5173';

// Translate Firebase error codes into friendly messages
function firebaseMessage(error) {
  const map = {
    'auth/user-not-found':          'No account found with this email address.',
    'auth/wrong-password':          'Incorrect password. Please try again.',
    'auth/invalid-credential':      'Incorrect email or password.',
    'auth/email-already-in-use':    'An account with this email already exists.',
    'auth/weak-password':           'Password must be at least 6 characters.',
    'auth/invalid-email':           'Invalid email address.',
    'auth/too-many-requests':       'Too many attempts. Please try again later.',
    'auth/network-request-failed':  'Network error. Please check your connection.',
    'auth/popup-closed-by-user':    'Google sign-in was cancelled.',
    'auth/cancelled-popup-request': 'Only one sign-in popup is allowed at a time.',
    'auth/user-disabled':           'This account has been disabled.',
    // Google / OAuth specific
    'auth/operation-not-allowed':   'Google sign-in is not enabled. Please contact support.',
    'auth/popup-blocked':           'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.',
    'auth/unauthorized-domain':     'This domain is not authorised for sign-in. Please contact support.',
    'auth/internal-error':          'An internal error occurred. Please try again.',
    'auth/expired-action-code':     'This link has expired. Please request a new one.',
    'auth/invalid-action-code':     'This link is invalid or has already been used.',
  };
  return map[error.code] || error.message || 'Something went wrong. Please try again.';
}

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // ── Register with email + password ──────────────────────────────
      register: async ({ fullName, username, email, password }) => {
        set({ loading: true, error: null });
        try {
          // 1. Create Firebase account
          const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);

          // 2. Set display name on Firebase profile
          await firebaseUpdateProfile(fbUser, { displayName: fullName });

          // 3. Create MongoDB user record immediately (before email verification)
          await authApi.syncUser({ fullName, username });

          // 4. Send verification email — Firebase verifies on its own domain then redirects to continueUrl
          await sendEmailVerification(fbUser, {
            url: `${CLIENT_URL}/login?verified=true`,
          });

          // 5. Sign out — user must verify email before accessing the app
          await signOut(auth);

          set({ loading: false });
          return { success: true };
        } catch (err) {
          const message = firebaseMessage(err);
          set({ error: message, loading: false });
          throw err;
        }
      },

      // ── Login with email + password ─────────────────────────────────
      login: async ({ email, password }) => {
        set({ loading: true, error: null });
        try {
          const { user: fbUser } = await signInWithEmailAndPassword(auth, email, password);

          if (!fbUser.emailVerified) {
            await signOut(auth);
            const msg = 'Please verify your email first. Check your inbox for the verification link.';
            set({ error: msg, loading: false });
            throw new Error(msg);
          }

          // Sync with MongoDB and retrieve user data
          const data = await authApi.syncUser();
          set({ user: data.data, isAuthenticated: true, loading: false });
          return data;
        } catch (err) {
          if (!err.message?.includes('verify')) {
            set({ error: firebaseMessage(err), loading: false });
          }
          throw err;
        }
      },

      // ── Login with Google ───────────────────────────────────────────
      loginWithGoogle: async () => {
        set({ loading: true, error: null });
        try {
          const { user: fbUser } = await signInWithPopup(auth, googleProvider);

          // Google accounts are always verified; sync to MongoDB
          const data = await authApi.syncUser({ fullName: fbUser.displayName });
          set({ user: data.data, isAuthenticated: true, loading: false });
          return data;
        } catch (err) {
          // If popup was blocked, fall back to redirect-based sign-in
          if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
            set({ loading: false, error: null });
            await signInWithRedirect(auth, googleProvider);
            return; // page will reload after redirect
          }
          // Include the raw error code in the message so it's visible even without DevTools
          const friendly = firebaseMessage(err);
          const withCode = err.code ? `${friendly} [${err.code}]` : friendly;
          set({ error: withCode, loading: false });
          throw err;
        }
      },

      // ── Handle Google redirect result (called on mount after redirect) ─
      handleGoogleRedirect: async () => {
        try {
          const result = await getRedirectResult(auth);
          if (!result) return null; // no redirect result pending
          const { user: fbUser } = result;
          const data = await authApi.syncUser({ fullName: fbUser.displayName });
          set({ user: data.data, isAuthenticated: true, loading: false });
          return data;
        } catch (err) {
          set({ error: firebaseMessage(err), loading: false });
          return null;
        }
      },

      // ── Resend verification email (used from login page before user is in our app) ─
      resendVerificationEmail: async (email, password) => {
        set({ loading: true, error: null });
        try {
          // Sign in to Firebase temporarily just to get the user object
          const { user: fbUser } = await signInWithEmailAndPassword(auth, email, password);
          if (fbUser.emailVerified) {
            // Already verified — just log in properly
            await signOut(auth);
            set({ loading: false });
            return { alreadyVerified: true };
          }
          await sendEmailVerification(fbUser, {
            url: `${CLIENT_URL}/login?verified=true`,
          });
          // Sign out again — don't grant app access yet
          await signOut(auth);
          set({ loading: false });
          return { success: true };
        } catch (err) {
          set({ error: firebaseMessage(err), loading: false });
          throw err;
        }
      },

      // ── Forgot password — Firebase sends the reset email ────────────
      forgotPassword: async (email) => {
        set({ loading: true, error: null });
        try {
          await sendPasswordResetEmail(auth, email, { url: `${CLIENT_URL}/login` });
          set({ loading: false });
          return { success: true };
        } catch (err) {
          set({ error: firebaseMessage(err), loading: false });
          throw err;
        }
      },

      // ── Logout ──────────────────────────────────────────────────────
      logout: async () => {
        try {
          await signOut(auth);
        } finally {
          set({ user: null, isAuthenticated: false });
        }
      },

      // ── Update profile (MongoDB + Firebase display name) ────────────
      updateProfile: async (profileData) => {
        set({ loading: true, error: null });
        try {
          const data = await authApi.updateProfile(profileData);
          set({ user: data.data, loading: false });
          return data;
        } catch (err) {
          const message = err.response?.data?.message || 'Failed to update profile';
          set({ error: message, loading: false });
          throw err;
        }
      },

      // ── Delete account (Firebase + MongoDB) ─────────────────────────
      deleteAccount: async () => {
        try {
          await authApi.deleteAccount();
        } finally {
          set({ user: null, isAuthenticated: false });
        }
      },

      // ── On app mount: check Firebase auth state ─────────────────────
      checkAuth: async () => {
        set({ loading: true });
        return new Promise((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            unsubscribe(); // one-time check on mount
            if (fbUser && fbUser.emailVerified) {
              try {
                const data = await authApi.syncUser();
                set({ user: data.data, isAuthenticated: true, loading: false });
              } catch {
                set({ user: null, isAuthenticated: false, loading: false });
              }
            } else {
              set({ user: null, isAuthenticated: false, loading: false });
            }
            resolve();
          });
        });
      },

      setError: (error) => set({ error }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Clear auth state on 401
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.getState().logout();
  });
}

export default useAuthStore;
