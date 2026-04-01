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
  ArrowRight,
  Brain,
  Database,
  FileCheck2,
  Layers,
  MessageSquareText,
  Moon,
  Sparkles,
  Sun,
  Workflow,
} from "lucide-react";

interface Props {
  user: User | null;
}

const features = [
  {
    icon: Database,
    title: "Research Retrieval",
    description:
      "Collect high-signal references and structured evidence from your research pipeline.",
  },
  {
    icon: Workflow,
    title: "AI Pipeline",
    description:
      "Turn prompts into guided multi-step analysis with confidence and traceability.",
  },
  {
    icon: FileCheck2,
    title: "Report Quality",
    description:
      "Generate executive summaries, fact checks, references, and section confidence.",
  },
  {
    icon: MessageSquareText,
    title: "Team Conversations",
    description:
      "Keep context in persistent chat threads linked to your research work.",
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
            { href: "/chat", label: "Chat" },
            { href: "/price", label: "Pricing" },
          ]
        : [
            { href: "/signin", label: "Login" },
            { href: "/signup", label: "Sign Up" },
            { href: "/price", label: "Pricing" },
            { href: "/research", label: "Research" },
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

      <section className="relative overflow-hidden py-18 sm:py-24 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-8">
          <div className="rise-in space-y-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                AI Research Software
              </span>
              <span className="inline-flex items-center rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs text-muted-foreground">
                Built for real workflows
              </span>
            </div>

            <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              3D research workspace for faster, better decisions.
            </h1>

            <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              ResearchAgent combines retrieval, reasoning, report generation,
              and chat into one polished product experience your team can use
              every day.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-lg shadow-primary/25">
                <Link href="/research" className="gap-2">
                  Start Research
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/chat">Open AI Chat</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/price">Pricing</Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="glass-panel rise-in rise-in-delay-1 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Pipeline
                </p>
                <p className="mt-2 text-sm font-medium">
                  Retrieval to verdict in one flow
                </p>
              </div>
              <div className="glass-panel rise-in rise-in-delay-2 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Output
                </p>
                <p className="mt-2 text-sm font-medium">
                  Professional reports with references
                </p>
              </div>
              <div className="glass-panel rise-in rise-in-delay-3 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Collaboration
                </p>
                <p className="mt-2 text-sm font-medium">
                  Persistent chat for team context
                </p>
              </div>
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
                <p className="text-sm font-semibold">Live Research Orbit</p>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Step 1
                  </p>
                  <p className="mt-2 text-sm">
                    Gather sources and build outline
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Step 2
                  </p>
                  <p className="mt-2 text-sm">
                    Generate structured analysis and claims
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Step 3
                  </p>
                  <p className="mt-2 text-sm">
                    Export clean report and continue in chat
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything your software needs to scale research
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Use these modules together as one cohesive research product.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                <feature.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {feature.description}
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
                  Make this your team’s default research operating system.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base">
                  Start with one research request, validate with chat, and ship
                  export-ready output to clients or internal stakeholders.
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
