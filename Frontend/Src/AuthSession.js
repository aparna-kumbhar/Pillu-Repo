/**
 * AuthSession.js
 * Centralized JWT session management for all user roles.
 * Persists token across app restarts using AsyncStorage.
 * Token only cleared on explicit logout (not on refresh).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_jwt_token';
const SESSION_KEY = 'auth_session_data';

/**
 * Save the JWT token and session data after login.
 * @param {string} token - JWT token from backend
 * @param {object} sessionData - { role, user, instituteId, ... }
 */
export const saveSession = async (token, sessionData) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } catch (err) {
    console.error('[AuthSession] Failed to save session:', err);
  }
};

/**
 * Retrieve the saved JWT token.
 * @returns {string|null}
 */
export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (err) {
    console.error('[AuthSession] Failed to get token:', err);
    return null;
  }
};

/**
 * Retrieve saved session data (role, user object, etc.)
 * @returns {object|null}
 */
export const getSession = async () => {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('[AuthSession] Failed to get session:', err);
    return null;
  }
};

/**
 * Check if user is currently logged in (has valid, non-expired token).
 * @returns {{ valid: boolean, session: object|null, token: string|null }}
 */
export const checkSession = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    const session = raw ? JSON.parse(raw) : null;

    if (!token || !session) {
      return { valid: false, session: null, token: null };
    }

    // Decode the JWT payload (without verifying — server verifies)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, session: null, token: null };
    }

    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      // Token expired — clear session
      await clearSession();
      return { valid: false, session: null, token: null };
    }

    return { valid: true, session, token };
  } catch (err) {
    console.error('[AuthSession] checkSession error:', err);
    return { valid: false, session: null, token: null };
  }
};

/**
 * Clear session on explicit logout (called by Logout button in sidebars).
 */
export const clearSession = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (err) {
    console.error('[AuthSession] Failed to clear session:', err);
  }
};
