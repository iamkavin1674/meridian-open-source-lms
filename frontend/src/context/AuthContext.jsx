import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import * as authApi from "../api/auth";
import { TOKEN_STORAGE_KEY, getStoredToken } from "../api/client";

const AuthContext = createContext(null);

function storeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode): session simply won't persist.
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(Boolean(getStoredToken()));
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const logout = useCallback(() => {
    storeToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const establishSession = useCallback(async (accessToken) => {
    storeToken(accessToken);
    setToken(accessToken);
    try {
      const profile = await authApi.fetchMe(accessToken);
      setUser(profile);
      return profile;
    } catch {
      // Token is valid enough to keep; profile can be retried by the UI.
      setUser(null);
      return null;
    }
  }, []);

  // Verify a persisted token once on load.
  useEffect(() => {
    const stored = getStoredToken();
    if (!stored) {
      setInitializing(false);
      return;
    }
    let cancelled = false;
    authApi
      .fetchMe(stored)
      .then((profile) => {
        if (!cancelled) setUser(profile);
      })
      .catch((error) => {
        if (!cancelled && error?.status === 401) logout();
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = useCallback(
    async (email, password) => {
      const data = await authApi.loginUser({ email, password });
      await establishSession(data.access_token);
      return data;
    },
    [establishSession]
  );

  const loginWithTokenResponse = useCallback(
    async (data) => {
      if (!data?.access_token) return null;
      await establishSession(data.access_token);
      return data;
    },
    [establishSession]
  );

  const register = useCallback(
    async ({ full_name, email, password }) => {
      const data = await authApi.registerUser({ full_name, email, password });
      // Our API returns the created user (no token); if a future version
      // returns access_token, sign in immediately as the spec requires.
      if (data?.access_token) await establishSession(data.access_token);
      return data;
    },
    [establishSession]
  );

  const googleLogin = useCallback(
    async (idToken) => {
      const data = await authApi.googleLogin(idToken);
      await establishSession(data.access_token);
      return data;
    },
    [establishSession]
  );

  const value = useMemo(
    () => ({
      token,
      user,
      initializing,
      isAuthenticated: Boolean(token),
      login,
      register,
      googleLogin,
      loginWithTokenResponse,
      logout,
    }),
    [token, user, initializing, login, register, googleLogin, loginWithTokenResponse, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
