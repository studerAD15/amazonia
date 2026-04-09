import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import { axiosInstance, setUnauthorizedHandler } from "../api/axiosInstance";

const AuthContext = createContext(null);

function normalizeRole(role) {
  if (role === "viewer") return "customer";
  if (role === "editor") return "seller";
  if (role === "admin" || role === "seller" || role === "customer") return role;
  return "customer";
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem("authUser");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { ...parsed, role: normalizeRole(parsed?.role) };
  } catch {
    localStorage.removeItem("authUser");
    localStorage.removeItem("authToken");
    return null;
  }
}

const initialState = {
  user: readStoredUser(),
  token: localStorage.getItem("authToken"),
  isLoading: true
};

function reducer(state, action) {
  switch (action.type) {
    case "LOGIN":
      return { ...state, user: action.payload.user, token: action.payload.token, isLoading: false };
    case "LOGOUT":
      return { ...state, user: null, token: null, isLoading: false };
    case "READY":
      return { ...state, isLoading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const login = useCallback((payload) => {
    const normalizedUser = { ...payload.user, role: normalizeRole(payload.user?.role) };
    localStorage.setItem("authToken", payload.token);
    localStorage.setItem("authUser", JSON.stringify(normalizedUser));
    dispatch({ type: "LOGIN", payload: { ...payload, user: normalizedUser } });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    dispatch({ type: "LOGOUT" });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      window.location.assign("/login");
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    async function bootstrap() {
      if (!localStorage.getItem("authToken")) {
        dispatch({ type: "READY" });
        return;
      }
      try {
        const res = await axiosInstance.get("/api/auth/me");
        dispatch({
          type: "LOGIN",
          payload: {
            token: localStorage.getItem("authToken"),
            user: {
              id: res.data.user._id,
              name: res.data.user.name,
              email: res.data.user.email,
              role: normalizeRole(res.data.user.role)
            }
          }
        });
      } catch {
        logout();
      }
    }
    bootstrap();
  }, [logout]);

  const value = useMemo(
    () => ({
      user: state.user,
      token: state.token,
      login,
      logout,
      isAuthenticated: Boolean(state.token),
      isLoading: state.isLoading
    }),
    [state.user, state.token, state.isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
