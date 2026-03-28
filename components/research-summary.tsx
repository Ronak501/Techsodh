"use client";

import type { ResearchSummaryData } from "@/lib/research-types";

interface Props {
  summaryData: ResearchSummaryData;
}

export function ResearchSummary({ summaryData }: Props) {
  if (!summaryData) return null;

  const report = summaryData?.report;
  const outline = summaryData?.outline;

  const tagClasses: Record<string, string> = {
    Verified: "bg-green-600/20 text-green-300 border border-green-500/40",
    Uncertain: "bg-yellow-600/20 text-yellow-300 border border-yellow-500/40",
    Disputed: "bg-red-600/20 text-red-300 border border-red-500/40",
  };

  return (
    <div className="space-y-10">
      {/* Topic */}
      <div>
        <h2 className="text-2xl font-bold">{summaryData?.research_topic}</h2>
      </div>

      {/* Executive Summary */}
      <section>
        <h3 className="text-xl font-semibold mb-2">Executive Summary</h3>
        <p>{report?.executive_summary}</p>
      </section>

      {report?.verdict ? (
        <section>
          <h3 className="text-xl font-semibold mb-2">Claim Verdict</h3>
          <div className="rounded-lg border border-border/50 p-4 space-y-2 bg-card/40">
            <p>
              <span className="font-semibold">Verdict:</span> {report.verdict}
            </p>
            <p>
              <span className="font-semibold">Confidence:</span>{" "}
              {typeof report.verdict_confidence === "number"
                ? `${report.verdict_confidence}%`
                : "N/A"}
            </p>
          </div>
        </section>
      ) : null}

      {report?.evidence_strength ? (
        <section>
          <h3 className="text-xl font-semibold mb-2">Evidence Strength</h3>
          <div className="rounded-lg border border-border/50 p-4 space-y-2 bg-card/40">
            <p>
              <span className="font-semibold">Overall:</span>{" "}
              {report.evidence_strength.overall}
            </p>
            <p>
              <span className="font-semibold">Agreement / Conflict:</span>{" "}
              {report.evidence_strength.agreement_count} /{" "}
              {report.evidence_strength.conflict_count}
            </p>
            <p className="text-sm text-muted-foreground">
              {report.evidence_strength.rationale}
            </p>
          </div>
        </section>
      ) : null}

      {/* Key Insights */}
      <section>
        <h3 className="text-xl font-semibold mb-2">Key Insights</h3>
        <ul className="list-disc pl-6 space-y-2">
          {(report?.key_insights ?? []).map((item: string, index: number) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </section>

      {/* Applications */}
      <section>
        <h3 className="text-xl font-semibold mb-2">Real World Applications</h3>
        <ul className="list-disc pl-6 space-y-2">
          {(report?.real_world_applications ?? []).map(
            (item: string, index: number) => (
              <li key={index}>{item}</li>
            ),
          )}
        </ul>
      </section>

      {/* Fact Check Layer */}
      {report?.fact_checks?.length ? (
        <section>
          <h3 className="text-xl font-semibold mb-2">Fact Check Layer</h3>
          <div className="space-y-3">
            {report.fact_checks.map((fact, index) => (
              <div
                key={`${fact.statement}-${index}`}
                className="rounded-lg border border-border/50 p-4 bg-card/40"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="font-medium">{fact.statement}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded ${tagClasses[fact.tag] || "bg-muted text-foreground"}`}
                  >
                    {fact.tag}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {fact.reason}
                </p>
                {fact.reference_urls.length ? (
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {fact.reference_urls.map((url) => (
                      <li key={url}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* References */}
      {report?.references?.length ? (
        <section>
          <h3 className="text-xl font-semibold mb-2">References</h3>
          <div className="space-y-2">
            {report.references.map((reference, index) => (
              <div
                key={`${reference.url}-${index}`}
                className="rounded-lg border border-border/50 p-3 bg-card/40"
              >
                <p className="font-medium">{reference.title}</p>
                <p className="text-xs text-muted-foreground mb-1">
                  {reference.publisher || "Unknown publisher"}
                  {reference.year ? ` • ${reference.year}` : ""}
                  {` • ${reference.support}`}
                </p>
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm underline"
                >
                  {reference.url}
                </a>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Section Confidence */}
      {report?.section_confidence?.length ? (
        <section>
          <h3 className="text-xl font-semibold mb-2">Section Confidence</h3>
          <div className="space-y-2">
            {report.section_confidence.map((item, index) => (
              <div
                key={`${item.section}-${index}`}
                className="rounded-lg border border-border/50 p-3 bg-card/40"
              >
                <div className="flex items-center justify-between text-sm">
                  <span>{item.section}</span>
                  <span className="font-semibold">{item.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Outline */}
      <section>
        <h3 className="text-xl font-semibold mb-2">Research Outline</h3>
        {(outline?.sections ?? []).map((section, index: number) => (
          <div key={index} className="mb-4">
            <h4 className="font-semibold">{section.heading}</h4>
            <p className="text-sm text-muted-foreground">
              {section.description}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
