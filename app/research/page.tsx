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
      <div className="border-b border-border/50 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Research Agent</h1>
              <p className="text-muted-foreground">
                AI-powered research automation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ResearchInterface setSummaryData={setSummaryData} />
          </div>

          <div className="lg:col-span-1">
            {summaryData && <ResearchSummary summaryData={summaryData} />}
          </div>
        </div>
      </div>
    </div>
  );
}
