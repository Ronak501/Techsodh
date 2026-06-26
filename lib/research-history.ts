export type ResearchHistoryItem = {
  id: string;
  query: string;
  status: "completed" | "in_progress" | "failed";
  source_count: number;
  created_at: string;
};
