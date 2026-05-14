import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { safeJsonResponse } from "@/lib/api-security"
import { runResearchPipeline, type ResearchPipelineInput } from "@/lib/research-engine"
import { enforceSubscriptionAndTokenAccess, consumeMonthlyTokens, estimateTokensFromText } from "@/lib/subscription-access"

const workflowExecuteSchema = z.object({
  workflow_id: z.string().uuid(),
  variables: z.record(z.unknown()).optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  try {
    const body = await request.json()
    const validation = workflowExecuteSchema.safeParse(body)

    if (!validation.success) {
      return safeJsonResponse(400, "Invalid input", validation.error.errors)
    }

    // Fetch workflow
    const { data: workflow, error: workflowError } = await supabase
      .from("workflow_definitions")
      .select("*")
      .eq("id", validation.data.workflow_id)
      .single()

    if (workflowError || !workflow) {
      return safeJsonResponse(404, "Workflow not found")
    }

    // Check subscription access
    const { ok, plan } = await enforceSubscriptionAndTokenAccess(
      supabase,
      user.id,
      "research"
    )

    if (!ok) {
      return safeJsonResponse(403, "Subscription required or limit exceeded")
    }

    // Create execution record
    const { data: execution, error: executionError } = await supabase
      .from("workflow_executions")
      .insert({
        workflow_id: validation.data.workflow_id,
        user_id: user.id,
        status: "running",
      })
      .select()
      .single()

    if (executionError || !execution) {
      return safeJsonResponse(400, "Failed to create workflow execution")
    }

    // Execute workflow steps
    const variables = validation.data.variables || {}
    let currentOutput: Record<string, unknown> = {}
    let totalTokensUsed = 0

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i]

        // Replace variables in step config
        const resolvedConfig = JSON.parse(
          JSON.stringify(step.config).replace(
            /{{(\w+)}}/g,
            (_, key: string) => variables[key] || ""
          )
        )

        let stepOutput: Record<string, unknown> = {}

        // Execute based on step type
        if (step.type === "research") {
          // Run research for this step
          const query = resolvedConfig.query || String(variables.query || "")

          try {
            const pipelineResult = await runResearchPipeline({
              query,
              mode: resolvedConfig.mode || "topic",
              template: resolvedConfig.template || "literature_review",
              settings: resolvedConfig.settings || {
                output_style: "balanced",
                depth: "standard",
                model_name: "gemini-default",
              },
            })

            stepOutput = {
              outline: pipelineResult.outline,
              report: pipelineResult.report,
              usage: pipelineResult.usage,
            }

            totalTokensUsed += pipelineResult.usage.prompt_tokens + pipelineResult.usage.completion_tokens

            // Create research record if needed
            if (resolvedConfig.save_research) {
              const { data: research } = await supabase
                .from("research_reports")
                .insert({
                  user_id: user.id,
                  title: step.name,
                  research_topic: query,
                  outline: pipelineResult.outline,
                  report: pipelineResult.report,
                  completion_time_seconds: 0,
                })
                .select()
                .single()

              stepOutput.research_id = research?.id
            }
          } catch (error) {
            throw new Error(`Research step failed: ${String(error)}`)
          }
        } else if (step.type === "condition") {
          // Evaluate condition
          const condition = resolvedConfig.condition || "true"
          // Simple condition evaluation (can be extended)
          stepOutput = { result: true }
        } else if (step.type === "transform") {
          // Transform previous output
          stepOutput = { ...currentOutput, ...resolvedConfig.transform }
        } else if (step.type === "merge") {
          // Merge outputs
          stepOutput = { ...currentOutput, ...resolvedConfig }
        }

        // Save step result
        await supabase.from("workflow_step_results").insert({
          execution_id: execution.id,
          step_index: i,
          step_name: step.name,
          output: stepOutput,
          tokens_used: step.type === "research" ? totalTokensUsed : undefined,
        })

        currentOutput = stepOutput
      }

      // Update execution to completed
      const { error: updateError } = await supabase
        .from("workflow_executions")
        .update({
          status: "completed",
          results: currentOutput,
          completed_at: new Date().toISOString(),
        })
        .eq("id", execution.id)

      if (updateError) {
        return safeJsonResponse(400, "Failed to update workflow execution")
      }

      // Consume tokens
      if (totalTokensUsed > 0) {
        await consumeMonthlyTokens(supabase, user.id, totalTokensUsed)
      }

      return NextResponse.json({
        execution_id: execution.id,
        status: "completed",
        results: currentOutput,
        tokens_used: totalTokensUsed,
      })
    } catch (error) {
      // Update execution to failed
      await supabase
        .from("workflow_executions")
        .update({
          status: "failed",
          error_message: String(error),
          completed_at: new Date().toISOString(),
        })
        .eq("id", execution.id)

      return safeJsonResponse(400, "Workflow execution failed", String(error))
    }
  } catch (error) {
    return safeJsonResponse(500, "Internal server error", String(error))
  }
}

// GET - Fetch execution history
export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return safeJsonResponse(401, "Unauthorized")
  }

  const { searchParams } = new URL(request.url)
  const workflow_id = searchParams.get("workflow_id")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)

  try {
    let query = supabase
      .from("workflow_executions")
      .select("*")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(limit)

    if (workflow_id) {
      query = query.eq("workflow_id", workflow_id)
    }

    const { data: executions, error } = await query

    if (error) {
      return safeJsonResponse(400, "Failed to fetch executions", error.message)
    }

    return NextResponse.json(executions || [])
  } catch (error) {
    return safeJsonResponse(500, "Internal server error", String(error))
  }
}
