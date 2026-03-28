"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import { ResearchSummary } from "@/components/research-summary";
import type {
  ResearchSummaryData,
  ResearchTemplate,
} from "@/lib/research-types";

type ResearchReport = {
  id: string;
  query: string;
  status: "in_progress" | "completed" | "failed";
  research_mode?: "topic" | "claim";
  template?: ResearchTemplate;
  output_style?: "balanced" | "concise" | "detailed";
  depth?: "standard" | "deep";
  model_name?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  estimated_cost_usd?: number;
  outline: ResearchSummaryData["outline"];
  report: ResearchSummaryData["report"];
  created_at: string;
};

export default function ResearchDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ResearchReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/research/${params.id}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load report");
        }

        setData(payload);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load report";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadReport();
    }
  }, [params.id]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Research Report</h1>
              <p className="text-muted-foreground">
                View and export a persisted report
              </p>
            </div>
          </div>

          {data ? (
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={`/api/research/${data.id}/export?format=markdown`}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Markdown
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={`/api/research/${data.id}/export?format=json`}>
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={`/api/research/${data.id}/export?format=pdf`}>
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </a>
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? <Card className="p-6">Loading report...</Card> : null}

        {!loading && error ? (
          <Card className="p-6 text-red-500">{error}</Card>
        ) : null}

        {!loading && !error && data ? (
          <div className="space-y-6">
            <Card className="p-4 border-border/50 bg-card/40">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <p>
                  <span className="font-semibold">Mode:</span>{" "}
                  {data.research_mode || "topic"}
                </p>
                <p>
                  <span className="font-semibold">Template:</span>{" "}
                  {data.template || "literature_review"}
                </p>
                <p>
                  <span className="font-semibold">Output Style:</span>{" "}
                  {data.output_style || "balanced"}
                </p>
                <p>
                  <span className="font-semibold">Depth:</span>{" "}
                  {data.depth || "standard"}
                </p>
                <p>
                  <span className="font-semibold">Model:</span>{" "}
                  {data.model_name || "gemini-default"}
                </p>
                <p>
                  <span className="font-semibold">Estimated Cost:</span> $
                  {Number(data.estimated_cost_usd || 0).toFixed(4)}
                </p>
                <p>
                  <span className="font-semibold">Prompt Tokens:</span>{" "}
                  {data.prompt_tokens || 0}
                </p>
                <p>
                  <span className="font-semibold">Completion Tokens:</span>{" "}
                  {data.completion_tokens || 0}
                </p>
              </div>
            </Card>

            <ResearchSummary
              summaryData={{
                research_topic: data.query,
                research_mode: data.research_mode,
                template: data.template,
                settings: {
                  output_style: data.output_style || "balanced",
                  depth: data.depth || "standard",
                  model_name: data.model_name || "gemini-default",
                },
                outline: data.outline,
                report: data.report,
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
