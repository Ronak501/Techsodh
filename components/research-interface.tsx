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
}

const defaultPreferences: ResearchPreferences = {
  preferred_template: "literature_review",
  output_style: "balanced",
  depth: "standard",
  model_name: "gemini-default",
};

export function ResearchInterface({ setSummaryData }: Props) {
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

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch("/api/research/preferences");
        if (!response.ok) return;
        const data = (await response.json()) as ResearchPreferences;

        setPreferences(data);
        setTemplate(data.preferred_template);
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
          authors: "AI Research Agent",
          abstract: generatedReport?.executive_summary || "No summary available",
          citations: Array.isArray(generatedReport?.references)
            ? generatedReport.references.length
            : 0,
          relevance: 0.95,
        },
      ]);

      setSummaryData(completed);
    } catch (error) {
      console.error("API Error:", error);
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
    <div className="space-y-8">
      <Card className="p-8 border-border/50 bg-card/50">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3">Research Mode</label>
            <div className="grid sm:grid-cols-2 gap-2">
              <Button
                type="button"
                variant={mode === "topic" ? "default" : "outline"}
                onClick={() => {
                  setMode("topic");
                  if (template === "claim_verification") {
                    setTemplate("literature_review");
                  }
                }}
              >
                Topic Research
              </Button>
              <Button
                type="button"
                variant={mode === "claim" ? "default" : "outline"}
                onClick={() => {
                  setMode("claim");
                  setTemplate("claim_verification");
                }}
              >
                Claim Verification
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Template</label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={template}
              onChange={(e) => setTemplate(e.target.value as ResearchTemplate)}
            >
              <option value="literature_review">Literature Review</option>
              <option value="technical_report">Technical Report</option>
              <option value="claim_verification">Claim Verification</option>
            </select>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Output Style</label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={preferences.output_style}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    output_style: e.target.value as ResearchPreferences["output_style"],
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
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
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
              {mode === "claim" ? "Claim" : "Research Query"}
            </label>
            <div className="flex gap-2">
              <Input
                placeholder={
                  mode === "claim"
                    ? "Enter a claim to verify..."
                    : "Enter your research query..."
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 bg-input border-border/50"
              />
              <Button
                onClick={handleSearch}
                disabled={!query.trim() || isSearching}
                className="bg-primary hover:bg-primary/90"
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
            <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-accent/50 transition">
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".pdf,.txt,.docx"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
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
      </Card>

      {isSearching && streamProgress.length > 0 ? (
        <Card className="p-4 border-border/50 bg-card/50">
          <h4 className="font-semibold mb-2">Live Progress</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {streamProgress.map((item, index) => (
              <li key={`${item.step}-${index}`}>
                {item.step}: {item.detail}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {hasSearched && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            {!isSearching && results.length > 0 && (
              <CheckCircle className="w-5 h-5 text-accent" />
            )}
            Research Results ({results.length} found)
          </h3>

          {isSearching ? (
            <Card className="p-12 border-border/50 bg-card/50 flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
              <span className="text-muted-foreground">
                Running multi-step research pipeline...
              </span>
            </Card>
          ) : (
            <div className="grid gap-4">
              {results.map((result) => (
                <Card
                  key={result.id}
                  className="p-6 border-border/50 bg-card/50 hover:bg-card/80 transition"
                >
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-base">
                        {result.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {result.authors}
                      </p>
                    </div>
                    <p className="text-sm">{result.abstract}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
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