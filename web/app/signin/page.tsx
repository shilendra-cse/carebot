"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { useAuth } from "@/hooks/use-auth";
import { Bot } from "lucide-react";

export default function SignInPage() {
  const { refreshUser, isLoading: authLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(name, email, password);
      } else {
        await signIn(email, password);
      }
      refreshUser();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full h-full items-center justify-center gap-4 p-4">
      <div className="hidden md:flex flex-col shadow-2xl bg-card items-center justify-center w-2xl border h-full rounded-lg gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
          <Bot className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-semibold">CareBot</h1>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Your all-in-one health companion — track, analyze, and understand your health through conversation.
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center gap-6 p-6">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-xl font-semibold">
            {isSignUp ? "Create an account" : "Welcome back"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSignUp
              ? "Sign up to start tracking your health"
              : "Sign in to your CareBot account"}
          </p>
        </div>

        {error && (
          <div className="w-full max-w-sm bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-sm">
          {isSignUp && (
            <Input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          )}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={loading}
          />
          <Button type="submit" size="lg" disabled={loading} className="w-full mt-1">
            {loading
              ? "Please wait..."
              : isSignUp
                ? "Create Account"
                : "Sign In"}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-primary underline underline-offset-4 hover:opacity-80"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
