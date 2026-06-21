"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { askResearchAgent } from "./actions";
import { createClient } from "@/utils/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/navbar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import {
  BookOpen,
  Download,
  FileDown,
  FileText,
  LayoutDashboard,
  Search,
  Sparkles,
  WandSparkles,
  ArrowRight,
  Plus,
  MessageSquareText,
  Clock,
  CheckCircle2,
  AlertCircle,
  FilePenLine
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
  const [selectedId, setSelectedId] = useState<string>(demoHistory[0].id);
  const [messages, setMessages] = useState<Message[]>([
    {
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

  const sendMessage = async () => {
    const trimmed = draft.trim();
    if (!trimmed || isLoading) return;

    const newMessages = [
      ...messages,
      { role: "user" as const, content: trimmed },
    ];
    
    setMessages(newMessages);
    setDraft("");
    setIsLoading(true);

    try {
      const response = await askResearchAgent(newMessages, workspaceContext, selectedItem.query);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.reply,
        },
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-surface flex h-screen bg-background text-foreground overflow-hidden pt-16">
      <Navbar />
      
      {/* 1. LEFT SIDEBAR: Compact Research History */}
      <aside className="glass-panel m-3 hidden w-64 flex-col overflow-hidden rounded-3xl lg:flex shadow-sm">
        <div className="space-y-3 border-b border-border/70 p-4 bg-background/50">
          <Link href="/dashboard">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-background py-2 transition hover:bg-accent hover:text-accent-foreground text-sm font-medium shadow-xs">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </button>
          </Link>

          <div className="flex items-center gap-2 mt-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-xl border-input bg-background/80 py-2 pl-8 pr-3 text-sm focus-visible:ring-primary/40"
              />
            </div>
            <Link href="/research/new" className="shrink-0">
              <button 
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90 shadow-md shadow-primary/20"
                title="New Research"
              >
                <Plus className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {visibleHistory.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-all hover:bg-accent/40 ${
                item.id === selectedId
                  ? "bg-accent/60 border border-border/80 shadow-xs font-semibold text-foreground"
                  : "border border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquareText className="mr-2 h-3.5 w-3.5 opacity-50 shrink-0" />
              <span className="truncate">{item.query}</span>
            </button>
          ))}
          {visibleHistory.length === 0 && (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center">
              No matching research found
            </div>
          )}
        </div>
      </aside>

      {/* 2. CENTER: Chat Assistant */}
      <main className="flex min-w-0 flex-1 flex-col p-3 lg:p-4">
        <div className="glass-panel rise-in flex h-full flex-col rounded-3xl overflow-hidden shadow-md border border-border/80 bg-card/60 backdrop-blur-xl relative">
          
          <div className="flex items-center justify-between border-b border-border/60 bg-background/40 px-6 py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h1 className="text-sm font-semibold tracking-wide">Research Chat</h1>
            </div>
            <Badge variant="outline" className="rounded-full px-4 py-1.5 shadow-xs bg-background/50 backdrop-blur-md border-primary/20 text-primary">
              <WandSparkles className="mr-2 h-3.5 w-3.5" />
              Context Ready
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <article
                    className={`w-full max-w-[85%] rounded-3xl px-6 py-5 shadow-sm text-[15px] leading-relaxed ${
                      msg.role === "user"
                        ? "border border-primary/20 bg-linear-to-br from-primary to-primary/85 text-primary-foreground"
                        : "border border-border/60 bg-card/80 glass-panel"
                    }`}
                  >
                    <div
                      className={`mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.16em] font-semibold ${
                        msg.role === "user"
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${
                          msg.role === "user"
                            ? "bg-primary-foreground/15 text-primary-foreground"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {msg.role === "user" ? "You" : "AI"}
                      </span>
                      {msg.role === "user" ? "Message" : "Assistant"}
                    </div>

                    <div className="prose max-w-none dark:prose-invert prose-headings:text-foreground prose-headings:font-semibold prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-pre:bg-muted prose-code:text-foreground">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight, rehypeRaw]}
                        components={{
                          h1: ({ ...props }) => <h1 className="mb-4 mt-6 text-2xl font-bold" {...props} />,
                          h2: ({ ...props }) => <h2 className="mb-3 mt-5 text-xl font-semibold" {...props} />,
                          h3: ({ ...props }) => <h3 className="mb-3 mt-4 text-lg font-semibold" {...props} />,
                          p: ({ ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                          ul: ({ ...props }) => <ul className="mb-4 list-disc pl-6" {...props} />,
                          ol: ({ ...props }) => <ol className="mb-4 list-decimal pl-6" {...props} />,
                          code(props) {
                            const { children, className } = props;
                            const isInline = !className;
                            if (isInline) {
                              return <code className="rounded bg-muted px-1.5 py-0.5 text-sm text-foreground font-mono">{children}</code>;
                            }
                            return (
                              <pre className="mb-4 overflow-x-auto rounded-xl border border-border/70 bg-muted/50 p-4 text-sm">
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
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="glass-panel max-w-[80%] rounded-3xl border border-border/60 bg-card/80 px-6 py-5 text-sm text-muted-foreground flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Synthesizing response...
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          <div className="border-t border-border/60 bg-background/60 p-4 backdrop-blur-xl">
            <div className="max-w-4xl mx-auto rounded-3xl border border-border/80 bg-card/90 p-2.5 shadow-sm focus-within:border-primary/50 focus-within:ring-[3px] focus-within:ring-primary/20 transition-all duration-300">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask a question about this research..."
                className="min-h-[80px] max-h-[200px] w-full resize-none border-0 bg-transparent px-4 py-3 text-base outline-none focus-visible:ring-0 placeholder:text-muted-foreground"
              />
              <div className="flex items-center justify-between mt-2 px-2 pb-1">
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setDraft(workspaceContext)}
                    className="rounded-full text-sm hover:bg-muted/50"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Load Context
                  </Button>
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !draft.trim()}
                  className="rounded-full px-6 font-medium transition hover:scale-105"
                >
                  Send
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Shift + Enter for new line. Chat history is contextualized to your selected research.
            </p>
          </div>
        </div>
      </main>

      {/* 3. RIGHT SIDEBAR: Export & Document Overview */}
      <aside className="glass-panel m-3 hidden w-80 flex-col overflow-hidden rounded-3xl lg:flex shadow-md border border-border/80 bg-card/40">
        <div className="border-b border-border/60 p-5 bg-background/40">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-wide">Document Details</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Active Research</h3>
            <p className="text-lg font-semibold tracking-tight leading-snug">
              {selectedItem.query}
            </p>
            
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex items-center justify-between rounded-xl bg-background/50 border border-border/50 px-4 py-3">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  <StatusIcon status={selectedItem.status} />
                  <span className="text-sm font-medium capitalize">{selectedItem.status.replace("_", " ")}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between rounded-xl bg-background/50 border border-border/50 px-4 py-3">
                <span className="text-sm text-muted-foreground">Sources</span>
                <span className="text-sm font-medium">{selectedItem.source_count} compiled</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 pt-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Export Options</h3>
            <div className="grid gap-3">
              <Button asChild className="w-full justify-start gap-3 shadow-sm h-11">
                <a href={pdfHref}>
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-3 bg-background/50 h-11">
                <a href={`/api/research/${selectedItem.id}/export?format=markdown`}>
                  <FileDown className="h-4 w-4" />
                  Export as Markdown
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-3 bg-background/50 h-11">
                <a href={`/api/research/${selectedItem.id}/export?format=json`}>
                  <FileText className="h-4 w-4" />
                  View Raw JSON
                </a>
              </Button>
            </div>
          </div>

          <div className="border-t border-border/50 pt-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Writing Tools</h3>
            <Button asChild variant="outline" className="w-full justify-start gap-3 bg-primary/5 h-11 border-primary/30 text-primary hover:bg-primary/10 transition-colors">
              <Link href="/humanizer">
                <FilePenLine className="h-4 w-4" />
                Open Humanizer Studio
              </Link>
            </Button>
          </div>
          
        </div>
      </aside>

    </div>
  );
}
