"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText } from "lucide-react";

interface ResearchSummaryProps {
  summary: string;
  keyFindings: string[];
  metrics: {
    accuracy: number;
    relevance: number;
    coverage: number;
  };
  citations: {
    title: string;
    authors: string;
    year: number;
  }[];
}

export function ResearchSummary({
  summary,
  keyFindings,
  metrics,
  citations,
}: ResearchSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="p-6 border-border/50 bg-linear-to-br from-card/50 to-card/30">
        <h3 className="font-semibold mb-4">AI Research Summary</h3>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          {summary}
        </p>

        <div className="space-y-3">
          {keyFindings.map((finding, index) => (
            <div key={index} className="flex gap-3 items-start">
              <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Key Finding {index + 1}</p>
                <p className="text-sm text-muted-foreground">{finding}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Metrics */}
      <Card className="p-6 border-border/50 bg-card/50">
        <h3 className="font-semibold mb-4">Quality Metrics</h3>

        <div className="grid grid-cols-3 gap-4">
          <MetricCard title="Accuracy" value={metrics.accuracy} />
          <MetricCard title="Relevance" value={metrics.relevance} />
          <MetricCard title="Coverage" value={metrics.coverage} />
        </div>
      </Card>

      {/* Citations */}
      <Card className="p-6 border-border/50 bg-card/50">
        <h3 className="font-semibold mb-4">Citations & Sources</h3>

        <div className="space-y-3">
          {citations.map((citation, index) => (
            <div
              key={index}
              className="p-3 rounded border border-border/50 bg-card/30"
            >
              <div className="flex gap-3 items-start">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{citation.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {citation.authors}, {citation.year}
                  </p>
                </div>

                <Badge variant="outline">Cited</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="p-3 rounded-lg bg-card/50 border border-border/50">
      <p className="text-xs text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-bold text-accent">{value}%</p>
    </div>
  );
}
