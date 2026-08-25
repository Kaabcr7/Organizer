"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const client = getClient();
        const { data } = await client.auth.getSession();
        setUser(data.session?.user ?? null);
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const client = getClient();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);

      // Redirect on sign out
      if (event === "SIGNED_OUT") {
        router.push("/auth/login");
      }
    });

    return () => subscription?.unsubscribe();
  }, [router]);

  const signUp = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const client = getClient();
      const { error: err } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (err) {
        setError(err.message);
        throw err;
      }

      // On successful signup, redirect to login (user needs to verify email)
      router.push("/auth/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const client = getClient();
      const { error: err } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (err) {
        setError(err.message);
        throw err;
      }

      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const client = getClient();
      const { error: err } = await client.auth.signOut();

      if (err) {
        setError(err.message);
        throw err;
      }

      setUser(null);
      router.push("/auth/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign out failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        signUp,
        signIn,
        signOut,
        isAuthenticated: user !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
