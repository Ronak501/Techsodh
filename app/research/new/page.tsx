"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FilePenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResearchInterface } from "@/components/research-interface";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";

const launchSignals = [
  "Template-guided flow",
  "Claim verdict support",
  "Humanizer shortcut built in",
] as const;

export default function NewResearchPage() {
  const router = useRouter();

  return (
    <div className="research-surface min-h-screen bg-background">
      <div className="border-b border-border/60 bg-linear-to-r from-card via-card/92 to-muted/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-4">
              <MobileNavDrawer
                title="Research Navigation"
                items={[
                  { href: "/", label: "Home" },
                  { href: "/dashboard", label: "Dashboard" },
                  { href: "/research", label: "Research" },
                  { href: "/humanizer", label: "Humanizer" },
                  { href: "/chat", label: "Chat" },
                ]}
              />
              <Button asChild variant="ghost" size="sm" className="w-fit">
                <Link href="/research" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to workspace
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-fit gap-2"
              >
                <Link href="/humanizer">
                  <FilePenLine className="h-4 w-4" />
                  Humanizer
                </Link>
              </Button>
              <div className="max-w-2xl space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">
                    <Sparkles className="mr-2 h-3.5 w-3.5" />
                    New Research
                  </span>
                  <span className="inline-flex items-center rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs text-muted-foreground">
                    Start from a clean slate
                  </span>
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                    Launch a focused research run
                  </h1>
                  <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                    This page is the starting point for new work: choose a
                    template, tune the settings, and generate a report that is
                    structured enough to review and share.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {launchSignals.map((signal) => (
                    <span
                      key={signal}
                      className="rounded-full border border-border/60 bg-background/70 px-3 py-1"
                    >
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-5xl">
          <ResearchInterface
            setSummaryData={() => undefined}
            onReportGenerated={(reportId) => {
              router.push(`/research/${reportId}`);
            }}
          />
        </div>
      </main>
    </div>
  );
}
