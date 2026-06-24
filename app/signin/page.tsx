"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

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
            AI-Powered Research Platform
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-balance">
            Research smarter, write clearer, decide faster.
          </h1>
          <p className="text-lg leading-relaxed text-background/70">
            From literature retrieval to human-friendly reports — all in one place.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: "Report turnaround", value: "~40 sec" },
              { label: "Sources per report", value: "Structured" },
              { label: "Writing mode", value: "Human tone" },
              { label: "Collaboration", value: "Chat + export" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-background/15 bg-background/10 p-4">
                <p className="text-xs uppercase tracking-wider text-background/50">{stat.label}</p>
                <p className="mt-1 text-base font-semibold">{stat.value}</p>
              </div>
            ))}
          </div>
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
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to your Techsodh account to continue.</p>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-4">
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Password</label>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Your password"
                  className="h-11 pl-10 rounded-xl bg-background"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="current-password"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleLogin}
            className="w-full h-11 rounded-xl font-semibold text-base gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-foreground hover:underline underline-offset-4">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
