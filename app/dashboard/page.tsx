"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar, FileText } from "lucide-react";

type ResearchJob = {
  id: string;
  query: string;
  status: "completed" | "in_progress" | "failed";
  source_count: number;
  prompt_tokens: number;
  completion_tokens: number;
  estimated_cost_usd: number;
  created_at: string;
};

export default function DashboardPage() {
  const supabase = createClient();

  const [userName, setUserName] = useState<string | null>(null);
  const [jobs, setJobs] = useState<ResearchJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "completed" | "in_progress" | "failed"
  >("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "query_asc">(
    "newest",
  );

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUserName(user.user_metadata?.full_name || user.email || "User");

      const { data, error } = await supabase
        .from("research_reports")
        .select(
          "id, query, status, source_count, prompt_tokens, completion_tokens, estimated_cost_usd, created_at",
        )
        .order("created_at", { ascending: false });

      if (!error && data) {
        setJobs(data);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  // Stats
  const total = jobs.length;
  const completed = jobs.filter((j) => j.status === "completed").length;
  const inProgress = jobs.filter((j) => j.status === "in_progress").length;
  const failed = jobs.filter((j) => j.status === "failed").length;
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const totalPromptTokens = jobs.reduce(
    (sum, j) => sum + (j.prompt_tokens || 0),
    0,
  );
  const totalCompletionTokens = jobs.reduce(
    (sum, j) => sum + (j.completion_tokens || 0),
    0,
  );
  const estimatedCostUsd = jobs.reduce(
    (sum, j) => sum + Number(j.estimated_cost_usd || 0),
    0,
  );

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.query
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ? true : job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === "oldest") {
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }

    if (sortBy === "query_asc") {
      return a.query.localeCompare(b.query);
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const recentTrend = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);

    const dayJobs = jobs.filter(
      (job) => new Date(job.created_at).toISOString().slice(0, 10) === key,
    );

    return {
      label: key,
      success: dayJobs.filter((job) => job.status === "completed").length,
      failed: dayJobs.filter((job) => job.status === "failed").length,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Your research history and results
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              👤 {userName ? `Hi, ${userName}` : "Loading..."}
            </div>

            <Button asChild size="sm">
              <Link href="/research/new">New Research</Link>
            </Button>

            <Button asChild size="sm">
              <Link href="/chat">Conversations</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Research</p>
            <p className="text-3xl font-bold text-accent">{total}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Completed</p>
            <p className="text-3xl font-bold text-accent">{completed}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">In Progress</p>
            <p className="text-3xl font-bold text-accent">{inProgress}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Failed</p>
            <p className="text-3xl font-bold text-destructive">{failed}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Success Rate</p>
            <p className="text-3xl font-bold text-accent">{successRate}%</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Est. Cost</p>
            <p className="text-3xl font-bold text-accent">
              ${estimatedCostUsd.toFixed(2)}
            </p>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-3">Usage Overview</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <p>
              <span className="font-semibold">Query Count:</span> {total}
            </p>
            <p>
              <span className="font-semibold">Prompt Tokens:</span>{" "}
              {totalPromptTokens.toLocaleString()}
            </p>
            <p>
              <span className="font-semibold">Completion Tokens:</span>{" "}
              {totalCompletionTokens.toLocaleString()}
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-3">
            Success/Failure Trend (Last 7 Days)
          </h2>
          <div className="space-y-2 text-sm">
            {recentTrend.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between border-b border-border/50 pb-2"
              >
                <span className="text-muted-foreground">{row.label}</span>
                <span>Success: {row.success}</span>
                <span>Failed: {row.failed}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Research List */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="font-semibold text-lg">Recent Research</h2>
            <div className="mt-4 grid sm:grid-cols-3 gap-3">
              <Input
                placeholder="Search by query"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as
                      | "all"
                      | "completed"
                      | "in_progress"
                      | "failed",
                  )
                }
              >
                <option value="all">All statuses</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In progress</option>
                <option value="failed">Failed</option>
              </select>
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "newest" | "oldest" | "query_asc")
                }
              >
                <option value="newest">Sort: Newest first</option>
                <option value="oldest">Sort: Oldest first</option>
                <option value="query_asc">Sort: Query A-Z</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-6">Loading...</div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-6 text-muted-foreground">
              No research yet. Start one 🚀
            </div>
          ) : (
            <div className="divide-y">
              {sortedJobs.map((job) => (
                <div key={job.id} className="p-6 hover:bg-muted/30 transition">
                  <div className="flex justify-between mb-3">
                    <div>
                      <h3 className="font-semibold mb-1">{job.query}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(job.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {job.source_count} insights
                        </div>
                      </div>
                    </div>

                    <Badge
                      className={
                        job.status === "completed"
                          ? "bg-accent"
                          : job.status === "in_progress"
                            ? "bg-primary"
                            : "bg-destructive"
                      }
                    >
                      {job.status === "completed"
                        ? "Completed"
                        : job.status === "in_progress"
                          ? "In Progress"
                          : "Failed"}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/research/${job.id}`}>View Results</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={`/api/research/${job.id}/export?format=markdown`}
                      >
                        Export
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a href={`/api/research/${job.id}/export?format=pdf`}>
                        Export PDF
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
