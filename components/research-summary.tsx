'use client'

interface Props {
  summaryData: any
}

export function ResearchSummary({ summaryData }: Props) {

  if (!summaryData) return null

  const report = summaryData?.report
  const outline = summaryData?.outline

  return (
    <div className="space-y-10">

      {/* Topic */}
      <div>
        <h2 className="text-2xl font-bold">
          {summaryData?.research_topic}
        </h2>
      </div>

      {/* Executive Summary */}
      <section>
        <h3 className="text-xl font-semibold mb-2">Executive Summary</h3>
        <p>{report?.executive_summary}</p>
      </section>

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
            )
          )}
        </ul>
      </section>

      {/* Outline */}
      <section>
        <h3 className="text-xl font-semibold mb-2">Research Outline</h3>
        {(outline?.sections ?? []).map((section: any, index: number) => (
          <div key={index} className="mb-4">
            <h4 className="font-semibold">{section.heading}</h4>
            <p className="text-sm text-muted-foreground">
              {section.description}
            </p>
          </div>
        ))}
      </section>

    </div>
  )
}
