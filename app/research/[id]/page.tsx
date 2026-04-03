"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CircleCheckBig,
  Download,
  FilePenLine,
  FileText,
  Flag,
  HelpCircle,
  MessageSquareQuote,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
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
  source_count?: number;
  latency_ms?: number;
  outline: ResearchSummaryData["outline"];
  report: ResearchSummaryData["report"];
  created_at: string;
  updated_at?: string;
};

type ReportFeedback = {
  id: string;
  report_id: string;
  rating: "helpful" | "needs_work" | "wrong";
  note?: string | null;
  created_at: string;
  updated_at: string;
} | null;

export default function ResearchDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ResearchReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ReportFeedback>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [feedbackSaving, setFeedbackSaving] = useState(false);

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

  useEffect(() => {
    const loadFeedback = async () => {
      if (!params.id) return;

      try {
        const response = await fetch(`/api/research/${params.id}/feedback`);
        if (!response.ok) return;

        const payload = (await response.json()) as { feedback: ReportFeedback };
        setFeedback(payload.feedback);
        setFeedbackNote(payload.feedback?.note || "");
      } catch {
        setFeedback(null);
      }
    };

    loadFeedback();
  }, [params.id]);

  const detailPills = data
    ? [
        { label: "Mode", value: data.research_mode || "topic" },
        { label: "Template", value: data.template || "literature_review" },
        { label: "Depth", value: data.depth || "standard" },
        { label: "Status", value: data.status },
      ]
    : [];

  const detailStats = data
    ? [
        {
          label: "Sources",
          value: data.source_count || data.report?.references?.length || 0,
          icon: ShieldCheck,
        },
        {
          label: "Prompt tokens",
          value: data.prompt_tokens || 0,
          icon: Workflow,
        },
        {
          label: "Completion tokens",
          value: data.completion_tokens || 0,
          icon: FileText,
        },
        {
          label: "Estimated cost",
          value: `$${Number(data.estimated_cost_usd || 0).toFixed(4)}`,
          icon: Sparkles,
        },
        {
          label: "Latency",
          value: data.latency_ms
            ? `${Math.round(data.latency_ms / 1000)}s`
            : "-",
          icon: CircleCheckBig,
        },
      ]
    : [];

  const reportQuality = useMemo(() => {
    if (!data) return null;

    const verdict = data.report?.verdict || "No verdict";
    const evidenceStrength =
      data.report?.evidence_strength?.overall || "moderate";
    const confidence = data.report?.verdict_confidence;

    return {
      verdict,
      evidenceStrength,
      confidence,
      sourceCount: data.source_count || data.report?.references?.length || 0,
    };
  }, [data]);

  const submitFeedback = async (rating: "helpful" | "needs_work" | "wrong") => {
    if (!params.id) return;

    setFeedbackSaving(true);
    setFeedbackStatus(null);

    try {
      const response = await fetch(`/api/research/${params.id}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          note: feedbackNote.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error || "Failed to save feedback");
      }

      const payload = (await response.json()) as {
        ok: boolean;
        rating: typeof rating;
      };
      setFeedbackStatus(payload.ok ? "Feedback saved" : "Feedback not saved");
      setFeedback({
        id: feedback?.id || `${params.id}-${rating}`,
        report_id: params.id,
        rating: payload.rating,
        note: feedbackNote.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      setFeedbackStatus(err instanceof Error ? err.message : "Feedback failed");
    } finally {
      setFeedbackSaving(false);
    }
  };

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
                  { href: "/research/new", label: "New Research" },
                  { href: "/humanizer", label: "Humanizer" },
                  { href: "/chat", label: "Chat" },
                ]}
              />
              <Button asChild variant="ghost" size="sm" className="w-fit">
                <Link href="/research/new" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to new research
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

              <div className="max-w-3xl space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">
                    <Sparkles className="mr-2 h-3.5 w-3.5" />
                    Research Report
                  </span>
                  {data ? (
                    <span className="inline-flex items-center rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs text-muted-foreground">
                      Ready to review
                    </span>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                    {data?.query || "Research report"}
                  </h1>
                  <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                    Review the full output here with metadata, references,
                    verdicts, and downloadable exports.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  {detailPills.map((pill) => (
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

            {data ? (
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button asChild variant="outline" size="sm">
                  <a href={`/api/research/${data.id}/export?format=markdown`}>
                    <Download className="mr-2 h-4 w-4" />
                    Markdown
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={`/api/research/${data.id}/export?format=json`}>
                    <Download className="mr-2 h-4 w-4" />
                    JSON
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={`/api/research/${data.id}/export?format=pdf`}>
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </a>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {loading ? (
          <Card className="border-border/70 bg-card/70 p-6 text-sm text-muted-foreground shadow-sm">
            Loading report...
          </Card>
        ) : null}

        {!loading && error ? (
          <Card className="border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive shadow-sm">
            {error}
          </Card>
        ) : null}

        {!loading && !error && data ? (
          <div className="space-y-6">
            <Card className="border-border/70 bg-card/70 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Report overview
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The detail page is the primary reading surface for the
                    completed research.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(data.created_at).toLocaleString()}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {detailStats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-border/60 bg-background/70 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                          {stat.label}
                        </p>
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                        {stat.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>

            {reportQuality ? (
              <Card className="border-border/70 bg-card/70 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Report quality
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight">
                      What this report is saying
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      A compact review layer for verdict, evidence strength, and
                      source coverage.
                    </p>
                  </div>
                  <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                    {reportQuality.sourceCount} sources indexed
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Verdict
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {reportQuality.verdict}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Evidence strength
                    </p>
                    <p className="mt-2 text-lg font-semibold capitalize">
                      {reportQuality.evidenceStrength}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Confidence
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {typeof reportQuality.confidence === "number"
                        ? `${reportQuality.confidence}%`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </Card>
            ) : null}

            <Card className="border-border/70 bg-card/70 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Feedback loop
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight">
                    Tell us if the report was useful
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Capture human review so the research workflow can improve
                    over time.
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="gap-2 rounded-full px-3 py-1"
                >
                  <MessageSquareQuote className="h-3.5 w-3.5" />
                  {feedback?.rating || "No feedback yet"}
                </Badge>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <Button
                  type="button"
                  variant={
                    feedback?.rating === "helpful" ? "default" : "outline"
                  }
                  className="justify-start"
                  onClick={() => submitFeedback("helpful")}
                  disabled={feedbackSaving}
                >
                  <HelpCircle className="h-4 w-4" />
                  Helpful
                </Button>
                <Button
                  type="button"
                  variant={
                    feedback?.rating === "needs_work" ? "default" : "outline"
                  }
                  className="justify-start"
                  onClick={() => submitFeedback("needs_work")}
                  disabled={feedbackSaving}
                >
                  <Flag className="h-4 w-4" />
                  Needs work
                </Button>
                <Button
                  type="button"
                  variant={feedback?.rating === "wrong" ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => submitFeedback("wrong")}
                  disabled={feedbackSaving}
                >
                  <ArrowRight className="h-4 w-4" />
                  Wrong
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                <Textarea
                  value={feedbackNote}
                  onChange={(event) => setFeedbackNote(event.target.value)}
                  placeholder="Leave a short note about missing sources, unclear claims, or anything useful for the next run."
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Notes are saved with the rating and tied to this report.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      submitFeedback(feedback?.rating || "helpful")
                    }
                    disabled={feedbackSaving}
                    className="gap-2"
                  >
                    Save note
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                {feedbackStatus ? (
                  <p className="text-sm text-muted-foreground">
                    {feedbackStatus}
                  </p>
                ) : null}
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
