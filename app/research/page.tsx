"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ResearchInterface } from "@/components/research-interface";
import { ResearchSummary } from "@/components/research-summary";
import { ArrowLeft } from "lucide-react";
import type { ResearchSummaryData } from "@/lib/research-types";

export default function ResearchPage() {
  const [summaryData, setSummaryData] = useState<ResearchSummaryData | null>(
    null,
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-linear-to-r from-card via-card/90 to-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-balance">
                Research Agent
              </h1>
              <p className="text-sm text-muted-foreground">
                AI-powered research automation
              </p>
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
