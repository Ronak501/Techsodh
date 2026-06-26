"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { askResearchAgent } from "./actions";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/navbar";
import { type ResearchHistoryItem } from "@/lib/research-history";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import {
  ArrowUpRight,
  Brain,
  CheckCircle2,
  Clock,
  Download,
  FileDown,
  FilePenLine,
  FileText,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Send,
  Sparkles,
  AlertCircle,
} from "lucide-react";

type Message = {
  role: "assistant" | "user";
  content: string;
  id: string;
};

const workspaceContext =
  "This software is a research workspace. It keeps history on the left, chat in the center, and PDF exports on the right. Use the chat to ask questions and refine your ideas.";

function StatusIcon({ status }: { status: ResearchHistoryItem["status"] }) {
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-primary" />;
  if (status === "in_progress") return <Clock className="h-4 w-4 text-foreground animate-pulse" />;
  return <AlertCircle className="h-4 w-4 text-destructive" />;
}

export default function ResearchPage() {
  const [supabase] = useState(() => createClient());
  const [history, setHistory] = useState<ResearchHistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "Welcome to your Notebook. I'm ready to answer questions about the selected research document or help you draft new ideas.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messages.length > 1) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      const { data } = await supabase
        .from("research_reports")
        .select("id, query, status, source_count, created_at")
        .order("created_at", { ascending: false })
        .limit(20); // increased limit to show more items

      if (!mounted) return;

      if (data?.length) {
        setHistory(data as ResearchHistoryItem[]);
        setSelectedId(data[0].id);
      }
    };

    void loadHistory();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const visibleHistory = useMemo(() => {
    const term = historySearch.trim().toLowerCase();
    if (!term) return history;
    return history.filter((item) => item.query.toLowerCase().includes(term));
  }, [history, historySearch]);

  const selectedItem = useMemo(() => {
    return (
      visibleHistory.find((item) => item.id === selectedId) ??
      visibleHistory[0] ??
      null
    );
  }, [selectedId, visibleHistory]);

  const handleExport = async (format: "pdf" | "markdown" | "json") => {
    if (!selectedItem) return;
    try {
      const response = await fetch(`/api/research/${selectedItem.id}/export?format=${format}`);
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Export failed" }));
        toast.error(err.error || "Export failed");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "markdown" ? "report.md" : format === "json" ? "report.json" : "report.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded as ${format.toUpperCase()}`);
    } catch {
      toast.error("Failed to download. Please try again.");
    }
  };

  const sendMessage = async () => {
    const trimmed = draft.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setDraft("");
    setIsLoading(true);

    // Keep only the last 20 messages to avoid hitting token limits
    const contextMessages = newMessages.slice(-20);

    try {
      const response = await askResearchAgent(contextMessages, workspaceContext, selectedItem?.query ?? "");
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: response.reply },
      ]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to get a response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground pt-16">
      <Navbar />

      {/* LEFT SIDEBAR — Research history */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border/60 bg-card/50 lg:flex">
        {/* Header */}
        <div className="border-b border-border/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Brain className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-semibold">Research History</span>
            </div>
            <Button asChild size="icon" className="h-8 w-8 rounded-lg shadow-md shadow-primary/20" title="New Research">
              <Link href="/research/new">
                <Plus className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search research..."
              className="h-9 rounded-xl bg-background/80 pl-9 text-sm"
            />
          </div>
        </div>

        {/* History list */}
        <div className="flex-1 overflow-y-auto p-2">
          {visibleHistory.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No research found</p>
              <Link href="/research/new">
                <Button size="sm" variant="outline" className="mt-1 gap-1.5 rounded-lg text-xs">
                  <Plus className="h-3 w-3" /> New Research
                </Button>
              </Link>
            </div>
          ) : (
            visibleHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                  item.id === selectedId
                    ? "bg-primary/8 border border-primary/20 text-foreground"
                    : "border border-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  <StatusIcon status={item.status} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-5">{item.query}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.source_count} sources
                  </p>
                </div>
                <Link
                  href={`/research/${item.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5 shrink-0 opacity-0 transition group-hover:opacity-100"
                >
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </button>
            ))
          )}
        </div>

        {/* Dashboard link */}
        <div className="border-t border-border/60 p-3">
          <Link href="/dashboard">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-background/50 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </button>
          </Link>
        </div>
      </aside>

      {/* CENTER — Chat */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-border/60 bg-background/80 px-5 py-3.5 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{selectedItem?.query ?? "No research selected"}</p>
              <p className="text-xs text-muted-foreground">AI Research Assistant</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 rounded-full border-primary/20 bg-primary/8 px-3 py-1 text-xs text-primary"
          >
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-primary inline-block animate-pulse" />
            Context active
          </Badge>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-1">
                    <Brain className="h-4 w-4" />
                  </div>
                )}
                <article
                  className={`max-w-[80%] rounded-2xl px-5 py-4 text-sm leading-7 shadow-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "border border-border/60 bg-card rounded-bl-sm"
                  }`}
                >
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-7 prose-p:my-0 prose-headings:font-semibold prose-pre:bg-muted prose-code:text-foreground">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight, rehypeRaw]}
                      components={{
                        h1: ({ ...props }) => <h1 className="mb-3 mt-5 text-xl font-bold" {...props} />,
                        h2: ({ ...props }) => <h2 className="mb-2 mt-4 text-lg font-semibold" {...props} />,
                        h3: ({ ...props }) => <h3 className="mb-2 mt-3 text-base font-semibold" {...props} />,
                        p: ({ ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                        ul: ({ ...props }) => <ul className="mb-3 list-disc pl-5 space-y-1" {...props} />,
                        ol: ({ ...props }) => <ol className="mb-3 list-decimal pl-5 space-y-1" {...props} />,
                        code(props) {
                          const { children, className } = props;
                          if (!className) {
                            return <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{children}</code>;
                          }
                          return (
                            <pre className="mb-3 overflow-x-auto rounded-xl border border-border/70 bg-muted/50 p-4 text-xs">
                              <code className={className}>{children}</code>
                            </pre>
                          );
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </article>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background mt-1">
                    <span className="text-xs font-bold">You</span>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-1">
                  <Brain className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-bl-sm border border-border/60 bg-card px-5 py-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Synthesizing response...
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-border/60 bg-background/80 p-4 backdrop-blur">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3 shadow-sm transition-all focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask anything about this research..."
                className="min-h-[52px] max-h-[160px] flex-1 resize-none border-0 bg-transparent p-0 text-sm outline-none focus-visible:ring-0 placeholder:text-muted-foreground"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !draft.trim()}
                size="icon"
                className="h-9 w-9 shrink-0 rounded-xl shadow-md shadow-primary/20"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR — Document details & exports */}
      <aside className="hidden w-72 shrink-0 flex-col border-l border-border/60 bg-card/50 xl:flex">
        <div className="border-b border-border/60 p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Report Details</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Active research info */}
          <div className="rounded-xl border border-border/60 bg-background/60 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Active</p>
            {selectedItem ? (
              <>
                <p className="text-sm font-semibold leading-5 text-balance">{selectedItem.query}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <div className="flex items-center gap-1.5">
                      <StatusIcon status={selectedItem.status} />
                      <span className="font-medium capitalize">{selectedItem.status.replace("_", " ")}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sources</span>
                    <span className="font-medium">{selectedItem.source_count}</span>
                  </div>
                </div>
                <Link href={`/research/${selectedItem.id}`}>
                  <Button variant="outline" size="sm" className="mt-1 w-full gap-2 rounded-lg text-xs">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Open full report
                  </Button>
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Select a research item to see details.</p>
            )}
          </div>

          {/* Export options */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Export</p>
            <div className="space-y-2">
              <Button
                type="button"
                className="w-full justify-start gap-3 h-10 rounded-xl"
                onClick={() => handleExport("pdf")}
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-3 h-10 rounded-xl bg-background/50"
                onClick={() => handleExport("markdown")}
              >
                <FileDown className="h-4 w-4" />
                Export Markdown
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-3 h-10 rounded-xl bg-background/50"
                onClick={() => handleExport("json")}
              >
                <FileText className="h-4 w-4" />
                Export JSON
              </Button>
            </div>
          </div>

          {/* Humanizer */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Writing Tools</p>
            <Link href="/humanizer">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-10 rounded-xl border-primary/25 bg-primary/5 text-primary hover:bg-primary/10"
              >
                <FilePenLine className="h-4 w-4" />
                Humanizer Studio
              </Button>
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
