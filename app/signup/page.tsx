"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Mail, Lock, User, AtSign, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!fullName || !username || !email || !password) {
      setError("All fields are required");
      toast.error("All fields are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username,
        },
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    });

    if (authError || !data.user) {
      const msg = authError?.message || "Signup failed. Please try again.";
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    // If email confirmation is disabled, redirect directly to dashboard
    if (data.session) {
      toast.success("Account created! Redirecting...");
      router.push("/dashboard");
      router.refresh();
    } else {
      // Show success message - email confirmation required
      toast.success("Account created! Check your email to confirm.");
      setSuccess(true);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSignUp();
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Check your email</h2>
          <p className="text-muted-foreground leading-relaxed">
            We sent a confirmation link to <span className="font-semibold text-foreground">{email}</span>.
            Click the link to activate your account and start researching.
          </p>
          <Button asChild className="w-full h-11 rounded-xl">
            <Link href="/signin">Back to Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-foreground text-background p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background/10 backdrop-blur">
            <BookOpen className="h-5 w-5 text-background" />
          </div>
          <span className="text-xl font-bold tracking-tight">Techsodh</span>
        </div>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/10 px-4 py-2 text-sm">
            <Sparkles className="h-4 w-4" />
            Join thousands of researchers
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-balance">
            Your AI research co-pilot starts here.
          </h1>
          <p className="text-lg leading-relaxed text-background/70">
            Create structured research, humanize outputs, and collaborate — all in one workspace.
          </p>

          <ul className="space-y-3 pt-2">
            {[
              "AI-generated reports with cited sources",
              "Human-tone writing that reads naturally",
              "Threaded chat per research topic",
              "PDF and Markdown export",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-background/80">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background/20">
                  <CheckCircle2 className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-background/40">
          &copy; {new Date().getFullYear()} Techsodh. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Techsodh</span>
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Create your account</h2>
            <p className="text-muted-foreground">Start using Techsodh for free today.</p>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl font-medium gap-3"
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground">or sign up with email</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full name</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="John Doe"
                  className="h-11 pl-10 rounded-xl bg-background"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <div className="relative">
                <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="john_doe"
                  className="h-11 pl-10 rounded-xl bg-background"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                  onKeyDown={handleKeyDown}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="h-11 pl-10 rounded-xl bg-background"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Minimum 6 characters"
                  className="h-11 pl-10 rounded-xl bg-background"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSignUp}
            className="w-full h-11 rounded-xl font-semibold text-base gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/signin" className="font-semibold text-foreground hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
