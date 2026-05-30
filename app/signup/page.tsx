"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();
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
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
      <Card className="relative w-full max-w-md space-y-6 border-border/80 p-8 shadow-xl backdrop-blur-sm">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Start using TechSodh today
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground/90">
            Full name
          </label>
          <Input
            placeholder="John Doe"
            className="bg-background"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        {/* Username */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground/90">
            Username
          </label>
          <Input
            placeholder="john_doe"
            className="bg-background"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground/90">
            Email address
          </label>
          <Input
            type="email"
            placeholder="you@example.com"
            className="bg-background"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground/90">
            Password
          </label>
          <Input
            type="password"
            placeholder="Minimum 6 characters"
            className="bg-background"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Button */}
        <Button
          onClick={handleSignUp}
          className="w-full font-medium"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </Button>

        {/* Footer */}
        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="text-primary hover:text-primary/80 underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
