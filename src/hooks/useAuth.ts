import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { onAuthChange } from "@/lib/firebaseAuth";

/**
 * Custom hook to get current user and auth state
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      const unsubscribe = onAuthChange((authUser) => {
        setUser(authUser);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setLoading(false);
    }
  }, []);

  return { user, loading, error, isAuthenticated: !!user };
};
