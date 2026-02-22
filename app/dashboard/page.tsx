"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, FileText } from "lucide-react";

type ResearchJob = {
  id: string;
  query: string;
  status: "completed" | "in_progress";
  results: number;
  documents: number;
  created_at: string;
};

export default function DashboardPage() {
  const supabase = createClient();

  const [userName, setUserName] = useState<string | null>(null);
  const [jobs, setJobs] = useState<ResearchJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUserName(user.user_metadata?.full_name || user.email || "User");

      const { data, error } = await supabase
        .from("research_jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setJobs(data);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  // Stats
  const total = jobs.length;
  const completed = jobs.filter(j => j.status === "completed").length;
  const inProgress = jobs.filter(j => j.status === "in_progress").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Your research history and results
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              👤 {userName ? `Hi, ${userName}` : "Loading..."}
            </div>

            <Button asChild size="sm">
              <Link href="/research/new">New Research</Link>
            </Button>

            <Button asChild size="sm">
              <Link href="/chat">Conversations</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Research</p>
            <p className="text-3xl font-bold text-accent">{total}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Completed</p>
            <p className="text-3xl font-bold text-accent">{completed}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">In Progress</p>
            <p className="text-3xl font-bold text-accent">{inProgress}</p>
          </Card>
        </div>

        {/* Research List */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="font-semibold text-lg">Recent Research</h2>
          </div>

          {loading ? (
            <div className="p-6">Loading...</div>
          ) : jobs.length === 0 ? (
            <div className="p-6 text-muted-foreground">
              No research yet. Start one 🚀
            </div>
          ) : (
            <div className="divide-y">
              {jobs.map((job) => (
                <div key={job.id} className="p-6 hover:bg-muted/30 transition">
                  <div className="flex justify-between mb-3">
                    <div>
                      <h3 className="font-semibold mb-1">{job.query}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(job.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {job.results} results
                        </div>
                      </div>
                    </div>

                    <Badge className={
                      job.status === "completed"
                        ? "bg-accent"
                        : "bg-primary"
                    }>
                      {job.status === "completed"
                        ? "Completed"
                        : "In Progress"}
                    </Badge>
                  </div>

                  <Button asChild variant="outline" size="sm">
                    <Link href={`/research/${job.id}`}>
                      View Results
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}