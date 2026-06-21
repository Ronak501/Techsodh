"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Download,
  FileDown,
  FileText,
  LayoutDashboard,
  Search,
  Sparkles,
  WandSparkles,
} from "lucide-react";

type ResearchHistoryItem = {
  id: string;
  query: string;
  status: "completed" | "in_progress" | "failed";
  source_count: number;
  created_at: string;
};

type Message = {
  role: "assistant" | "user";
  content: string;
};

const demoHistory: ResearchHistoryItem[] = [
  {
    id: "demo-1",
    query: "Notebook-style research workflow for AI software",
    status: "completed",
    source_count: 12,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    query: "Compare Perplexity, NotebookLM, and Linear research UX",
    status: "in_progress",
    source_count: 8,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "demo-3",
    query: "Summarize product strategy with citations",
    status: "failed",
    source_count: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

const workspaceContext =
  "This software is a research workspace. It keeps history on the left, chat in the center, and PDF exports on the right. Use it to ask questions, review sources, and download reports.";

function statusLabel(status: ResearchHistoryItem["status"]) {
  if (status === "completed") return "Ready";
  if (status === "in_progress") return "Working";
  return "Needs review";
}

export default function ResearchPage() {
  const [supabase] = useState(() => createClient());
  const [history, setHistory] = useState<ResearchHistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>(demoHistory[0].id);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Start here. Ask a question and I will answer using the workspace context, your selected history item, and the available sources.",
    },
  ]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      const { data } = await supabase
        .from("research_reports")
        .select("id, query, status, source_count, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!mounted) return;

      if (data?.length) {
        setHistory(data as ResearchHistoryItem[]);
        setSelectedId(data[0].id);
      } else {
        setHistory(demoHistory);
      }
    };

    void loadHistory();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const visibleHistory = useMemo(() => {
    const term = historySearch.trim().toLowerCase();
    const source = history.length ? history : demoHistory;

    if (!term) return source;
    return source.filter((item) => item.query.toLowerCase().includes(term));
  }, [history, historySearch]);

  const selectedItem = useMemo(() => {
    return (
      visibleHistory.find((item) => item.id === selectedId) ??
      visibleHistory[0] ??
      demoHistory[0]
    );
  }, [selectedId, visibleHistory]);

  const pdfHref = selectedItem
    ? `/api/research/${selectedItem.id}/export?format=pdf`
    : "/research/new";

  const sendMessage = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { role: "user", content: trimmed },
      {
        role: "assistant",
        content: `Using the workspace context and ${selectedItem.query}, I would summarize the key claims, cite the strongest sources, and export the final result as PDF.`,
      },
    ]);
    setDraft("");
  };

  return (
    <main className="research-surface min-h-screen bg-background text-foreground scroll-smooth">
      <section className="min-h-screen w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="grid min-h-[calc(100vh-3rem)] gap-4 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
        <Card className="rounded-3xl border-border/70 bg-card/90 p-3 shadow-sm lg:sticky lg:top-6">
          <div className="space-y-3 border-b border-border/60 pb-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                History
              </p>
            </div>
            <Input
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
              placeholder="Search history"
              className="rounded-2xl"
            />
          </div>

          <div className="mt-4 space-y-2">
            {visibleHistory.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-2xl border px-3 py-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                  item.id === selectedItem.id
                    ? "border-primary/25 bg-primary/5"
                    : "border-border/70 bg-background/90"
                }`}
              >
                <p className="line-clamp-2 text-sm font-medium leading-6">
                  {item.query}
                </p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-card/90 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Chat
                </p>
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {selectedItem.query}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                {workspaceContext}
              </p>
            </div>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              <WandSparkles className="mr-2 h-3.5 w-3.5" />
              Context ready
            </Badge>
          </div>

          <div className="mt-4 space-y-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-2xl border px-4 py-3 text-sm leading-7 ${
                  message.role === "assistant"
                    ? "border-border/70 bg-muted/30"
                    : "border-primary/20 bg-primary/5"
                }`}
              >
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {message.role === "assistant" ? "Assistant" : "You"}
                </p>
                {message.content}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[22px] border border-border/70 bg-background/95 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Add a question
            </p>
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about the software, the selected research, or request a report summary..."
              className="mt-3 min-h-28 rounded-2xl"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDraft(workspaceContext)}>
                Load software context
              </Button>
              <Button type="button" size="sm" onClick={sendMessage} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Send
              </Button>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Shift + Enter for new line. Chat history is contextualized to your selected research.
            </p>
          </div>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-card/90 p-4 shadow-sm lg:sticky lg:top-6">
          <div className="border-b border-border/60 pb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                PDF export
              </p>
            </div>
            <h3 className="mt-2 text-lg font-semibold tracking-tight">
              Download the selected research
            </h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Export the current item as a PDF or switch formats if needed.
            </p>
          </div>
        </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Selected research
              </p>
              <p className="mt-2 text-sm font-medium leading-6">{selectedItem.query}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {selectedItem.source_count} sources · {statusLabel(selectedItem.status)}
              </p>
            </div>

            <div className="grid gap-2">
              <Button asChild className="justify-start gap-2">
                <a href={pdfHref}>
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              </Button>
              <Button asChild variant="outline" className="justify-start gap-2">
                <a href={`/api/research/${selectedItem.id}/export?format=markdown`}>
                  <FileDown className="h-4 w-4" />
                  Markdown
                </a>
              </Button>
              <Button asChild variant="outline" className="justify-start gap-2">
                <a href={`/api/research/${selectedItem.id}/export?format=json`}>
                  <FileText className="h-4 w-4" />
                  JSON
                </a>
              </Button>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/95 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4 text-primary" />
                What the workspace includes
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                <li>• History on the left for quick navigation</li>
                <li>• Chat in the center with software context</li>
                <li>• PDF downloads on the right</li>
              </ul>
            </div>

            <Button asChild variant="secondary" className="w-full gap-2">
              <Link href="/research/new">
                <LayoutDashboard className="h-4 w-4" />
                Start new research
              </Link>
            </Button>
          </div>
        </Card>
        </div>
      </section>
    </main>
  );
}
