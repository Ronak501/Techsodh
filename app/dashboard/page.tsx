"use client";

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, FileText } from "lucide-react";

export default function DashboardPage() {
  const supabase = createClient()
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserName(
          user.user_metadata?.full_name || user.email || "User"
        );
      }
    };

    getUser();
  }, []);

  const jobs = [
    {
      id: 1,
      query: 'Machine Learning in Healthcare',
      status: 'completed',
      date: '2024-01-15',
      results: 12,
      documents: 3
    },
    {
      id: 2,
      query: 'Quantum Computing Applications',
      status: 'in_progress',
      date: '2024-01-14',
      results: 8,
      documents: 2
    },
    {
      id: 3,
      query: 'Climate Change Mitigation Strategies',
      status: 'completed',
      date: '2024-01-13',
      results: 15,
      documents: 5
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
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

            {/* User Name Section */}
            {/* Right Section */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                👤 {userName ? `Hi, ${userName}` : "Loading..."}
              </div>

              <Button asChild size="sm">
                <Link href="/research/new">
                  New Research
                </Link>
              </Button>

              <Button asChild size="sm">
                <Link href="/chat">
                  Conversations
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="p-6 border-border/50 bg-card/50">
              <p className="text-sm text-muted-foreground mb-2">Total Research</p>
              <p className="text-3xl font-bold text-accent">24</p>
            </Card>
            <Card className="p-6 border-border/50 bg-card/50">
              <p className="text-sm text-muted-foreground mb-2">Completed</p>
              <p className="text-3xl font-bold text-accent">22</p>
            </Card>
            <Card className="p-6 border-border/50 bg-card/50">
              <p className="text-sm text-muted-foreground mb-2">In Progress</p>
              <p className="text-3xl font-bold text-accent">2</p>
            </Card>
          </div>

          <Card className="border-border/50 bg-card/50 overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <h2 className="font-semibold text-lg">Recent Research</h2>
            </div>
            <div className="divide-y divide-border/50">
              {jobs.map((job) => (
                <div key={job.id} className="p-6 hover:bg-card/80 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{job.query}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {job.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {job.results} results
                        </div>
                      </div>
                    </div>
                    <Badge className={job.status === 'completed' ? 'bg-accent' : 'bg-primary'}>
                      {job.status === 'completed' ? 'Completed' : 'In Progress'}
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
          </Card>
        </div>
      </div>
    </div>
  )
}
