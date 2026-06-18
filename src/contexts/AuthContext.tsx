import { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { User } from "firebase/auth";
import { onAuthChange, logoutUser } from "@/lib/firebaseAuth";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    localStorage.removeItem("rural_health_auth");
    localStorage.removeItem("rural_health_patient");
    localStorage.removeItem("rural_health_appointments");
    localStorage.removeItem("rural_health_reports");
    localStorage.removeItem("cached_doctors");
    localStorage.removeItem("cached_hospitals_map");
    localStorage.removeItem("cached_hospitals_list");
    localStorage.removeItem("userLocation");
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
