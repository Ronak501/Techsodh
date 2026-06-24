"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import {
  User as UserIcon,
  Mail,
  AtSign,
  Calendar,
  Pencil,
  Check,
  X,
  LayoutDashboard,
  FlaskConical,
  LogOut,
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/signin");
        return;
      }

      setUser(user);
      setNewName(user.user_metadata?.full_name ?? "");
      setLoading(false);
    };

    void getUser();
  }, [supabase, router]);

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      data: { full_name: newName.trim() },
    });

    if (error) {
      toast.error("Failed to update name");
    } else {
      toast.success("Name updated successfully");
      setUser((prev) =>
        prev
          ? { ...prev, user_metadata: { ...prev.user_metadata, full_name: newName.trim() } }
          : prev
      );
      setEditingName(false);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  const initials = user?.user_metadata?.full_name
    ? (user.user_metadata.full_name as string)
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() ?? "U");

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="mt-1 text-muted-foreground">Manage your account details and preferences.</p>
        </div>

        {/* Profile Card */}
        <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Avatar Banner */}
          <div className="h-24 bg-gradient-to-r from-foreground/90 to-foreground/70" />

          <div className="px-8 pb-8">
            {/* Avatar */}
            <div className="-mt-10 mb-6 flex items-end justify-between">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-background bg-foreground text-background text-2xl font-bold shadow-md">
                {initials}
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="rounded-xl gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>

            {/* Info grid */}
            <div className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <UserIcon className="h-3.5 w-3.5" />
                  Full Name
                </label>
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdateName();
                        if (e.key === "Escape") setEditingName(false);
                      }}
                      className="h-10 rounded-xl"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      className="h-10 w-10 rounded-xl shrink-0"
                      onClick={handleUpdateName}
                      disabled={saving}
                    >
                      {saving ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-10 w-10 rounded-xl shrink-0"
                      onClick={() => {
                        setEditingName(false);
                        setNewName(user?.user_metadata?.full_name ?? "");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                    <span className="text-base font-medium">
                      {user?.user_metadata?.full_name || "—"}
                    </span>
                    <button
                      onClick={() => setEditingName(true)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <AtSign className="h-3.5 w-3.5" />
                  Username
                </label>
                <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                  <span className="text-base font-medium text-muted-foreground">
                    @{user?.user_metadata?.username || "—"}
                  </span>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  Email Address
                </label>
                <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                  <span className="text-base font-medium">{user?.email}</span>
                </div>
              </div>

              {/* Member since */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Member Since
                </label>
                <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                  <span className="text-base font-medium">{joinDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Link href="/dashboard">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:bg-accent/30 transition-all cursor-pointer group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Dashboard</p>
                <p className="text-xs text-muted-foreground">View research history</p>
              </div>
            </div>
          </Link>

          <Link href="/research">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:bg-accent/30 transition-all cursor-pointer group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <FlaskConical className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Research</p>
                <p className="text-xs text-muted-foreground">Start a new query</p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
