import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}))

import { GET, PATCH } from "@/app/api/research/preferences/route"
import { createClient } from "@/utils/supabase/server"

type MockSupabase = {
  auth: {
    getUser: ReturnType<typeof vi.fn>
  }
  from: ReturnType<typeof vi.fn>
}

function buildQueryChain(result: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  }
}

describe("research preferences API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when user is not authenticated", async () => {
    const supabase: MockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
      from: vi.fn(),
    }

    vi.mocked(createClient).mockResolvedValue(supabase as never)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe("Unauthorized")
  })

  it("returns stored preferences for authenticated user", async () => {
    const chain = buildQueryChain({
      data: {
        preferred_template: "technical_report",
        output_style: "detailed",
        depth: "deep",
        model_name: "llama-3.3-70b-versatile",
      },
      error: null,
    })

    const supabase: MockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from: vi.fn().mockReturnValue(chain),
    }

    vi.mocked(createClient).mockResolvedValue(supabase as never)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      preferred_template: "technical_report",
      output_style: "detailed",
      depth: "deep",
      model_name: "llama-3.3-70b-versatile",
    })
  })

  it("rejects invalid PATCH payload", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/research/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferred_template: "invalid" }),
      })
    )

    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe("Invalid preferences payload")
  })

  it("updates preferences for authenticated user", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })

    const supabase: MockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-2" } } }),
      },
      from: vi.fn().mockReturnValue({ upsert }),
    }

    vi.mocked(createClient).mockResolvedValue(supabase as never)

    const response = await PATCH(
      new Request("http://localhost/api/research/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferred_template: "literature_review",
          output_style: "balanced",
          depth: "standard",
          model_name: "llama-3.3-70b-versatile",
        }),
      })
    )

    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(upsert).toHaveBeenCalledTimes(1)
  })
})
