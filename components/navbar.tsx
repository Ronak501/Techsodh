"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  BookOpen,
  User,
  LogOut,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";
import { FaDiscord, FaXTwitter } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/utils/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    void getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    router.push("/signin");
    router.refresh();
  };

  const initials = user?.user_metadata?.full_name
    ? (user.user_metadata.full_name as string)
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() ?? "U");

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/research", label: "Research" },
    { href: "/humanizer", label: "Humanizer" },
    { href: "/price", label: "Pricing" },
  ];

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Techsodh</span>
        </Link>

        {/* Center Links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-foreground ${
                pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 md:flex">
            <ThemeToggle />
            <Link href="#" className="text-muted-foreground hover:text-foreground">
              <FaDiscord className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground">
              <FaXTwitter className="h-5 w-5" />
            </Link>
          </div>

          <div className="h-5 w-[1px] bg-border hidden md:block" />

          {/* Auth section */}
          {!loading && (
            <>
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold">
                      {initials}
                    </span>
                    <span className="hidden sm:block max-w-[100px] truncate">
                      {user.user_metadata?.full_name?.split(" ")[0] ?? "Account"}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-12 z-50 w-60 rounded-2xl border border-border bg-background shadow-xl overflow-hidden">
                      {/* User info header */}
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-muted/30">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-sm font-bold">
                          {initials}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {user.user_metadata?.full_name ?? "User"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="p-1">
                        <Link
                          href="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                          My Profile
                        </Link>
                        <Link
                          href="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                          Dashboard
                        </Link>
                      </div>

                      <div className="border-t border-border/50 p-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                    <Link href="/signin">Sign in</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-5 font-semibold shadow-sm"
                  >
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
