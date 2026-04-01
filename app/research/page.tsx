"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ResearchInterface } from "@/components/research-interface";
import { ResearchSummary } from "@/components/research-summary";
import { ArrowLeft } from "lucide-react";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import type { ResearchSummaryData } from "@/lib/research-types";

export default function ResearchPage() {
  const [summaryData, setSummaryData] = useState<ResearchSummaryData | null>(
    null,
  );

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
                  { href: "/research", label: "Research" },
                ]}
              />
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Link>
              </Button>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Research Workspace
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-balance">
                  Research Agent
                </h1>
                <p className="max-w-xl text-sm text-muted-foreground">
                  Generate high-quality reports with references, confidence
                  scoring, and export-ready structure.
                </p>
              </div>
            </div>

            <div className="glass-panel rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              3D Interface Active
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
