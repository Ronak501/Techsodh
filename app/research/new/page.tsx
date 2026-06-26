"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Brain, FileText, FilePenLine, Globe, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResearchInterface } from "@/components/research-interface";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { researchNavigation } from "@/lib/navigation";

const features = [
  { icon: Globe, label: "Live web search" },
  { icon: Brain, label: "AI synthesis" },
  { icon: FileText, label: "Structured report" },
  { icon: Zap, label: "Under 60 seconds" },
  { icon: FilePenLine, label: "Humanizer built-in" },
];

export default function NewResearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky top nav */}
      <div className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/25">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight">New Research</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="hidden gap-2 sm:flex">
              <Link href="/humanizer">
                <FilePenLine className="h-3.5 w-3.5" />
                Humanizer
              </Link>
            </Button>
            <MobileNavDrawer title="Research Navigation" items={researchNavigation} />
          </div>
        </div>
      </div>

      {/* Hero section */}
      <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-primary/[0.06] via-background to-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="relative mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            <Sparkles className="h-3 w-3" />
            Techsodh Research Engine
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Start a focused<br className="hidden sm:block" /> research run
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Ask any question, verify a claim, or explore a topic in depth.
            Get a structured, cited report ready to share.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {features.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm"
              >
                <Icon className="h-3 w-3 text-primary" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Research interface */}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
        <ResearchInterface
          setSummaryData={() => undefined}
          onReportGenerated={(reportId) => router.push(`/research/${reportId}`)}
          initialQuery={initialQuery}
        />
      </main>
    </div>
  );
}
