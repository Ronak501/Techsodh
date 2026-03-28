import {
  buildCacheKey,
  estimateCostUsd,
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
})
