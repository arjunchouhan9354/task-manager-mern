import { createContext, useContext, useEffect, useState } from "react";
import { getMeApi, loginApi, logoutApi, registerApi } from "../api/auth";

const AuthContext = createContext(null);

// Keeps the logged-in user in one place so every page can use it.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On page load, ask the server who is logged in (the browser sends the cookie automatically).
  useEffect(() => {
    getMeApi()
      .then((me) => setUser(me))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const me = await loginApi(email, password);
    setUser(me);
    return me;
  };

  const register = async (name, email, password) => {
    const me = await registerApi(name, email, password);
    setUser(me);
    return me;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
