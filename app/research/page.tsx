"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ResearchInterface } from "@/components/research-interface";
import { ResearchSummary } from "@/components/research-summary";
import { ArrowLeft, FilePenLine } from "lucide-react";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import type { ResearchSummaryData } from "@/lib/research-types";

export default function ResearchPage() {
  const [summaryData, setSummaryData] = useState<ResearchSummaryData | null>(
    null,
  );

  const headerPills = [
    { label: "Mode guided", value: "Topic or claim" },
    { label: "Output", value: "Report + verdicts" },
    { label: "Shortcut", value: "Humanizer ready" },
  ];

  return (
    <div className="research-surface min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-linear-to-r from-card via-card/92 to-muted/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rise-in flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <MobileNavDrawer
                title="Research Navigation"
                items={[
                  { href: "/", label: "Home" },
                  { href: "/dashboard", label: "Dashboard" },
                  { href: "/chat", label: "Chat" },
                  { href: "/humanizer", label: "Humanizer" },
                  { href: "/research", label: "Research" },
                ]}
              />
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/humanizer" className="gap-2">
                  <FilePenLine className="w-4 h-4" />
                  Humanizer
                </Link>
              </Button>
              <div className="max-w-2xl space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">
                    Research Workspace
                  </span>
                  <span className="rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs text-muted-foreground">
                    Template guided
                  </span>
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                    New Research
                  </h1>
                  <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
                    Choose a template to shape the report before you search.
                    Topic research builds structured reviews, while claim
                    verification adds verdicts, fact checks, and evidence
                    strength.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {headerPills.map((pill) => (
                    <div
                      key={pill.label}
                      className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3"
                    >
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {pill.label}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {pill.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ResearchInterface setSummaryData={setSummaryData} />
          </div>

          <div className="lg:col-span-1 lg:sticky lg:top-6 lg:self-start">
            {summaryData && <ResearchSummary summaryData={summaryData} />}
          </div>
        </div>
      </div>
    </div>
  );
}
