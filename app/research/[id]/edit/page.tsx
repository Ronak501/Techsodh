"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileCheck2, Save, Sparkles, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  PaperStatus,
  ResearchPaperDocument,
  ResearchPaperReview,
  ResearchPaperSection,
} from "@/lib/research-types";

type PaperResponse = {
  id: string;
  title: string;
  status: PaperStatus;
  current_version: number;
  document_json: ResearchPaperDocument;
  review_json?: ResearchPaperReview;
};

export default function ResearchPaperEditorPage() {
  const params = useParams<{ id: string }>();

  const [paperId, setPaperId] = useState<string | null>(null);
  const [document, setDocument] = useState<ResearchPaperDocument | null>(null);
  const [version, setVersion] = useState<number>(1);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ensurePaper = async () => {
      if (!params.id) return;

      setIsLoading(true);
      setError(null);

      try {
        const listResponse = await fetch(
          `/api/research/papers?report_id=${params.id}`,
        );
        if (!listResponse.ok) {
          throw new Error("Failed to query existing papers");
        }

        const listPayload = (await listResponse.json()) as {
          papers: Array<{ id: string }>;
        };

        let resolvedPaperId = listPayload.papers?.[0]?.id || null;

        if (!resolvedPaperId) {
          const createResponse = await fetch("/api/research/papers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ report_id: params.id }),
          });

          if (!createResponse.ok) {
            const payload = await createResponse.json();
            throw new Error(
              payload?.error || "Failed to create research paper",
            );
          }

          const createPayload = (await createResponse.json()) as {
            paper_id: string;
          };
          resolvedPaperId = createPayload.paper_id;
        }

        const paperResponse = await fetch(
          `/api/research/papers/${resolvedPaperId}`,
        );
        if (!paperResponse.ok) {
          const payload = await paperResponse.json();
          throw new Error(payload?.error || "Failed to load paper");
        }

        const payload = (await paperResponse.json()) as PaperResponse;
        setPaperId(payload.id);
        setVersion(payload.current_version);
        setDocument(payload.document_json);
        setSelectedSectionId(payload.document_json.sections?.[0]?.id || null);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to initialize editor",
        );
      } finally {
        setIsLoading(false);
      }
    };

    ensurePaper();
  }, [params.id]);

  const selectedSection = useMemo(() => {
    if (!document || !selectedSectionId) return null;
    return (
      document.sections.find((section) => section.id === selectedSectionId) ||
      null
    );
  }, [document, selectedSectionId]);

  const updateSection = (
    sectionId: string,
    patch: Partial<ResearchPaperSection>,
  ) => {
    setDocument((prev) => {
      if (!prev) return prev;

      const updatedSections = prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          ...patch,
          last_edited_at: new Date().toISOString(),
        };
      });

      return {
        ...prev,
        sections: updatedSections,
      };
    });
  };

  const savePaper = async () => {
    if (!paperId || !document) return;

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const response = await fetch(`/api/research/papers/${paperId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expected_version: version,
          title: document.title,
          status: document.status,
          sections: document.sections.map((section) => ({
            id: section.id,
            heading: section.heading,
            content_markdown: section.content_markdown,
            citations: section.citations || [],
          })),
        }),
      });

      const payload = await response.json();

      if (response.status === 409) {
        setSaveStatus("Conflict detected. Reloading latest version.");
        const latest = await fetch(`/api/research/papers/${paperId}`);
        const latestPayload = (await latest.json()) as PaperResponse;
        setVersion(latestPayload.current_version);
        setDocument(latestPayload.document_json);
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to save paper");
      }

      setVersion(payload.current_version);
      setDocument(payload.document);
      setSaveStatus("Saved");
    } catch (saveError) {
      setSaveStatus(
        saveError instanceof Error ? saveError.message : "Save failed",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const runReview = async () => {
    if (!paperId || !document) return;

    setIsReviewing(true);
    setSaveStatus(null);

    try {
      const response = await fetch(`/api/research/papers/${paperId}/review`, {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to run review");
      }

      setDocument({
        ...document,
        review: payload.review,
      });

      setSaveStatus("Review updated");
    } catch (reviewError) {
      setSaveStatus(
        reviewError instanceof Error ? reviewError.message : "Review failed",
      );
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="research-surface min-h-screen bg-background">
      <div className="border-b border-border/60 bg-linear-to-r from-card via-card/92 to-muted/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <Button asChild variant="ghost" size="sm" className="w-fit">
                <Link href={`/research/${params.id}`} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to report
                </Link>
              </Button>
              <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Paper Editor
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Edit sections, refine language, and run a quality review before
                export.
              </p>
            </div>

            {paperId ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runReview}
                  disabled={isReviewing || isLoading}
                >
                  <FileCheck2 className="h-4 w-4" />
                  {isReviewing ? "Reviewing..." : "Run Review"}
                </Button>
                <Button
                  size="sm"
                  onClick={savePaper}
                  disabled={isSaving || isLoading}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a
                    href={`/api/research/papers/${paperId}/export?format=markdown`}
                  >
                    <Download className="h-4 w-4" />
                    Export MD
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a
                    href={`/api/research/papers/${paperId}/export?format=json`}
                  >
                    <Download className="h-4 w-4" />
                    Export JSON
                  </a>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <Card className="border-border/70 bg-card/70 p-6 text-sm text-muted-foreground shadow-sm">
            Loading editor...
          </Card>
        ) : null}

        {!isLoading && error ? (
          <Card className="border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive shadow-sm">
            {error}
          </Card>
        ) : null}

        {!isLoading && !error && document ? (
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
            <Card className="border-border/70 bg-card/70 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Sections
              </p>
              <div className="mt-3 space-y-2">
                {document.sections.map((section) => {
                  const active = section.id === selectedSectionId;

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setSelectedSectionId(section.id)}
                      className={
                        active
                          ? "w-full rounded-xl border border-primary/35 bg-primary/10 px-3 py-2 text-left"
                          : "w-full rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-left hover:bg-background"
                      }
                    >
                      <p className="text-sm font-medium">{section.heading}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {section.word_count} words
                      </p>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="border-border/70 bg-card/70 p-5 shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Paper title
                  </label>
                  <Input
                    value={document.title}
                    onChange={(event) =>
                      setDocument({
                        ...document,
                        title: event.target.value,
                      })
                    }
                  />
                </div>

                {selectedSection ? (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Section heading
                      </label>
                      <Input
                        value={selectedSection.heading}
                        onChange={(event) =>
                          updateSection(selectedSection.id, {
                            heading: event.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Section content (Markdown)
                      </label>
                      <Textarea
                        className="min-h-90"
                        value={selectedSection.content_markdown}
                        onChange={(event) =>
                          updateSection(selectedSection.id, {
                            content_markdown: event.target.value,
                          })
                        }
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a section to start editing.
                  </p>
                )}
              </div>
            </Card>

            <Card className="border-border/70 bg-card/70 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">AI Review</p>
              </div>

              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    Readability
                  </p>
                  <p className="mt-1 text-xl font-semibold">
                    {document.review?.readability_score ?? 0}
                    /100
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    Consistency flags
                  </p>
                  <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                    {(document.review?.consistency_flags || []).length ? (
                      document.review.consistency_flags.map((flag) => (
                        <li
                          key={flag}
                          className="rounded-lg border border-border/60 bg-background/70 p-2"
                        >
                          {flag}
                        </li>
                      ))
                    ) : (
                      <li className="rounded-lg border border-border/60 bg-background/70 p-2">
                        No issues detected.
                      </li>
                    )}
                  </ul>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    Rewrite suggestions
                  </p>
                  <div className="mt-2 space-y-3">
                    {(document.review?.rewrite_suggestions || []).length ? (
                      document.review.rewrite_suggestions.map((suggestion) => (
                        <div
                          key={`${suggestion.section_id}-${suggestion.before.slice(0, 20)}`}
                          className="rounded-lg border border-border/60 bg-background/70 p-3"
                        >
                          <p className="text-xs font-medium text-foreground">
                            {suggestion.section_id}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Before: {suggestion.before}
                          </p>
                          <p className="mt-2 text-xs text-foreground">
                            After: {suggestion.after}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-lg border border-border/60 bg-background/70 p-2 text-sm text-muted-foreground">
                        No rewrite suggestions yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : null}

        {saveStatus ? (
          <p className="mt-4 text-sm text-muted-foreground">{saveStatus}</p>
        ) : null}
        {!isLoading && !error ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Version {version}
          </p>
        ) : null}
      </main>
    </div>
  );
}
