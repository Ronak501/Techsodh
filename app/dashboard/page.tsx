"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { dashboardNavigation } from "@/lib/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Bot,
  Calendar,
  CircleCheckBig,
  FileText,
  FilePenLine,
  Sparkles,
  Workflow,
} from "lucide-react";

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

const dashboardHighlights = [
  {
    label: "Research coverage",
    value: "All runs in one place",
    detail: "Search, filter, and review every report from the same workspace.",
  },
  {
    label: "Workflow modes",
    value: "Research + Humanizer",
    detail: "Move from research to rewriting without leaving the product.",
  },
  {
    label: "Delivery loop",
    value: "Chat, export, repeat",
    detail: "Continue the conversation after every report is generated.",
  },
];

const statusMeta = {
  completed: {
    label: "Completed",
    badgeClass:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    icon: CircleCheckBig,
  },
  in_progress: {
    label: "In Progress",
    badgeClass:
      "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    icon: Workflow,
  },
  failed: {
    label: "Failed",
    badgeClass:
      "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    icon: Bot,
  },
} as const;

export default function DashboardPage() {
  const [supabase] = useState(() => createClient());

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

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
  }, [supabase]);

  const total = jobs.length;
  const completed = jobs.filter((job) => job.status === "completed").length;
  const inProgress = jobs.filter((job) => job.status === "in_progress").length;
  const totalPromptTokens = jobs.reduce(
    (sum, job) => sum + (job.prompt_tokens || 0),
    0,
  );
  const totalCompletionTokens = jobs.reduce(
    (sum, job) => sum + (job.completion_tokens || 0),
    0,
  );
  const estimatedCostUsd = jobs.reduce(
    (sum, job) => sum + Number(job.estimated_cost_usd || 0),
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

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortBy, pageSize]);

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

  const metricCards = [
    {
      label: "Total Research",
      value: total,
      icon: BarChart3,
      accent: "from-primary/25 to-primary/5",
      valueClass: "text-primary",
    },
    {
      label: "Completed",
      value: completed,
      icon: CircleCheckBig,
      accent: "from-emerald-500/25 to-emerald-500/5",
      valueClass: "text-emerald-600 dark:text-emerald-300",
    },
    {
      label: "In Progress",
      value: inProgress,
      icon: Workflow,
      accent: "from-sky-500/25 to-sky-500/5",
      valueClass: "text-sky-600 dark:text-sky-300",
    },
    {
      label: "Est. Cost",
      value: `$${estimatedCostUsd.toFixed(2)}`,
      icon: ArrowUpRight,
      accent: "from-amber-500/25 to-amber-500/5",
      valueClass: "text-amber-600 dark:text-amber-300",
    },
  ];

  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / pageSize));
  const pagedJobs = sortedJobs.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="dashboard-surface editorial-grid min-h-screen bg-background text-foreground">
      <div className="border-b border-border/60 bg-linear-to-r from-card via-card/92 to-muted/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <MobileNavDrawer
                title="Dashboard Navigation"
                items={dashboardNavigation}
              />
              <Button asChild variant="ghost" size="sm" className="w-fit">
                <Link href="/" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Research Command Center
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-balance">
                  Dashboard
                </h1>
                <p className="text-readable max-w-2xl text-sm sm:text-base">
                  Track every research run, review outcomes, and launch new
                  analyses from one clear, high-visibility workspace.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                AI Research OS
              </Badge>
              <div className="rounded-full border border-border/60 bg-card/80 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur">
                <span className="font-medium text-foreground/90">Hello</span>{" "}
                {userName ? userName : "Loading your workspace..."}
              </div>
              <Button asChild size="sm" className="shadow-md shadow-primary/20">
                <Link href="/research/new" className="gap-2">
                  New Research
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/humanizer" className="gap-2">
                  <FilePenLine className="h-4 w-4" />
                  Humanizer
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/chat">Conversations</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight">
            Workspace Overview
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your research metrics and activity at a glance
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {metricCards.map((metric) => {
            const Icon = metric.icon;

            return (
              <Card
                key={metric.label}
                className="dashboard-card rounded-3xl border-border/70 bg-card/80 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div
                  className={`rounded-2xl bg-linear-to-br ${metric.accent} p-3`}
                >
                  <Icon className={`h-5 w-5 ${metric.valueClass}`} />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {metric.label}
                </p>
                <p
                  className={`mt-2 text-3xl font-bold tracking-tight ${metric.valueClass}`}
                >
                  {metric.value}
                </p>
              </Card>
            );
          })}
        </div>

        <Card className="dashboard-card mt-6 overflow-hidden rounded-3xl border-border/70 bg-card/80 shadow-sm">
          <div className="border-b border-border/60 bg-muted/30 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Recent Research</h2>
                <p className="text-readable mt-2 text-sm">
                  Search, sort, and export your research history.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 lg:w-136">
                <Input
                  placeholder="Search by query"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11"
                />
                <select
                  className="h-11 rounded-lg border border-border/70 bg-background px-3 text-sm"
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
                  className="h-11 rounded-lg border border-border/70 bg-background px-3 text-sm"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as "newest" | "oldest" | "query_asc",
                    )
                  }
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="query_asc">Query A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading...</div>
          ) : sortedJobs.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              {search || statusFilter !== "all"
                ? "No matching research found. Adjust filters or start a new analysis."
                : "No research yet. Start one to populate your dashboard."}
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {pagedJobs.map((job) => {
                const meta = statusMeta[job.status];
                const StatusIcon = meta.icon;

                return (
                  <div
                    key={job.id}
                    className="group p-5 transition hover:bg-muted/25 sm:p-6"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={meta.badgeClass}>
                            <StatusIcon className="mr-2 h-3.5 w-3.5" />
                            {meta.label}
                          </Badge>
                          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Research report
                          </span>
                        </div>

                        <div className="max-w-3xl">
                          <h3 className="text-base font-semibold leading-7 text-balance sm:text-lg">
                            {job.query}
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              {new Date(job.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <FileText className="h-4 w-4" />
                              {job.source_count} insights
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
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
                  </div>
                );
              })}

              {/* Pagination controls */}
              <div className="border-t border-border/60 bg-muted/30 p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  {sortedJobs.length === 0 ? 0 : (page - 1) * pageSize + 1} –{" "}
                  {Math.min(page * pageSize, sortedJobs.length)} of{" "}
                  {sortedJobs.length} research
                  {sortedJobs.length !== 1 ? "es" : ""}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-9 rounded-lg border border-border/70 bg-background px-2 text-sm"
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                  </select>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      ← Prev
                    </Button>
                    <div className="px-3 text-sm font-medium">
                      Page {page} of {totalPages}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    >
                      Next →
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
