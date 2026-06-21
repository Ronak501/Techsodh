"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Brain,
  BookOpen,
  Bot,
  CheckCheck,
  ChevronRight,
  Clock3,
  Command,
  Download,
  FileDown,
  FileText,
  FolderKanban,
  Globe,
  GripVertical,
  LayoutDashboard,
  Link2,
  NotebookText,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  TrendingUp,
  TriangleAlert,
  WandSparkles,
} from "lucide-react";

import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

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

type ResearchDashboardProps = {
  user: User | null;
};

type NotebookSeed = {
  id: string;
  title: string;
  status: "completed" | "in_progress" | "failed";
  sourceCount: number;
  updatedAt: string;
  summary: string;
};

const sidebarItems = [
  { label: "Dashboard", href: "#workspace", icon: LayoutDashboard },
  { label: "Research Projects", href: "#projects", icon: FolderKanban },
  { label: "Documents", href: "#documents", icon: FileText },
  { label: "Sources", href: "#sources", icon: Globe },
  { label: "Reports", href: "#report", icon: NotebookText },
  { label: "Settings", href: "#settings", icon: Settings },
] as const;

const promptCards = [
  {
    title: "Compare the best AI research tools",
    description: "Benchmark NotebookLM, Perplexity, and Linear-style workflows.",
  },
  {
    title: "Summarize this market with citations",
    description: "Produce a clean, executive-ready summary with source traceability.",
  },
  {
    title: "Verify the strongest claims",
    description: "Run a fact-check pass and surface uncertainty before reporting.",
  },
];

const agentSteps = [
  { label: "Searching Sources", detail: "Scanned 42 results", done: true },
  { label: "Reading Documents", detail: "Parsed PDFs and notes", done: true },
  { label: "Verifying Claims", detail: "Cross-referenced evidence", done: true },
  { label: "Writing Report", detail: "Composing structured summary", done: true },
  { label: "Generating Citations", detail: "Tagged 18 references", done: false },
];

const reportSections = [
  "Executive summary",
  "Main findings",
  "Key insights",
  "References",
];

const sourceCards = [
  {
    title: "RAG research brief.pdf",
    meta: "PDF preview · 24 pages",
    accent: "bg-primary/10 text-primary",
    icon: FileDown,
  },
  {
    title: "Industry benchmark article",
    meta: "Web source · last updated 2h ago",
    accent: "bg-accent/15 text-foreground",
    icon: Globe,
  },
  {
    title: "Internal notes archive",
    meta: "Uploaded source · 11 highlights",
    accent: "bg-secondary text-secondary-foreground",
    icon: BookOpen,
  },
];

const chartBars = [58, 74, 66, 92, 78, 85, 96];

const mobileNavigation = [
  { href: "#workspace", label: "Workspace" },
  { href: "#projects", label: "Research Projects" },
  { href: "#documents", label: "Documents" },
  { href: "#sources", label: "Sources" },
  { href: "#report", label: "Reports" },
  { href: "#settings", label: "Settings" },
] as const;

const emptyNotebook: NotebookSeed = {
  id: "demo-notebook",
  title: "NotebookLM-inspired research workspace",
  status: "in_progress",
  sourceCount: 12,
  updatedAt: "Just now",
  summary:
    "A polished demo workspace with live chat, citations, source panels, and report generation.",
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}

function StatusPill({ status }: { status: ResearchJob["status"] | "draft" }) {
  const meta =
    status === "completed"
      ? { label: "Complete", className: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" }
      : status === "in_progress"
        ? { label: "In progress", className: "bg-sky-500/12 text-sky-700 dark:text-sky-300" }
        : status === "failed"
          ? { label: "Review", className: "bg-rose-500/12 text-rose-700 dark:text-rose-300" }
          : { label: "Draft", className: "bg-muted text-muted-foreground" };

  return (
    <Badge variant="outline" className={cn("border-transparent px-2.5 py-1", meta.className)}>
      {meta.label}
    </Badge>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">
        {description}
      </p>
    </div>
  );
}

function SkeletonRow() {
  return <div className="h-4 animate-pulse rounded-full bg-muted" />;
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-[20px] border-border/70 bg-card/90 p-0 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)]">
      <div className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-balance">
            {value}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function CommandPalette({
  open,
  onOpenChange,
  onAction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (target: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  const commands = [
    { label: "Jump to workspace", target: "workspace" },
    { label: "Open research projects", target: "projects" },
    { label: "View uploaded documents", target: "documents" },
    { label: "Inspect sources", target: "sources" },
    { label: "Read generated report", target: "report" },
    { label: "Open settings", target: "settings" },
  ];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-80 bg-slate-950/35 px-4 py-10 backdrop-blur-sm sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="mx-auto mt-16 w-full max-w-2xl rounded-3xl border border-border/70 bg-background/95 p-4 shadow-2xl shadow-slate-950/20"
            initial={{ y: 24, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/80 px-3 py-2">
              <Command className="h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search commands or sections"
                className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>

            <div className="mt-4 grid gap-2">
              {commands.map((command) => (
                <button
                  key={command.target}
                  type="button"
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/70 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:bg-accent/60"
                  onClick={() => {
                    onAction(command.target);
                    onOpenChange(false);
                  }}
                >
                  <span className="text-sm font-medium text-foreground">
                    {command.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
              <span>Press Esc to close</span>
              <span>Cmd/Ctrl + K</span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function ResearchDashboard({ user }: ResearchDashboardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [supabase] = useState(() => createClient());
  const [jobs, setJobs] = useState<ResearchJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("Researcher");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mainQuery, setMainQuery] = useState("");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: number }>>([]);
  const [dropActive, setDropActive] = useState(false);
  const [splitRatio, setSplitRatio] = useState(56);
  const [isDragging, setIsDragging] = useState(false);
  const splitRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData.user ?? user;

      if (cancelled) return;

      if (currentUser) {
        setDisplayName(
          currentUser.user_metadata?.full_name || currentUser.email || "Researcher",
        );
      }

      const { data, error } = await supabase
        .from("research_reports")
        .select(
          "id, query, status, source_count, prompt_tokens, completion_tokens, estimated_cost_usd, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(6);

      if (!cancelled && !error && data) {
        setJobs(data as ResearchJob[]);
      }

      if (!cancelled) {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isInputLike =
        event.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }

      if (event.key === "Escape") {
        setPaletteOpen(false);
      }

      if (!isInputLike && event.key.toLowerCase() === "n") {
        setMainQuery("Draft a research brief for this topic with source-backed claims.");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      const container = splitRef.current;
      if (!container) return;

      const bounds = container.getBoundingClientRect();
      const nextRatio = ((event.clientX - bounds.left) / bounds.width) * 100;
      setSplitRatio(Math.min(68, Math.max(34, nextRatio)));
    };

    const stopDragging = () => setIsDragging(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [isDragging]);

  const jobsToShow = useMemo(() => {
    const normalized = sidebarSearch.trim().toLowerCase();
    if (!normalized) return jobs;
    return jobs.filter((job) => job.query.toLowerCase().includes(normalized));
  }, [jobs, sidebarSearch]);

  const recentNotebooks = useMemo<NotebookSeed[]>(() => {
    const seededFromJobs = jobsToShow.map((job) => ({
      id: job.id,
      title: truncate(job.query, 44),
      status: job.status,
      sourceCount: job.source_count || 0,
      updatedAt: formatTime(job.created_at),
      summary:
        job.status === "completed"
          ? "Summarized, cited, and ready for export."
          : job.status === "in_progress"
            ? "Still gathering evidence and drafting the report."
            : "Needs a second pass on facts and citations.",
    }));

    return seededFromJobs.length > 0 ? seededFromJobs : [emptyNotebook];
  }, [jobsToShow]);

  const activeNotebook =
    recentNotebooks.find((notebook) => notebook.id === activeNotebookId) ??
    recentNotebooks[0] ??
    emptyNotebook;

  const totalProjects = jobs.length;
  const sourcesProcessed = jobs.reduce((sum, job) => sum + (job.source_count || 0), 0);
  const generatedReports = jobs.filter((job) => job.status === "completed").length;
  const timeSaved = Math.max(0, Math.round(totalProjects * 14 + sourcesProcessed * 0.5));
  const inProgressCount = jobs.filter((job) => job.status === "in_progress").length;
  const reviewCount = jobs.filter((job) => job.status === "failed").length;

  const canScroll = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth", block: "start" });
  };

  const paletteAction = (target: string) => {
    canScroll(target);
  };

  const handleUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadedFiles((current) => [
      ...files,
      ...current,
    ].slice(0, 6).map((file) => ({ name: file.name, size: file.size })));
  };

  const heroActions = (
    <div className="flex flex-wrap gap-3">
      <Button asChild size="lg" className="shadow-lg shadow-primary/20">
        <Link href="/research/new" className="gap-2">
          <Sparkles className="h-4 w-4" />
          New Research
        </Link>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="gap-2"
        onClick={() => setPaletteOpen(true)}
      >
        <Command className="h-4 w-4" />
        Command Palette
      </Button>
    </div>
  );

  return (
    <div className="dashboard-surface min-h-screen bg-background text-foreground">
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onAction={paletteAction} />

      <div className="border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-400 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Research OS</p>
              <p className="text-xs text-muted-foreground">Notebook-style workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => setPaletteOpen(true)}
              aria-label="Open command palette"
            >
              <Command className="h-4 w-4" />
            </Button>
            <MobileNavDrawer title="Research navigation" items={mobileNavigation as unknown as Array<{ href: string; label: string }> } />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-400 lg:grid-cols-[auto_1fr]">
        <aside
          className={cn(
            "sticky top-0 hidden h-screen flex-col border-r border-border/70 bg-card/70 backdrop-blur-xl lg:flex",
            sidebarCollapsed ? "lg:w-23" : "lg:w-80",
          )}
        >
          <div className="flex h-full flex-col p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <Brain className="h-5 w-5" />
                </div>
                {!sidebarCollapsed ? (
                  <div>
                    <p className="text-sm font-semibold tracking-tight">Research OS</p>
                    <p className="text-xs text-muted-foreground">NotebookLM inspired</p>
                  </div>
                ) : null}
              </div>

              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setSidebarCollapsed((current) => !current)}
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
            </div>

            <Button asChild size="lg" className={cn("mt-5 justify-start gap-2 rounded-2xl", sidebarCollapsed && "justify-center px-0")}>
              <Link href="/research/new">
                <WandSparkles className="h-4 w-4" />
                {!sidebarCollapsed ? "New Research" : null}
              </Link>
            </Button>

            <div className="mt-5 rounded-[20px] border border-border/70 bg-background/80 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Search className="h-3.5 w-3.5" />
                {!sidebarCollapsed ? "Search notebooks" : null}
              </div>
              <Input
                value={sidebarSearch}
                onChange={(event) => setSidebarSearch(event.target.value)}
                placeholder="Type to filter"
                className={cn("mt-3 rounded-2xl bg-background/90", sidebarCollapsed && "text-center")}
                aria-label="Search notebooks"
              />
            </div>

            <nav className="mt-6 space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition hover:bg-accent/70 hover:text-accent-foreground",
                      sidebarCollapsed && "justify-center px-0",
                    )}
                    aria-label={item.label}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed ? <span>{item.label}</span> : null}
                  </a>
                );
              })}
            </nav>

            {!sidebarCollapsed ? (
              <div className="mt-6 flex items-center justify-between rounded-[20px] border border-border/70 bg-primary/5 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Recent notebooks</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{recentNotebooks.length} active</p>
                </div>
                <Badge variant="secondary" className="gap-1 rounded-full px-2.5 py-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Live
                </Badge>
              </div>
            ) : null}

            <div className="mt-4 space-y-2 overflow-y-auto pr-1">
              {recentNotebooks.map((notebook) => (
                <button
                  key={notebook.id}
                  type="button"
                  onClick={() => setActiveNotebookId(notebook.id)}
                  className={cn(
                    "w-full rounded-[20px] border border-border/70 bg-background/80 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md",
                    activeNotebook.id === notebook.id && "border-primary/35 bg-primary/6 shadow-md shadow-primary/10",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{notebook.title}</p>
                      {!sidebarCollapsed ? (
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{notebook.summary}</p>
                      ) : null}
                    </div>
                    <StatusPill status={notebook.status} />
                  </div>
                  {!sidebarCollapsed ? (
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{notebook.sourceCount} sources</span>
                      <span>{notebook.updatedAt}</span>
                    </div>
                  ) : null}
                </button>
              ))}
            </div>

            <div className="mt-auto rounded-[20px] border border-border/70 bg-background/90 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground">
                  <span className="text-sm font-semibold">{displayName.slice(0, 2).toUpperCase()}</span>
                </div>
                {!sidebarCollapsed ? (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{displayName}</p>
                    <p className="text-xs text-muted-foreground">Team workspace owner</p>
                  </div>
                ) : null}
              </div>
              {!sidebarCollapsed ? (
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Command shortcuts ready</span>
                  <span>Ctrl K</span>
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <main className="space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <motion.section
            id="workspace"
            className="overflow-hidden rounded-[28px] border border-border/70 bg-card/85 shadow-[0_24px_90px_-54px_rgba(15,23,42,0.55)]"
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="grid gap-8 p-5 sm:p-7 xl:grid-cols-[1.15fr_.85fr] xl:items-start xl:p-8">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Notebook-style research workspace
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    Clean white and gray system
                  </Badge>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Welcome back, {displayName}
                  </p>
                  <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                    A premium AI research dashboard for notebooks, sources, and reports.
                  </h1>
                  <p className="max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
                    Move from a question to citations, notes, and a polished report in one workspace.
                    The interface blends NotebookLM clarity, Perplexity-style search, and Linear-level polish.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">{heroActions}</div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Total Research Projects"
                    value={loading ? "—" : `${totalProjects}`}
                    description="Track every notebook from the same command surface."
                    icon={FolderKanban}
                  />
                  <MetricCard
                    label="Sources Processed"
                    value={loading ? "—" : `${sourcesProcessed}`}
                    description="PDFs, web pages, and uploaded notes stay linked."
                    icon={Globe}
                  />
                  <MetricCard
                    label="AI Generated Reports"
                    value={loading ? "—" : `${generatedReports}`}
                    description="Ready-to-share outputs with structured references."
                    icon={FileText}
                  />
                  <MetricCard
                    label="Time Saved"
                    value={loading ? "—" : `${timeSaved} min`}
                    description="Fast synthesis replaces manual copy-paste work."
                    icon={TrendingUp}
                  />
                </div>
              </div>

              <Card className="rounded-3xl border-border/70 bg-background/80 p-0 shadow-[0_20px_70px_-45px_rgba(15,23,42,0.55)]">
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Ask AI
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight">Search, synthesize, and write</h2>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Bot className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-4 rounded-[22px] border border-border/70 bg-muted/25 p-4">
                    <Textarea
                      value={mainQuery}
                      onChange={(event) => setMainQuery(event.target.value)}
                      placeholder="Ask anything about your research topic, upload files, or request a verified report..."
                      className="min-h-28 rounded-[18px] border-border/70 bg-background/95 text-[15px] leading-7"
                    />
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                          <UploadCloud className="h-4 w-4" />
                          Upload sources
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setPaletteOpen(true)} className="gap-2">
                          <Command className="h-4 w-4" />
                          Shortcuts
                        </Button>
                      </div>
                      <Button type="button" size="sm" className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        Generate brief
                      </Button>
                    </div>
                    <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(event) => handleUpload(event.target.files)} />
                  </div>
                </div>

                <div className="border-t border-border/70 px-5 py-4 sm:px-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {promptCards.map((prompt) => (
                      <button
                        key={prompt.title}
                        type="button"
                        onClick={() => setMainQuery(prompt.title)}
                        className="rounded-[18px] border border-border/70 bg-card/85 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <p className="text-sm font-semibold leading-6">{prompt.title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{prompt.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </motion.section>

          <section id="projects" className="space-y-4">
            <SectionHeading
              eyebrow="Research projects"
              title="Recent notebooks and research runs"
              description="Review recent work, filter notebooks quickly, and jump back into the most relevant thread without losing context."
            />

            {loading ? (
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="rounded-[20px] border-border/70 p-5">
                    <div className="space-y-3">
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                    </div>
                  </Card>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <Card className="rounded-3xl border-dashed border-border/70 bg-background/70 p-8">
                <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold tracking-tight">No research notebooks yet</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                      Start a new research run to populate sources, citations, and report sections.
                      Until then, this workspace stays clean and ready with a beautiful empty state.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button asChild size="lg" className="gap-2">
                      <Link href="/research/new">
                        Start your first notebook
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => setPaletteOpen(true)} className="gap-2">
                      <Command className="h-4 w-4" />
                      Open command palette
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {jobs.slice(0, 6).map((job) => (
                  <Card
                    key={job.id}
                    className={cn(
                      "rounded-[20px] border-border/70 bg-card/90 p-0 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.45)] transition hover:-translate-y-1",
                      activeNotebookId === job.id && "border-primary/30 bg-primary/5",
                    )}
                  >
                    <button type="button" className="block w-full text-left" onClick={() => setActiveNotebookId(job.id)}>
                      <div className="flex items-start justify-between gap-4 p-5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <StatusPill status={job.status} />
                            <span className="text-xs text-muted-foreground">{formatTime(job.created_at)}</span>
                          </div>
                          <h3 className="mt-3 text-lg font-semibold leading-7 text-balance">{job.query}</h3>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {job.source_count} sources · ${Number(job.estimated_cost_usd || 0).toFixed(2)} estimated spend
                          </p>
                        </div>
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                    </button>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section id="documents" className="space-y-4">
            <SectionHeading
              eyebrow="Notebook view"
              title="Split-screen chat, sources, and live citations"
              description="The workspace keeps conversation context on the left and evidence on the right, with a draggable divider for focused reading."
            />

            <Card className="rounded-[28px] border-border/70 bg-card/85 p-0 shadow-[0_22px_70px_-44px_rgba(15,23,42,0.52)]">
              <div
                ref={splitRef}
                className="grid gap-0 xl:min-h-205 xl:grid-cols-[minmax(0,var(--left-panel,56%))_12px_minmax(0,calc(100%-var(--left-panel,56%)-12px))]"
                style={{ ["--left-panel" as string]: `${splitRatio}%` }}
              >
                <div
                  className="min-w-0 border-b border-border/70 p-5 xl:border-b-0 xl:border-r"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Chat conversation</p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight">Notebook chat with streaming output</h3>
                    </div>
                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      <Clock3 className="mr-1.5 h-3.5 w-3.5" />
                      Live drafting
                    </Badge>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="rounded-[22px] border border-border/70 bg-muted/25 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">User</p>
                      <p className="mt-2 text-sm leading-7 text-foreground">
                        Compare the strongest claims in the latest research notes and make sure every conclusion has a citation.
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-primary/15 bg-primary/5 p-4 shadow-sm shadow-primary/5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">AI response</p>
                        <Badge variant="outline" className="border-primary/20 bg-background/85 text-primary">
                          <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                          Citations attached
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-foreground">
                        The current evidence supports the core thesis, but two claims need a stronger secondary source before they are ready for publication.
                      </p>
                      <div className="mt-4 grid gap-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Link2 className="h-3.5 w-3.5 text-primary" />
                          Citations
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="rounded-full px-2.5 py-1">[1] PDF brief</Badge>
                          <Badge variant="secondary" className="rounded-full px-2.5 py-1">[2] Web benchmark</Badge>
                          <Badge variant="secondary" className="rounded-full px-2.5 py-1">[3] Internal notes</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-border/70 bg-background p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Streaming response</p>
                          <p className="text-xs text-muted-foreground">Synthesizing evidence into a concise answer</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="h-3 w-3/5 rounded-full bg-muted/80" />
                        <div className="h-3 w-4/5 rounded-full bg-muted/70" />
                        <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                          AI is thinking
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="hidden cursor-col-resize items-center justify-center bg-border/80 text-muted-foreground transition hover:bg-primary/15 xl:flex"
                  aria-label="Resize panels"
                  onPointerDown={() => setIsDragging(true)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowLeft") setSplitRatio((current) => Math.max(34, current - 2));
                    if (event.key === "ArrowRight") setSplitRatio((current) => Math.min(68, current + 2));
                  }}
                >
                  <GripVertical className="h-4 w-4" />
                </button>

                <div className="min-w-0 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Source library</p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight">Uploaded files, web sources, and notes</h3>
                    </div>
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                      {activeNotebook.sourceCount} sources
                    </Badge>
                  </div>

                  <div
                    className={cn(
                      "mt-5 rounded-3xl border border-dashed p-5 transition",
                      dropActive ? "border-primary bg-primary/5" : "border-border/70 bg-muted/20",
                    )}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDropActive(true);
                    }}
                    onDragLeave={() => setDropActive(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDropActive(false);
                      handleUpload(event.dataTransfer.files);
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <UploadCloud className="h-4 w-4 text-primary" />
                          Drag and drop documents here
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Add PDFs, docs, or text files to enrich the notebook and generate better citations.
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                        Browse
                      </Button>
                    </div>

                    <div className="mt-4 space-y-2">
                      {uploadedFiles.length > 0 ? (
                        uploadedFiles.map((file) => (
                          <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/90 px-4 py-3 text-sm">
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                            </div>
                            <Badge variant="secondary" className="rounded-full px-2.5 py-1">Uploaded</Badge>
                          </div>
                        ))
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {sourceCards.map((source) => {
                            const Icon = source.icon;
                            return (
                              <div key={source.title} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/90 p-4">
                                <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", source.accent)}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{source.title}</p>
                                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{source.meta}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <Card className="rounded-[22px] border-border/70 bg-background/90 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">Research notes</p>
                        <Badge variant="outline" className="rounded-full px-2.5 py-1">Editable</Badge>
                      </div>
                      <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
                        <p>• Best claims have two independent sources.</p>
                        <p>• Any unresolved statement should be flagged for review.</p>
                        <p>• Citation badges should remain visible in the final report.</p>
                      </div>
                    </Card>

                    <Card className="rounded-[22px] border-border/70 bg-background/90 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">Extracted insights</p>
                        <Badge variant="outline" className="rounded-full px-2.5 py-1">Auto-synced</Badge>
                      </div>
                      <div className="mt-3 space-y-3">
                        <div className="rounded-2xl bg-primary/5 p-3 text-sm leading-6">
                          The workflow is strongest when the source library is visible beside the chat.
                        </div>
                        <div className="rounded-2xl bg-muted/45 p-3 text-sm leading-6">
                          Fact-check status remains visible until the last reference is attached.
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Card className="mt-5 rounded-[22px] border-border/70 bg-background/90 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">Fact-check status</p>
                      <Badge variant="secondary" className="rounded-full px-2.5 py-1">3 verified</Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      {[
                        "Citation coverage complete",
                        "One statistical claim needs source parity",
                        "Report language approved for release",
                      ].map((item, index) => (
                        <div key={item} className="flex items-center gap-3 rounded-2xl border border-border/70 px-3 py-2.5 text-sm">
                          <span className={cn("h-2.5 w-2.5 rounded-full", index === 1 ? "bg-amber-500" : "bg-emerald-500")} />
                          <span className="flex-1">{item}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </Card>
          </section>

          <section id="report" className="space-y-4">
            <SectionHeading
              eyebrow="Generated report"
              title="Professional document layout with export actions"
              description="Compose a clean report with a table of contents, executive summary, and references that is ready for stakeholders."
            />

            <Card className="rounded-[28px] border-border/70 bg-card/90 p-0 shadow-[0_22px_70px_-44px_rgba(15,23,42,0.5)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4 sm:px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">AI generated report</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight">Research brief · NotebookLM style export</h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="h-4 w-4" />
                    DOCX
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Markdown
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[240px_1fr]">
                <aside className="rounded-[22px] border border-border/70 bg-muted/25 p-4 xl:sticky xl:top-4 xl:self-start">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Table of contents</p>
                  <nav className="mt-4 space-y-2">
                    {reportSections.map((item, index) => (
                      <a key={item} href="#report" className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium transition hover:bg-accent/60">
                        <span>{item}</span>
                        <span className="text-xs text-muted-foreground">0{index + 1}</span>
                      </a>
                    ))}
                  </nav>
                </aside>

                <article className="report-copy rounded-[22px] border border-border/70 bg-background/95 p-5 sm:p-7">
                  <h4 className="text-2xl font-semibold tracking-tight">Executive summary</h4>
                  <p>
                    The research pipeline combines guided notebook structure with evidence-backed synthesis.
                    It surfaces source quality, tracks claims, and packages the result as a clean report for decision makers.
                  </p>

                  <h4 className="mt-6 text-xl font-semibold tracking-tight">Main findings</h4>
                  <p>
                    Findings are written in a clear, minimal format with visible citations, claim status, and direct links to the original sources.
                  </p>

                  <h4 className="mt-6 text-xl font-semibold tracking-tight">Key insights</h4>
                  <ul className="space-y-3">
                    <li>• Users need the chat, sources, and notes side by side to keep context obvious.</li>
                    <li>• A command palette and keyboard shortcuts reduce navigation friction during deep research.</li>
                    <li>• An explicit fact-check status helps the final output feel trustworthy and production-ready.</li>
                  </ul>

                  <h4 className="mt-6 text-xl font-semibold tracking-tight">References</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/25 p-4">
                      <Badge variant="secondary" className="rounded-full px-2.5 py-1">1</Badge>
                      <div>
                        <p className="font-medium">NotebookLM UX analysis</p>
                        <p className="text-sm text-muted-foreground">Source-backed comparison of notebook-centric research workflows.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/25 p-4">
                      <Badge variant="secondary" className="rounded-full px-2.5 py-1">2</Badge>
                      <div>
                        <p className="font-medium">Perplexity-style research flow</p>
                        <p className="text-sm text-muted-foreground">Interactive Q&A, sources, and synthesis in one loop.</p>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </Card>
          </section>

          <section id="research-agent" className="space-y-4">
            <SectionHeading
              eyebrow="Techsodh"
              title="Animated workflow with clear progress indicators"
              description="Track each stage of Techsodh so users can see what the model is doing without opening logs."
            />

            <Card className="rounded-[28px] border-border/70 bg-card/90 p-0 shadow-[0_22px_70px_-44px_rgba(15,23,42,0.5)]">
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Techsodh</p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight">Current run status</h3>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                    Verified pipeline
                  </Badge>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
                  <div className="space-y-3">
                    {agentSteps.map((step, index) => (
                      <motion.div
                        key={step.label}
                        className="rounded-[20px] border border-border/70 bg-background/90 p-4"
                        initial={shouldReduceMotion ? undefined : { opacity: 0, x: -8 }}
                        animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn("mt-1 flex h-9 w-9 items-center justify-center rounded-full", step.done ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground") }>
                            {step.done ? <CheckCheck className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium">{step.label}</p>
                              <span className="text-xs text-muted-foreground">{index + 1}/5</span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn("h-full rounded-full bg-primary transition-all", step.done ? "w-full" : "w-2/5 animate-pulse")}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <Card className="rounded-[22px] border-border/70 bg-muted/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">Progress timeline</p>
                        <span className="text-xs text-muted-foreground">90%</span>
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="h-2 rounded-full bg-muted">
                          <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: "90%" }} transition={{ duration: 1 }} />
                        </div>
                        <div className="grid grid-cols-5 gap-2 text-[11px] text-muted-foreground">
                          {agentSteps.map((step) => (
                            <div key={step.label} className="space-y-1 text-center">
                              <div className={cn("mx-auto h-2 w-2 rounded-full", step.done ? "bg-primary" : "bg-muted-foreground/50")} />
                              <span className="block leading-4">{step.label.split(" ")[0]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>

                    <Card className="rounded-[22px] border-border/70 bg-muted/20 p-4">
                      <p className="text-sm font-semibold">Research checkpoints</p>
                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                          <CheckCheck className="h-4 w-4" />
                          Sources loaded and normalized
                        </div>
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                          <CheckCheck className="h-4 w-4" />
                          Claims compared against citations
                        </div>
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                          <TriangleAlert className="h-4 w-4" />
                          One final reference pending review
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section id="analytics" className="space-y-4">
            <SectionHeading
              eyebrow="Dashboard analytics"
              title="Stats and charts that feel like a premium SaaS product"
              description="Use simple, high-contrast charts and clear metrics so the workspace reads well at a glance."
            />

            <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
              <Card className="rounded-[28px] border-border/70 bg-card/90 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Performance chart</p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight">Research throughput</h3>
                  </div>
                  <Badge variant="outline" className="rounded-full px-3 py-1">Last 7 runs</Badge>
                </div>

                <div className="mt-6 grid grid-cols-7 items-end gap-3 rounded-3xl bg-muted/20 p-4">
                  {chartBars.map((height, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <motion.div
                        className="w-full rounded-t-2xl bg-linear-to-t from-primary to-accent shadow-lg shadow-primary/15"
                        initial={shouldReduceMotion ? undefined : { height: 0 }}
                        animate={shouldReduceMotion ? undefined : { height: `${height}%` }}
                        transition={{ duration: 0.55, delay: index * 0.04 }}
                      />
                      <span className="text-[11px] text-muted-foreground">{index + 1}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <Card className="rounded-3xl border-border/70 bg-card/90 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Sources processed</p>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-3xl font-semibold tracking-tight">{loading ? "—" : sourcesProcessed}</p>
                      <p className="mt-2 text-sm text-muted-foreground">PDFs, web pages, notes, and citations linked to notebooks.</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-primary" />
                  </div>
                </Card>

                <Card className="rounded-3xl border-border/70 bg-card/90 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Settings</p>
                  <div className="mt-4 space-y-3" id="settings">
                    {[
                      "Auto-save notes after every response",
                      "Keep citations visible in split view",
                      "Use clean PDF export formatting",
                    ].map((item) => (
                      <div key={item} className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 px-3 py-2.5 text-sm">
                        <span className="pr-3">{item}</span>
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">On</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </section>

          <section id="sources" className="space-y-4">
            <SectionHeading
              eyebrow="Source status"
              title="Citation badges, source cards, and review state"
              description="A dedicated source area keeps the user oriented and makes it easy to verify where each claim came from."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="rounded-[22px] border-border/70 bg-card/90 p-5">
                <p className="text-sm font-medium text-muted-foreground">Uploaded sources</p>
                <p className="mt-3 text-3xl font-semibold">{uploadedFiles.length || activeNotebook.sourceCount}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Drag and drop inputs keep the notebook fresh.</p>
              </Card>
              <Card className="rounded-[22px] border-border/70 bg-card/90 p-5">
                <p className="text-sm font-medium text-muted-foreground">In progress</p>
                <p className="mt-3 text-3xl font-semibold">{loading ? "—" : inProgressCount}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Questions still being synthesized by the agent.</p>
              </Card>
              <Card className="rounded-[22px] border-border/70 bg-card/90 p-5">
                <p className="text-sm font-medium text-muted-foreground">Needs review</p>
                <p className="mt-3 text-3xl font-semibold">{loading ? "—" : reviewCount}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Potentially weak claims and unclear citations.</p>
              </Card>
              <Card className="rounded-[22px] border-border/70 bg-card/90 p-5">
                <p className="text-sm font-medium text-muted-foreground">Focus mode</p>
                <p className="mt-3 text-3xl font-semibold">{activeNotebook.title.length > 30 ? "Deep" : "Open"}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Use the split view to compare sources side by side.</p>
              </Card>
            </div>
          </section>
        </main>
      </div>

      <Button
        type="button"
        size="lg"
        className="fixed bottom-5 right-5 z-50 rounded-full shadow-2xl shadow-primary/20 lg:hidden"
        onClick={() => setPaletteOpen(true)}
        aria-label="Open quick actions"
      >
        <Command className="h-4 w-4" />
      </Button>

      <style jsx global>{`
        #workspace,
        #projects,
        #documents,
        #report,
        #research-agent,
        #analytics,
        #sources,
        #settings {
          scroll-margin-top: 96px;
        }
      `}</style>
    </div>
  );
}