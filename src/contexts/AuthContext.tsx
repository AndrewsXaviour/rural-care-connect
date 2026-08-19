import { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { User } from "firebase/auth";
import { onAuthChange, logoutUser } from "@/lib/firebaseAuth";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  demoLogin: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  logout: async () => {},
  demoLogin: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const demoLogin = useCallback(() => {
    setUser({
      uid: "demo-user-123",
      email: "demo@ruralcare.in",
      displayName: "Asha Worker (Demo)",
      phoneNumber: "+919876543210",
      photoURL: null,
    } as unknown as User);
    localStorage.setItem("rural_health_demo_auth", "true");
  }, []);

  useEffect(() => {
    // SUPPRESS LOGIN: Force demo mode unconditionally for demo purposes
    const DEMO_MODE = true;
    
    if (DEMO_MODE || localStorage.getItem("rural_health_demo_auth") === "true") {
      demoLogin();
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onAuthChange((authUser) => {
      // In demo mode, if authUser is null but we navigated to a private route, 
      // we can let the router handle it or set a dummy user.
      // But for now, just pass the Firebase state.
      setUser(authUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [demoLogin]);

  const logout = useCallback(async () => {
    if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== "AIzaSyDummyKeyForTestingDoNotUse1234567") {
      await logoutUser();
    } else {
      // Demo Mode logout
      setUser(null);
    }
    localStorage.removeItem("rural_health_demo_auth");
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
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, logout, demoLogin }}>
      {children}
    </AuthContext.Provider>
  );
};
