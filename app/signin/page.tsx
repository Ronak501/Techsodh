"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const supabase = createClient()
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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <Card className="w-full max-w-md p-8 space-y-6 bg-zinc-900 border border-zinc-800 shadow-xl">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
          <p className="text-sm text-zinc-400">
            Sign in to your ResearchAgent account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md bg-red-500/15 text-red-400 px-3 py-2 text-sm border border-red-500/30">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-200">
            Email address
          </label>
          <Input
            type="email"
            placeholder="you@example.com"
            className="bg-black border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-200">Password</label>
          <Input
            type="password"
            placeholder="Your password"
            className="bg-black border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Button */}
        <Button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </Button>

        {/* Footer */}
        <p className="text-sm text-center text-zinc-400">
          Don’t have an account?{" "}
          <Link
            href="/signup"
            className="text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </Card>
    </div>
  );
}
