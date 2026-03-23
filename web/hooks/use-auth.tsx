"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken, getUser, clearAuth, type AuthUser } from "@/lib/auth-client";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  logout: () => {},
  refreshUser: () => {},
});

const PUBLIC_PATHS = ["/signin", "/"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(() => {
    const token = getToken();
    const u = getUser();
    if (token && u) {
      setUser(u);
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (isLoading) return;

    const isPublic = PUBLIC_PATHS.includes(pathname);

    if (!user && !isPublic && pathname !== "/onboarding") {
      router.replace("/signin");
    } else if (user && pathname === "/signin") {
      if (!user.onboardingCompleted) {
        router.replace("/onboarding");
      } else {
        router.replace("/dashboard");
      }
    } else if (user && !user.onboardingCompleted && pathname !== "/onboarding") {
      router.replace("/onboarding");
    } else if (user && user.onboardingCompleted && pathname === "/onboarding") {
      router.replace("/dashboard");
    }
  }, [user, isLoading, pathname, router]);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    router.replace("/signin");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
