"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { useTheme } from "next-themes";
import { createClient } from "@/utils/supabase/client";
import { useMemo, useState, type MouseEvent } from "react";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  Database,
  FileBarChart,
  FileCheck2,
  FilePenLine,
  Globe,
  Layers,
  Lock,
  MessageSquareText,
  Moon,
  Rocket,
  Sparkles,
  Sun,
  Timer,
  WandSparkles,
  Workflow,
} from "lucide-react";

interface Props {
  user: User | null;
}

const features = [
  {
    icon: Database,
    title: "Source-Backed Research",
    description:
      "Pull references, evidence tags, and confidence signals into a structured report pipeline.",
  },
  {
    icon: Workflow,
    title: "Orchestrated AI Flow",
    description:
      "Move from prompt to outline to analysis with explicit progress and clear stage boundaries.",
  },
  {
    icon: FileCheck2,
    title: "Quality Controls",
    description:
      "Generate summaries, fact checks, verdict confidence, and reference metadata by default.",
  },
  {
    icon: MessageSquareText,
    title: "Persistent Chat Context",
    description:
      "Keep follow-up questions and revisions tied to each research flow in one thread.",
  },
  {
    icon: FilePenLine,
    title: "Human Writing Pass",
    description:
      "Polish generated output so final copy reads like a thoughtful human draft.",
  },
  {
    icon: Lock,
    title: "Usage + Access Control",
    description:
      "Built-in token control, subscription checks, and API safety for production usage.",
  },
];

const heroStats = [
  { label: "Avg report speed", value: "< 40 sec" },
  { label: "Source confidence", value: "Structured" },
  { label: "Writing finish", value: "Humanized" },
  { label: "Deploy ready", value: "API-first" },
];

const productFlow = [
  {
    icon: Globe,
    title: "Capture context",
    description: "Start with a topic or claim and define depth + output style.",
  },
  {
    icon: FileBarChart,
    title: "Generate analysis",
    description:
      "Build outline, report body, references, and confidence markers in one run.",
  },
  {
    icon: WandSparkles,
    title: "Humanize final draft",
    description:
      "Apply a writing pass that keeps meaning intact but sounds naturally authored.",
  },
  {
    icon: Rocket,
    title: "Ship output",
    description:
      "Export, share with teams, and continue iterations in linked chat.",
  },
];

const trustSignals = [
  { icon: Activity, label: "Resilient retries", value: "429/5xx aware" },
  { icon: Timer, label: "Rate-limited safely", value: "Retry-After honored" },
  { icon: CheckCircle2, label: "Schema-aware JSON", value: "Repair + parse" },
];

const bentoCards = [
  {
    title: "Analyst cockpit",
    description:
      "A command center for topic research, claim checks, and confidence scoring.",
    span: "lg:col-span-2",
  },
  {
    title: "Human text editor",
    description:
      "Transform robotic language into natural writing without losing data.",
    span: "",
  },
  {
    title: "Threaded decisions",
    description:
      "Keep follow-up decisions and revisions linked to each project.",
    span: "",
  },
  {
    title: "Export-ready outputs",
    description:
      "Move from draft to markdown, json, and pdf exports with one workflow.",
    span: "lg:col-span-2",
  },
];

export default function HomeClient({ user }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const supabase = createClient();
  const router = useRouter();

  const [orbitTransform, setOrbitTransform] = useState(
    "perspective(1500px) rotateX(5deg) rotateY(-8deg) translateZ(0)",
  );

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

  const onOrbitMove = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    const rotateY = (x - 0.5) * 14;
    const rotateX = (0.5 - y) * 10;

    setOrbitTransform(
      `perspective(1500px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(0)`,
    );
  };

  const onOrbitLeave = () => {
    setOrbitTransform(
      "perspective(1500px) rotateX(5deg) rotateY(-8deg) translateZ(0)",
    );
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
    <div className="home-surface min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-primary to-accent text-primary-foreground shadow-md shadow-primary/30">
              <Brain className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
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

      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-8">
          <div className="rise-in space-y-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Modern Research Platform
              </span>
              <span className="inline-flex items-center rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs text-muted-foreground">
                Built for product teams
              </span>
            </div>

            <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Design smarter insights, not just longer reports.
            </h1>

            <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              ResearchAgent combines structured analysis, source-backed
              reasoning, and human-like writing into a polished interface your
              team can trust for daily decision-making.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-lg shadow-primary/25">
                <Link href="/research" className="gap-2">
                  Start New Research
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
                <Link href="/price">Pricing</Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {heroStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground/90">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative mx-auto hidden w-full max-w-xl lg:block"
            onMouseMove={onOrbitMove}
            onMouseLeave={onOrbitLeave}
          >
            <Card
              className="glass-panel tilt-card parallax-card float-soft rounded-3xl p-6"
              style={{ transform: orbitTransform }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Live workflow board</p>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="mt-5 space-y-3">
                {productFlow.map((step, index) => (
                  <div
                    key={step.title}
                    className="rounded-2xl border border-border/70 bg-background/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        0{index + 1}
                      </p>
                      <step.icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="mt-2 text-sm font-semibold">{step.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {trustSignals.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-border/70 bg-background/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <item.icon className="h-4 w-4 text-primary" />
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {item.label}
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Purpose-built modules for modern research teams
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Every block is designed to work independently and as a connected
              system.
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
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
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
              Product experience, laid out as a visual system
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              A bento layout that maps your full experience from analysis to
              final delivery.
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
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 py-18 sm:py-22">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="glass-panel rise-in rounded-3xl p-8 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                  Ready to launch a modern research UI in production?
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base">
                  Start from one query, validate confidence in context, and
                  publish a human-ready output your clients can trust.
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
                  <Link href="/humanizer">Open Humanizer</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
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
