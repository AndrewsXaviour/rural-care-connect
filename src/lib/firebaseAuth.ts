import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  browserPopupRedirectResolver,
} from "firebase/auth";
import { auth } from "./firebase";

/**
 * Register a new user with email and password
 */
export const registerUser = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

/**
 * Login a user with email and password
 */
export const loginUser = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

/**
 * Logout the current user
 */
export const logoutUser = () => {
  return signOut(auth);
};

/**
 * Listen to auth state changes
 */
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Update user profile
 */
export const updateUserProfile = (displayName: string, photoURL?: string) => {
  if (auth.currentUser) {
    return updateProfile(auth.currentUser, {
      displayName,
      photoURL,
    });
  }
  return Promise.reject(new Error("No user logged in"));
};

/**
 * Send password reset email
 */
export const resetPassword = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

/**
 * Get current user
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Sign in with Google via Popup.
 * We rely on App.tsx and onAuthStateChanged to pick up the session.
 */
export const signInWithGoogle = () => {
  const googleProvider = new GoogleAuthProvider();
  return signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
};

/**
 * Setup reCAPTCHA for phone authentication
 */
export const setupRecaptcha = (elementId: string = "recaptcha-container") => {
  const recaptchaVerifier = new RecaptchaVerifier(auth, elementId);
  return recaptchaVerifier;
};

/**
 * Send OTP to phone number
 */
export const sendPhoneOtp = async (phoneNumber: string, appVerifier: RecaptchaVerifier) => {
  return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
};

/**
 * Verify phone OTP
 */
export const verifyPhoneOtp = (confirmationResult: ConfirmationResult, otp: string) => {
  return confirmationResult.confirm(otp);
};
