"use client";

import type { ResearchSummaryData } from "@/lib/research-types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface Props {
  summaryData: ResearchSummaryData;
}

function splitParagraphs(value?: string) {
  if (!value) return [];
  return value
    .split(/\n\s*\n/g)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function toTitleCase(value: string) {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function getSupportTone(support?: string) {
  if (support === "supports") {
    return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30";
  }
  if (support === "contradicts") {
    return "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30";
  }
  return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
}

function getFactTagTone(tag?: string) {
  if (tag === "Verified") {
    return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30";
  }
  if (tag === "Disputed") {
    return "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30";
  }
  return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
}

export function ResearchSummary({ summaryData }: Props) {
  if (!summaryData) return null;

  const report = summaryData?.report;
  const outline = summaryData?.outline;
  const introParagraphs = splitParagraphs(report?.introduction);
  const executiveParagraphs = splitParagraphs(report?.executive_summary);
  const analysisParagraphs = splitParagraphs(report?.main_analysis);
  const challengeParagraphs = splitParagraphs(report?.challenges);
  const futureScopeParagraphs = splitParagraphs(report?.future_scope);
  const conclusionParagraphs = splitParagraphs(report?.conclusion);

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="rounded-3xl border border-border/70 bg-card/70 p-5 shadow-sm backdrop-blur sm:p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Research Output
        </p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-balance sm:text-3xl">
          {summaryData.research_topic}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="secondary">
            {toTitleCase(summaryData.research_mode || "topic")}
          </Badge>
          <Badge variant="secondary">
            {toTitleCase(summaryData.template || "literature_review")}
          </Badge>
          <Badge variant="secondary">
            {toTitleCase(summaryData.settings?.output_style || "balanced")}
          </Badge>
          <Badge variant="secondary">
            {toTitleCase(summaryData.settings?.depth || "standard")}
          </Badge>
        </div>
      </div>

      <Card className="rounded-2xl border-border/70 p-5 sm:p-6">
        <h3 className="text-lg font-semibold">Executive Summary</h3>
        <div className="report-copy mt-3 space-y-3 text-sm text-foreground/90">
          {executiveParagraphs.length ? (
            executiveParagraphs.map((paragraph, index) => (
              <p key={`exec-${index}`}>{paragraph}</p>
            ))
          ) : (
            <p className="text-muted-foreground">
              No executive summary was returned.
            </p>
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/70 p-5">
          <h3 className="text-base font-semibold">Introduction</h3>
          <div className="report-copy mt-3 space-y-3 text-sm text-foreground/90">
            {introParagraphs.length ? (
              introParagraphs.map((paragraph, index) => (
                <p key={`intro-${index}`}>{paragraph}</p>
              ))
            ) : (
              <p className="text-muted-foreground">
                No introduction section was returned.
              </p>
            )}
          </div>
        </Card>

        <Card className="rounded-2xl border-border/70 p-5">
          <h3 className="text-base font-semibold">Main Analysis</h3>
          <div className="report-copy mt-3 max-h-72 space-y-3 overflow-auto pr-1 text-sm text-foreground/90">
            {analysisParagraphs.length ? (
              analysisParagraphs.map((paragraph, index) => (
                <p key={`analysis-${index}`}>{paragraph}</p>
              ))
            ) : (
              <p className="text-muted-foreground">
                No main analysis section was returned.
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/70 p-5 sm:p-6">
        <h3 className="text-lg font-semibold">Key Insights</h3>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {(report?.key_insights || []).map((item: string, index: number) => (
            <li
              key={`insight-${index}`}
              className="report-copy rounded-xl border border-border/60 bg-muted/35 p-3 text-sm"
            >
              {item}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="rounded-2xl border-border/70 p-5 sm:p-6">
        <h3 className="text-lg font-semibold">Real World Applications</h3>
        <ul className="mt-4 space-y-3">
          {(report?.real_world_applications || []).map(
            (item: string, index: number) => (
              <li
                key={`application-${index}`}
                className="report-copy rounded-xl border border-border/60 bg-muted/35 p-3 text-sm"
              >
                {item}
              </li>
            ),
          )}
        </ul>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/70 p-5 lg:col-span-1">
          <h3 className="text-base font-semibold">Evidence Strength</h3>
          <p className="mt-3 text-2xl font-semibold sm:text-3xl">
            {toTitleCase(report?.evidence_strength?.overall || "moderate")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Agreement: {report?.evidence_strength?.agreement_count || 0}
          </p>
          <p className="text-sm text-muted-foreground">
            Conflict: {report?.evidence_strength?.conflict_count || 0}
          </p>
          <p className="report-copy mt-3 text-sm text-foreground/90">
            {report?.evidence_strength?.rationale || "No rationale provided."}
          </p>
        </Card>

        <Card className="rounded-2xl border-border/70 p-5 lg:col-span-2">
          <h3 className="text-base font-semibold">Section Confidence</h3>
          <div className="mt-4 space-y-3">
            {(report?.section_confidence || []).map((item, index) => (
              <div key={`confidence-${index}`}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="text-foreground/90">{item.section}</span>
                  <span className="font-medium">{item.score}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.max(0, Math.min(item.score, 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {report?.verdict ? (
        <Card className="rounded-2xl border-border/70 p-5">
          <h3 className="text-base font-semibold">Claim Verdict</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-muted/35 p-3 text-sm">
              <p className="text-muted-foreground">Verdict</p>
              <p className="mt-1 text-base font-semibold">{report.verdict}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/35 p-3 text-sm">
              <p className="text-muted-foreground">Confidence</p>
              <p className="mt-1 text-base font-semibold">
                {typeof report.verdict_confidence === "number"
                  ? `${report.verdict_confidence}%`
                  : "N/A"}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {report?.fact_checks?.length ? (
        <Card className="rounded-2xl border-border/70 p-6">
          <h3 className="text-lg font-semibold">Fact Check Layer</h3>
          <div className="mt-4 space-y-3">
            {report.fact_checks.map((fact, index) => (
              <article
                key={`${fact.statement}-${index}`}
                className="rounded-xl border border-border/60 bg-muted/30 p-4"
              >
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-6">
                    {fact.statement}
                  </p>
                  <Badge className={getFactTagTone(fact.tag)}>{fact.tag}</Badge>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {fact.reason}
                </p>
                {fact.reference_urls.length ? (
                  <ul className="mt-2 space-y-1">
                    {fact.reference_urls.map((url) => (
                      <li key={url}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate text-sm text-primary underline-offset-4 hover:underline"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </Card>
      ) : null}

      {report?.references?.length ? (
        <Card className="rounded-2xl border-border/70 p-6">
          <h3 className="text-lg font-semibold">References</h3>
          <div className="mt-4 space-y-3">
            {report.references.map((reference, index) => (
              <article
                key={`${reference.url}-${index}`}
                className="rounded-xl border border-border/60 bg-muted/30 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="text-sm font-medium leading-6">
                    {reference.title}
                  </h4>
                  <Badge className={getSupportTone(reference.support)}>
                    {toTitleCase(reference.support || "contextual")}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {reference.publisher || "Unknown publisher"}
                  {reference.year ? ` • ${reference.year}` : ""}
                </p>
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block truncate text-sm text-primary underline-offset-4 hover:underline"
                >
                  {reference.url}
                </a>
              </article>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/70 p-5">
          <h3 className="text-base font-semibold">Challenges</h3>
          <div className="report-copy mt-3 space-y-3 text-sm text-foreground/90">
            {challengeParagraphs.length ? (
              challengeParagraphs.map((paragraph, index) => (
                <p key={`challenges-${index}`}>{paragraph}</p>
              ))
            ) : (
              <p className="text-muted-foreground">
                No challenges section was returned.
              </p>
            )}
          </div>
        </Card>

        <Card className="rounded-2xl border-border/70 p-5">
          <h3 className="text-base font-semibold">Future Scope</h3>
          <div className="report-copy mt-3 space-y-3 text-sm text-foreground/90">
            {futureScopeParagraphs.length ? (
              futureScopeParagraphs.map((paragraph, index) => (
                <p key={`future-${index}`}>{paragraph}</p>
              ))
            ) : (
              <p className="text-muted-foreground">
                No future scope section was returned.
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/70 p-5 sm:p-6">
        <h3 className="text-lg font-semibold">Conclusion</h3>
        <div className="report-copy mt-3 space-y-3 text-sm text-foreground/90">
          {conclusionParagraphs.length ? (
            conclusionParagraphs.map((paragraph, index) => (
              <p key={`conclusion-${index}`}>{paragraph}</p>
            ))
          ) : (
            <p className="text-muted-foreground">
              No conclusion section was returned.
            </p>
          )}
        </div>
      </Card>

      <Card className="rounded-2xl border-border/70 p-5 sm:p-6">
        <h3 className="text-lg font-semibold">Research Outline</h3>
        <div className="mt-4 space-y-3">
          {(outline?.sections ?? []).map((section, index: number) => (
            <article
              key={`outline-${index}`}
              className="report-copy rounded-xl border border-border/60 bg-muted/30 p-4"
            >
              <h4 className="text-sm font-semibold">{section.heading}</h4>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {section.description}
              </p>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}
