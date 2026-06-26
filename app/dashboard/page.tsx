"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/navbar";
import { type ResearchHistoryItem } from "@/lib/research-history";
import {
  BookOpen,
  Download,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  LayoutDashboard,
  ArrowRight
} from "lucide-react";

function StatusIcon({ status }: { status: ResearchHistoryItem["status"] }) {
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "in_progress") return <Clock className="h-4 w-4 text-foreground animate-pulse" />;
  return <AlertCircle className="h-4 w-4 text-destructive" />;
}

export default function DashboardPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [history, setHistory] = useState<ResearchHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from("research_reports")
        .select("id, query, status, source_count, created_at")
        .order("created_at", { ascending: false });

      if (!mounted) return;

      setHistory((data ?? []) as ResearchHistoryItem[]);
      setIsLoading(false);
    };

    void loadHistory();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const filteredHistory = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return history;
    return history.filter((item) => item.query.toLowerCase().includes(term));
  }, [history, searchQuery]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const previous = history;
    setHistory((prev) => prev.filter((item) => item.id !== id));

    const res = await fetch(`/api/research/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setHistory(previous);
      toast.error("Failed to delete. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
              <LayoutDashboard className="h-5 w-5" />
              <p className="text-sm font-bold uppercase tracking-[0.15em]">Your Workspace</p>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight">Research Dashboard</h1>
            <p className="text-muted-foreground mt-2 text-lg">Manage, export, and continue your past research projects.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full rounded-xl border-input bg-background py-2 pl-9 pr-3 focus-visible:ring-primary/40 shadow-sm h-11"
              />
            </div>
            <Link href="/research/new" className="shrink-0">
              <Button className="rounded-xl h-11 px-5 shadow-sm hover:scale-105 transition-transform gap-2 font-medium">
                <Plus className="h-4 w-4" />
                New Research
              </Button>
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl border border-border/50 bg-card/40 h-56 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredHistory.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border/80 bg-card/30 flex flex-col items-center justify-center py-24 px-6 text-center shadow-sm">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No research found</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              You haven&apos;t started any research projects yet, or none match your search query.
            </p>
            <Link href="/research/new">
              <Button className="rounded-xl gap-2 font-medium">
                <Plus className="h-4 w-4" />
                Start your first research
              </Button>
            </Link>
          </div>
        )}

        {/* Cards Grid */}
        {!isLoading && filteredHistory.length > 0 && (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredHistory.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => router.push(`/research/${item.id}`)}
                  className="cursor-pointer group flex flex-col justify-between rounded-3xl border border-border bg-card p-6 h-full shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
                >
                  
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <Badge variant="outline" className="bg-muted border-border gap-1.5 py-1 px-3 shadow-xs">
                        <StatusIcon status={item.status} />
                        <span className="capitalize font-medium">{item.status.replace("_", " ")}</span>
                      </Badge>
                      <button 
                        onClick={(e) => handleDelete(item.id, e)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Research"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <h3 className="text-xl font-semibold tracking-tight leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                      {item.query}
                    </h3>
                  </div>

                  <div className="mt-6 border-t border-border/50 pt-4 flex items-center justify-between">
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 font-medium">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{item.source_count} Sources</span>
                      </div>
                      <span>
                        {new Date(item.created_at).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-muted border border-border hover:bg-muted/80 transition-colors">
                        <a href={`/api/research/${item.id}/export?format=pdf`} onClick={(e) => e.stopPropagation()} title="Download PDF">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
