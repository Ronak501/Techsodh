"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { ShareDialog } from "@/components/share-dialog";
import { ResearchComments } from "@/components/research-comments";
import { useRealtimeCollaborators } from "@/lib/hooks/useRealtime";
import { researchNavigation } from "@/lib/navigation";
import {
  ArrowLeft,
  Calendar,
  CircleCheckBig,
  Download,
  FilePenLine,
  FileText,
  MessageSquareQuote,
  ShieldCheck,
  Sparkles,
  Workflow,
  Share2,
  Users,
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
  humanized_report?: ResearchSummaryData["report"];
  humanization_used?: boolean;
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
  const [useHumanized, setUseHumanized] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { collaborators } = useRealtimeCollaborators(params?.id || "");

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
          compact: true,
        },
        {
          label: "Completion tokens",
          value: data.completion_tokens || 0,
          icon: FileText,
          compact: true,
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

  const handleExport = async (format: "markdown" | "json" | "pdf") => {
    if (!data) return;
    try {
      const response = await fetch(`/api/research/${data.id}/export?format=${format}`);
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Export failed" }));
        toast.error(err.error || "Export failed");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "markdown" ? "research-report.md" : format === "json" ? "research-report.json" : "research-report.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download export. Please try again.");
    }
  };

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
                items={researchNavigation}
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
                <Button variant="outline" size="sm" onClick={() => handleExport("markdown")}>
                  <Download className="mr-2 h-4 w-4" />
                  Markdown
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport("json")}>
                  <Download className="mr-2 h-4 w-4" />
                  JSON
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShareDialog(true)}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                >
                  <MessageSquareQuote className="mr-2 h-4 w-4" />
                  Comments
                </Button>
                {collaborators.length > 0 && (
                  <div className="flex items-center gap-1 px-3 py-2 border rounded-md text-sm">
                    <Users className="h-4 w-4" />
                    <span>{collaborators.length}</span>
                  </div>
                )}
                <Button asChild size="sm">
                  <Link href={`/research/${data.id}/edit`}>
                    <FilePenLine className="mr-2 h-4 w-4" />
                    Edit Paper
                  </Link>
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

                  const valueClass = stat.compact
                    ? "mt-2 text-sm font-medium text-foreground"
                    : "mt-2 text-2xl font-semibold tracking-tight text-foreground";

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
                      <p className={valueClass}>{stat.value}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
            {reportQuality ? (
              <Card className="border-border/70 bg-card/70 p-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      Report quality
                    </p>
                    <h3 className="mt-1 text-sm font-semibold">
                      {reportQuality.verdict}
                    </h3>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {reportQuality.sourceCount} sources •{" "}
                    {reportQuality.evidenceStrength}
                  </div>
                </div>
              </Card>
            ) : null}

            {/* Feedback card moved to bottom and compacted to reduce UI complexity */}

            <ResearchSummary
              summaryData={{
                research_topic: data.query,
                research_mode: data.research_mode,
                template: data.template,
                settings: {
                  output_style: data.output_style || "balanced",
                  depth: data.depth || "standard",
                  model_name: data.model_name || "llama-3.3-70b-versatile",
                },
                outline: data.outline,
                report:
                  useHumanized && data.humanized_report
                    ? data.humanized_report
                    : data.report,
              }}
              showHumanizationToggle={
                !!data.humanized_report && data.humanization_used
              }
              isHumanized={useHumanized}
              onToggleHumanization={() => setUseHumanized(!useHumanized)}
            />

            {/* Comments Section */}
            {showComments && data && (
              <Card className="border-border/70 bg-card/70 p-5 shadow-sm">
                <ResearchComments researchId={data.id} />
              </Card>
            )}

            {/* Improved feedback UI: larger, clearer actions and note */}
            <Card className="border-border/70 bg-card/70 p-4 shadow-sm">
              <div className="flex flex-col md:flex-row items-start gap-4">
                <div className="md:w-1/3">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    Feedback
                  </p>
                  <h3 className="mt-1 text-sm font-semibold">
                    Was this report useful?
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Quick feedback helps improve future research results.
                  </p>
                  <div className="mt-3">
                    <Badge
                      variant="secondary"
                      className="gap-2 rounded-full px-3 py-1 text-sm"
                    >
                      <MessageSquareQuote className="h-3.5 w-3.5" />
                      {feedback?.rating || "No feedback yet"}
                    </Badge>
                  </div>
                </div>

                <div className="md:w-1/3 flex gap-2">
                  <Button
                    type="button"
                    variant={
                      feedback?.rating === "helpful" ? "default" : "outline"
                    }
                    className="flex-1"
                    size="sm"
                    onClick={() => submitFeedback("helpful")}
                    disabled={feedbackSaving}
                  >
                    Helpful
                  </Button>
                  <Button
                    type="button"
                    variant={
                      feedback?.rating === "needs_work" ? "default" : "outline"
                    }
                    className="flex-1"
                    size="sm"
                    onClick={() => submitFeedback("needs_work")}
                    disabled={feedbackSaving}
                  >
                    Needs work
                  </Button>
                  <Button
                    type="button"
                    variant={
                      feedback?.rating === "wrong" ? "default" : "outline"
                    }
                    className="flex-1"
                    size="sm"
                    onClick={() => submitFeedback("wrong")}
                    disabled={feedbackSaving}
                  >
                    Wrong
                  </Button>
                </div>

                <div className="md:w-1/3 flex flex-col gap-2">
                  <Textarea
                    value={feedbackNote}
                    onChange={(event) => setFeedbackNote(event.target.value.slice(0, 500))}
                    placeholder="Optional: short note (missing sources, unclear claim)"
                    className="min-h-18 text-sm"
                    maxLength={500}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        submitFeedback(feedback?.rating || "helpful")
                      }
                      disabled={feedbackSaving}
                    >
                      Save feedback
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setFeedback(null);
                        setFeedbackNote("");
                        setFeedbackStatus(null);
                      }}
                      disabled={feedbackSaving}
                    >
                      Clear
                    </Button>
                    <div className="ml-auto text-xs text-muted-foreground">
                      {feedbackNote.length}/500
                    </div>
                  </div>
                </div>
              </div>

              {feedbackStatus ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {feedbackStatus}
                </p>
              ) : null}
            </Card>
          </div>
        ) : null}
      </div>

      {/* Share Dialog */}
      {showShareDialog && data && (
        <ShareDialog
          researchId={data.id}
          onClose={() => setShowShareDialog(false)}
        />
      )}
    </div>
  );
}
