"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { useTheme } from "next-themes";
import { createClient } from "@/utils/supabase/client";
import { useMemo } from "react";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Brain,
  ChartNoAxesCombined,
  Database,
  FileBarChart2,
  FilePenLine,
  Globe,
  LibraryBig,
  Lock,
  MessageSquareText,
  Moon,
  NotebookText,
  Rocket,
  ShieldCheck,
  Sparkles,
  Sun,
  Waypoints,
} from "lucide-react";

interface Props {
  user: User | null;
}

const features = [
  {
    icon: LibraryBig,
    title: "Evidence-First Research",
    description:
      "Every report includes references, confidence signals, and structured context so teams can trust what they read.",
  },
  {
    icon: Waypoints,
    title: "Guided Workflow",
    description:
      "Move from query to outline to analysis with clear stages, status visibility, and predictable outputs.",
  },
  {
    icon: ShieldCheck,
    title: "Built-In Quality Checks",
    description:
      "Fact checks, confidence tags, and consistency checks are included by default in each run.",
  },
  {
    icon: MessageSquareText,
    title: "Threaded Conversations",
    description:
      "Keep follow-up questions and decisions linked to each research item so context is never lost.",
  },
  {
    icon: FilePenLine,
    title: "Human Tone Output",
    description:
      "Transform robotic language into clear, persuasive writing while preserving facts and intent.",
  },
  {
    icon: Lock,
    title: "Secure By Default",
    description:
      "Production-safe access controls and usage gates help protect APIs and control operating cost.",
  },
];

const heroStats = [
  { label: "Report turnaround", value: "Around 40 sec" },
  { label: "Evidence handling", value: "Structured + tagged" },
  { label: "Readability mode", value: "Human tone" },
  { label: "Team adoption", value: "Dashboard + chat" },
];

const productFlow = [
  {
    icon: Globe,
    title: "Frame the question",
    description:
      "Start with a topic or claim, then set depth, tone, and expected output format.",
  },
  {
    icon: Database,
    title: "Collect and synthesize",
    description:
      "Generate outline, analysis, and references in one connected pipeline with clear traceability.",
  },
  {
    icon: NotebookText,
    title: "Polish for readability",
    description:
      "Apply human-style phrasing and preserve key facts so stakeholders can read quickly and decide faster.",
  },
  {
    icon: Rocket,
    title: "Share and iterate",
    description:
      "Export results, collaborate in chat, and continue improving drafts without losing context.",
  },
];

const readingPillars = [
  "High contrast color system for easy scanning",
  "Consistent heading scale for faster comprehension",
  "Comfortable line-height to reduce reading fatigue",
];

const bentoCards = [
  {
    title: "Research Control Center",
    description:
      "A focused command view for deep research, claim verification, and confidence scoring.",
    span: "lg:col-span-2",
  },
  {
    title: "Readable Writing Layer",
    description:
      "Convert technical model output into human-friendly language that remains accurate.",
    span: "",
  },
  {
    title: "Conversation Memory",
    description:
      "Preserve decisions, revisions, and rationale in one place for every research topic.",
    span: "",
  },
  {
    title: "Delivery-Ready Exports",
    description:
      "Generate structured exports for reports, handoffs, and stakeholder updates.",
    span: "lg:col-span-2",
  },
];

export default function HomeClient({ user }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const supabase = createClient();
  const router = useRouter();

  const mobileLinks = useMemo(
    () =>
      user
        ? [
            { href: "/dashboard", label: "Dashboard" },
            { href: "/research", label: "Research" },
            { href: "/humanizer", label: "Humanizer" },
            { href: "/chat", label: "Chat" },
            { href: "/price", label: "Pricing" },
          ]
        : [
            { href: "/signin", label: "Login" },
            { href: "/signup", label: "Sign Up" },
            { href: "/price", label: "Pricing" },
            { href: "/research", label: "Research" },
            { href: "/humanizer", label: "Humanizer" },
            { href: "/chat", label: "Chat" },
          ],
    [user],
  );

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return;
    }

    router.replace("/");
    router.refresh();
  };

  return (
    <div className="home-surface editorial-grid min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-accent text-primary-foreground shadow-md shadow-primary/30">
              <Brain className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight sm:text-xl">
              ResearchAgent
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <MobileNavDrawer title="Main Navigation" items={mobileLinks} />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              <Sun className="hidden h-4 w-4 dark:block" />
              <Moon className="h-4 w-4 dark:hidden" />
            </Button>

            {user ? (
              <>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="hidden sm:inline-flex"
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link href="/research">Research</Link>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleLogout}
                  className="hidden sm:inline-flex"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="hidden sm:inline-flex"
                >
                  <Link href="/signin">Login</Link>
                </Button>
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden py-14 sm:py-18 lg:py-22">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-start lg:px-8">
          <div className="rise-in space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/12 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Readability-First Interface
              </span>
              <span className="inline-flex items-center rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-xs font-medium text-foreground/75">
                Designed for fast decision teams
              </span>
            </div>

            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              A sharper UI for research people can actually read.
            </h1>

            <p className="text-readable max-w-2xl text-base leading-8 sm:text-lg">
              This redesign emphasizes clarity, contrast, and hierarchy. Your
              team gets structured insight, human-friendly writing, and a visual
              rhythm that makes long research output easy to scan.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-lg shadow-primary/30">
                <Link href="/research" className="gap-2">
                  Start Research
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/humanizer">Open Humanizer</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/chat">Ask in Chat</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {heroStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border/80 bg-card/85 p-4 shadow-sm backdrop-blur"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-foreground/65">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground/95">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Card className="glass-panel rise-in rise-in-delay-1 rounded-3xl border-border/80 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                How the platform reads better
              </p>
              <ChartNoAxesCombined className="h-4 w-4 text-primary" />
            </div>

            <div className="mt-5 space-y-3">
              {productFlow.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-border/75 bg-background/65 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/15 px-2 text-xs font-semibold text-primary">
                      {index + 1}
                    </div>
                    <step.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="mt-2 text-base font-semibold">{step.title}</p>
                  <p className="text-readable mt-1 text-sm leading-6">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-border/75 bg-background/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/65">
                Reading Principles
              </p>
              <ul className="mt-3 space-y-2 text-sm text-foreground/85">
                {readingPillars.map((pillar) => (
                  <li key={pillar} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
                    <span>{pillar}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </section>

      <section className="border-t border-border/60 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Purpose-built modules with clearer text visibility
            </h2>
            <p className="text-readable mx-auto mt-3 max-w-2xl">
              Each module keeps information readable at a glance and detailed on
              demand.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className={`glass-panel rise-in rounded-3xl p-6 transition duration-300 hover:-translate-y-1 ${
                  index % 3 === 1
                    ? "rise-in-delay-1"
                    : index % 3 === 2
                      ? "rise-in-delay-2"
                      : ""
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-accent/20">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                <p className="text-readable mt-2 text-sm leading-7">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              The product flow as a visual story
            </h2>
            <p className="text-readable mt-3 max-w-2xl">
              This layout helps users understand where they are, what happened,
              and what comes next.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bentoCards.map((item, index) => (
              <Card
                key={item.title}
                className={`glass-panel rounded-3xl p-6 transition duration-300 hover:-translate-y-1 ${item.span} ${
                  index % 2 === 0 ? "rise-in" : "rise-in rise-in-delay-1"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  0{index + 1}
                </p>
                <h3 className="mt-3 text-xl font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="text-readable mt-2 text-sm leading-7">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="glass-panel rise-in rounded-3xl border-border/80 p-8 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                  Ready to launch your new research interface?
                </h2>
                <p className="text-readable mt-3 max-w-2xl text-sm leading-8 sm:text-base">
                  Use high-clarity cards, readable long-form text, and a cleaner
                  hierarchy to improve trust and comprehension across the whole
                  product.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Button
                  asChild
                  size="lg"
                  className="shadow-lg shadow-primary/25"
                >
                  <Link href="/research">Launch Research</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/chat" className="gap-2">
                    Open Chat
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <Link href="/price">View Pricing</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border/70 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-foreground/70 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            ResearchAgent
          </div>
          <div className="flex items-center gap-6">
            <Link href="/price" className="transition hover:text-foreground">
              Pricing
            </Link>
            <Link
              href="/humanizer"
              className="transition hover:text-foreground"
            >
              Humanizer
            </Link>
            <Link href="/signin" className="transition hover:text-foreground">
              Login
            </Link>
            <Link href="/signup" className="transition hover:text-foreground">
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
