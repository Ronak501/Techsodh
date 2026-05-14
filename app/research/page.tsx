"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ResearchInterface } from "@/components/research-interface";
import { ResearchSummary } from "@/components/research-summary";
import { ArrowLeft, FilePenLine, NotebookText, Sparkles } from "lucide-react";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { researchNavigation } from "@/lib/navigation";
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
    <div className="research-surface editorial-grid min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/60 bg-linear-to-r from-card via-card/92 to-muted/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rise-in flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <MobileNavDrawer
                title="Research Navigation"
                items={researchNavigation}
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
                  <p className="text-readable max-w-xl text-sm sm:text-base">
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
            {summaryData ? (
              <ResearchSummary summaryData={summaryData} />
            ) : (
              <Card className="glass-panel rise-in rounded-3xl border-border/70 p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Reading preview
                  </p>
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <h2 className="mt-3 text-xl font-semibold tracking-tight">
                  Your summary will appear here
                </h2>
                <p className="text-readable mt-2 text-sm leading-7">
                  Run a research query to see a structured summary with clear
                  sections, confidence markers, and export-ready insights.
                </p>
                <div className="mt-4 rounded-2xl border border-border/70 bg-background/60 p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    <NotebookText className="h-4 w-4 text-primary" />
                    What you get
                  </div>
                  <p className="text-readable mt-2 text-sm">
                    Executive summary, key findings, references, and readable
                    section-by-section analysis.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
