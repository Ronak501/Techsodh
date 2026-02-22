"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient()
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!fullName || !username || !email || !password) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username,
        },
      },
    });

    if (authError || !data.user) {
      setError(authError?.message || "Signup failed");
      setLoading(false);
      return;
    }

    router.push("/signin");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <Card className="w-full max-w-md p-8 space-y-6 bg-zinc-900 border border-zinc-800 shadow-xl">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-white">
            Create your account
          </h1>
          <p className="text-sm text-zinc-400">
            Start using ResearchAgent today
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md bg-red-500/15 text-red-400 px-3 py-2 text-sm border border-red-500/30">
            {error}
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-200">Full name</label>
          <Input
            placeholder="John Doe"
            className="bg-black border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        {/* Username */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-200">Username</label>
          <Input
            placeholder="john_doe"
            className="bg-black border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

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
            placeholder="Minimum 6 characters"
            className="bg-black border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Button */}
        <Button
          onClick={handleSignUp}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </Button>

        {/* Footer */}
        <p className="text-sm text-center text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
