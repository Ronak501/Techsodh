"use server";

import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const workflowStepSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  type: z.enum(["research", "condition", "transform", "merge"]),
  config: z.record(z.unknown()),
  next_step_id: z.string().optional(),
});

const workflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  steps: z.array(workflowStepSchema),
  is_public: z.boolean().default(false),
});

export async function getWorkflows(options: { my_workflows?: boolean; limit?: number } = {}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const my_workflows = options.my_workflows ?? false;
  const limit = Math.min(options.limit || 50, 100);

  let query = supabase
    .from("workflow_definitions")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (my_workflows && user) {
    query = query.eq("created_by_user_id", user.id);
  } else {
    query = query.eq("is_public", true);
  }

  const { data: workflows, error } = await query;

  if (error) {
    return { success: false, error: "Failed to fetch workflows", details: error.message };
  }

  return { success: true, data: workflows || [] };
}

export async function createWorkflow(input: z.infer<typeof workflowSchema>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const validation = workflowSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: "Invalid input", details: validation.error.errors };
  }

  const { data: workflow, error } = await supabase
    .from("workflow_definitions")
    .insert({
      ...validation.data,
      created_by_user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: "Failed to create workflow", details: error.message };
  }

  return { success: true, data: workflow };
}
