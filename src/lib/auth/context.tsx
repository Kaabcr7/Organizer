"use client";

import {
  createContext,
  useContext,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authClient } from "./client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  // Use Better Auth's reactive session hook
  const { data: session, isPending } = authClient.useSession();

  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      }
    : null;

  const signUp = useCallback(
    async (email: string, password: string) => {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name: email.split("@")[0], // Default name from email
      });

      if (error) {
        throw new Error(error.message || "Sign up failed");
      }

      // requireEmailVerification is false, so signUp already establishes
      // an authenticated session — send the user straight into the app.
      router.push("/");
    },
    [router]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message || "Sign in failed");
      }

      router.push("/");
    },
    [router]
  );

  const signOut = useCallback(async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/login");
        },
      },
    });
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isPending,
        error: null,
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
