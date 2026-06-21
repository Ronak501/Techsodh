"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Search, Loader2, CheckCircle, Save } from "lucide-react";
import type {
  ResearchPreferences,
  ResearchSummaryData,
  ResearchTemplate,
} from "@/lib/research-types";

const templateDescriptions: Record<ResearchTemplate, string> = {
  literature_review:
    "Best for surveying sources, comparing viewpoints, and building a structured overview.",
  technical_report:
    "Best for formal analysis with methods, findings, and implementation-focused detail.",
  claim_verification:
    "Best for checking whether a claim is supported, contradicted, or still uncertain.",
};

const modeTabs = [
  {
    value: "topic" as const,
    label: "Topic Research",
    description: "Explore a subject and generate a full report.",
  },
  {
    value: "claim" as const,
    label: "Claim Verification",
    description: "Test one statement against evidence and sources.",
  },
];

type ResearchResult = {
  id: string;
  title: string;
  authors: string;
  abstract: string;
  citations: number;
  relevance: number;
};

type StreamProgress = {
  step: string;
  detail: string;
};

interface Props {
  setSummaryData: (data: ResearchSummaryData) => void;
  onReportGenerated?: (reportId: string) => void;
}

const defaultPreferences: ResearchPreferences = {
  preferred_template: "literature_review",
  output_style: "balanced",
  depth: "standard",
  model_name: "llama-3.3-70b-versatile",
};

export function ResearchInterface({
  setSummaryData,
  onReportGenerated,
}: Props) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"topic" | "claim">("topic");
  const [template, setTemplate] =
    useState<ResearchTemplate>("literature_review");
  const [preferences, setPreferences] =
    useState<ResearchPreferences>(defaultPreferences);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [streamProgress, setStreamProgress] = useState<StreamProgress[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [upgradeUrl, setUpgradeUrl] = useState<string | null>(null);
  const isClaimMode = mode === "claim";

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch("/api/research/preferences");
        if (!response.ok) return;
        const data = (await response.json()) as ResearchPreferences;

        setPreferences(data);
        setTemplate(data.preferred_template);
        setMode(
          data.preferred_template === "claim_verification" ? "claim" : "topic",
        );
      } catch (error) {
        console.error("Failed to load preferences", error);
      } finally {
        setPreferencesLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const savePreferences = async () => {
    setSavingPreferences(true);

    try {
      const payload: ResearchPreferences = {
        ...preferences,
        preferred_template: template,
      };

      const response = await fetch("/api/research/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }
    } catch (error) {
      console.error("Preferences save error", error);
    } finally {
      setSavingPreferences(false);
    }
  };

  const pushProgress = (progress: StreamProgress) => {
    setStreamProgress((prev) => [...prev, progress]);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setStreamProgress([]);
    setApiError(null);
    setUpgradeUrl(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          mode,
          template,
          settings: {
            output_style: preferences.output_style,
            depth: preferences.depth,
            model_name: preferences.model_name,
          },
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setUpgradeUrl(
          typeof errorData?.upgrade_url === "string"
            ? errorData.upgrade_url
            : null,
        );
        throw new Error(errorData.error || "Unknown error");
      }

      if (!response.body) {
        throw new Error("No response stream from server");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completed: ResearchSummaryData | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";

        for (const block of blocks) {
          const lines = block
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);

          const eventLine = lines.find((line) => line.startsWith("event:"));
          const dataLine = lines.find((line) => line.startsWith("data:"));

          if (!eventLine || !dataLine) continue;

          const event = eventLine.replace("event:", "").trim();
          const data = JSON.parse(dataLine.replace("data:", "").trim());

          if (event === "progress") {
            pushProgress({
              step: data.step || "progress",
              detail: data.detail || "Working...",
            });
          }

          if (event === "error") {
            throw new Error(data.message || "Streaming failed");
          }

          if (event === "complete") {
            completed = data as ResearchSummaryData;
          }
        }
      }

      if (!completed) {
        throw new Error("No completed payload from stream");
      }

      const generatedReport = completed.report;

      setResults([
        {
          id: completed.id || crypto.randomUUID(),
          title: "AI Research Report",
          authors: "AI TechSodh",
          abstract:
            generatedReport?.executive_summary || "No summary available",
          citations: Array.isArray(generatedReport?.references)
            ? generatedReport.references.length
            : 0,
          relevance: 0.95,
        },
      ]);

      setSummaryData(completed);

      if (completed.id && onReportGenerated) {
        onReportGenerated(completed.id);
      }
    } catch (error) {
      console.error("API Error:", error);
      setApiError(error instanceof Error ? error.message : "Request failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  return (
    <div className="space-y-10">
      <Card className="overflow-hidden border-border/70 bg-card/70 shadow-sm backdrop-blur">
        <div className="border-b border-border/60 bg-muted/25 px-5 py-5 sm:px-8 sm:py-6">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Research Workspace
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance">
            Compose Your Research Request
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select the method, tune output preferences, and generate a
            structured report.
          </p>
        </div>

        <div className="p-5 sm:p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">
                Research Mode
              </label>
              <div
                role="tablist"
                aria-label="Research mode"
                className="grid gap-2 rounded-2xl border border-border/60 bg-muted/20 p-2 sm:grid-cols-2"
              >
                {modeTabs.map((item) => {
                  const selected = mode === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      className={
                        selected
                          ? "rounded-xl border border-primary/35 bg-primary/10 px-4 py-3 text-left transition"
                          : "rounded-xl border border-transparent px-4 py-3 text-left transition hover:bg-background/60"
                      }
                      onClick={() => {
                        setMode(item.value);
                        if (item.value === "claim") {
                          setTemplate("claim_verification");
                        } else if (template === "claim_verification") {
                          setTemplate("literature_review");
                        }
                      }}
                    >
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Template</label>
              <select
                className="h-11 w-full rounded-lg border border-border/70 bg-background px-3 text-sm"
                value={template}
                onChange={(e) =>
                  setTemplate(e.target.value as ResearchTemplate)
                }
                disabled={isClaimMode}
              >
                <option value="literature_review">Literature Review</option>
                <option value="technical_report">Technical Report</option>
                <option value="claim_verification">Claim Verification</option>
              </select>
              <p className="mt-2 text-xs text-muted-foreground">
                {templateDescriptions[template]}
                {isClaimMode
                  ? " Claim verification always uses the claim template so the report includes verdicts, fact checks, and evidence strength."
                  : " The template controls the structure, tone, and analysis sections in the final report."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Output Style
                </label>
                <select
                  className="h-11 w-full rounded-lg border border-border/70 bg-background px-3 text-sm"
                  value={preferences.output_style}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      output_style: e.target
                        .value as ResearchPreferences["output_style"],
                    }))
                  }
                  disabled={preferencesLoading}
                >
                  <option value="balanced">Balanced</option>
                  <option value="concise">Concise</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Depth</label>
                <select
                  className="h-11 w-full rounded-lg border border-border/70 bg-background px-3 text-sm"
                  value={preferences.depth}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      depth: e.target.value as ResearchPreferences["depth"],
                    }))
                  }
                  disabled={preferencesLoading}
                >
                  <option value="standard">Standard</option>
                  <option value="deep">Deep</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Model</label>
                <Input
                  value={preferences.model_name}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      model_name: e.target.value,
                    }))
                  }
                  disabled={preferencesLoading}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={savePreferences}
                disabled={preferencesLoading || savingPreferences}
              >
                {savingPreferences ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Preferences
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">
                {isClaimMode ? "Claim" : "Research Query"}
              </label>
              <p className="mb-3 text-xs text-muted-foreground">
                {isClaimMode
                  ? "Enter one statement you want checked. The claim template will generate verdicts and fact checks."
                  : "Be specific about scope, timeline, and expected output quality for better results."}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder={
                    isClaimMode
                      ? "Enter a claim to verify..."
                      : "Enter your research query..."
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-11 flex-1 bg-input border-border/60"
                />
                <Button
                  onClick={handleSearch}
                  disabled={!query.trim() || isSearching}
                  className="h-11 w-full bg-primary hover:bg-primary/90 sm:w-auto sm:min-w-11"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="border-t border-border/50 pt-6">
              <label className="block text-sm font-medium mb-3">
                Upload Document (Optional)
              </label>
              <div className="rounded-lg border-2 border-dashed border-border/50 p-5 text-center transition hover:border-accent/50 sm:p-6">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.txt,.docx"
                />
                <label
                  htmlFor="file-upload"
                  className="flex cursor-pointer flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {uploadedFile
                      ? uploadedFile.name
                      : "Click to upload or drag and drop"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF, TXT, or DOCX
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {isSearching && streamProgress.length > 0 ? (
        <Card className="border-border/70 bg-card/70 p-5">
          <h4 className="font-semibold">Live Progress</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            The report is generated in multiple stages and will appear as soon
            as processing completes.
          </p>
          <ul className="mt-4 max-h-52 space-y-2 overflow-auto pr-1 text-sm text-muted-foreground">
            {streamProgress.map((item, index) => (
              <li
                key={`${item.step}-${index}`}
                className="report-copy rounded-lg border border-border/60 bg-muted/25 px-3 py-2"
              >
                <span className="font-medium text-foreground/90">
                  {item.step}
                </span>
                : {item.detail}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {apiError ? (
        <Card className="border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{apiError}</p>
          {upgradeUrl ? (
            <Button asChild size="sm" className="mt-3">
              <Link href={upgradeUrl}>Upgrade Subscription</Link>
            </Button>
          ) : null}
        </Card>
      ) : null}

      {hasSearched && (
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            {!isSearching && results.length > 0 && (
              <CheckCircle className="w-5 h-5 text-accent" />
            )}
            Research Results ({results.length} found)
          </h3>

          {isSearching ? (
            <Card className="flex items-center justify-center gap-3 border-border/70 bg-card/70 p-12">
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
              <span className="report-copy text-muted-foreground">
                Running multi-step research pipeline...
              </span>
            </Card>
          ) : (
            <div className="grid gap-4">
              {results.map((result) => (
                <Card
                  key={result.id}
                  className="border-border/70 bg-card/70 p-6 transition hover:bg-card"
                >
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-balance text-base font-semibold">
                        {result.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {result.authors}
                      </p>
                    </div>
                    <p className="report-copy max-h-24 overflow-auto pr-1 text-sm text-foreground/90">
                      {result.abstract}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
                      <div className="flex gap-6 text-xs text-muted-foreground">
                        <span>{result.citations} citations</span>
                        <span>
                          Relevance: {(result.relevance * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/research/${result.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
