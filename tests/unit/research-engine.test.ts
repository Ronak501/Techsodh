import {
  buildCacheKey,
  estimateCostUsd,
  ensureCompleteReportSections,
  mergeSettings,
  resolveTemplate,
} from "@/lib/research-engine"
import { describe, expect, it } from "vitest"

describe("research-engine helpers", () => {
  it("buildCacheKey normalizes and deduplicates words", () => {
    const key = buildCacheKey("AI, ai, and RESEARCH in 2026: Research Methods")
    expect(key).toContain("research")
    expect(key).toContain("methods")
    expect(key.includes("ai")).toBe(false)
  })

  it("estimateCostUsd returns a rounded USD estimate", () => {
    const cost = estimateCostUsd(1000, 500)
    expect(cost).toBe(0.0005)
  })

  it("mergeSettings prioritizes explicit settings over preferences and defaults", () => {
    const merged = mergeSettings(
      {
        output_style: "concise",
        depth: "standard",
        model_name: "gemini-pref",
      },
      {
        output_style: "detailed",
      }
    )

    expect(merged).toEqual({
      output_style: "detailed",
      depth: "standard",
      model_name: "gemini-pref",
    })
  })

  it("resolveTemplate forces claim_verification for claim mode", () => {
    const template = resolveTemplate("claim", "technical_report")
    expect(template).toBe("technical_report")

    const inferred = resolveTemplate("claim")
    expect(inferred).toBe("claim_verification")
  })

  it("ensureCompleteReportSections fills empty narrative sections", () => {
    const completed = ensureCompleteReportSections({
      report: {},
      outline: {
        title: "Sample Topic",
        sections: [
          { heading: "Background", description: "Context for the topic" },
          { heading: "Evidence", description: "Supporting studies" },
        ],
      },
      query: "sample research topic",
      mode: "topic",
      template: "literature_review",
    })

    expect(completed.main_analysis).toContain("sample research topic")
    expect(completed.key_insights?.length).toBeGreaterThanOrEqual(3)
    expect(completed.real_world_applications?.length).toBeGreaterThanOrEqual(3)
    expect(completed.challenges).toContain("source quality")
    expect(completed.future_scope).toContain("Future work")
    expect(completed.conclusion).toContain("cautious conclusion")
    expect(completed.section_confidence?.length).toBe(8)
  })
})
