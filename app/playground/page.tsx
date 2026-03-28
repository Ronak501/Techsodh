"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlayCircle, Copy } from "lucide-react";

export default function PlaygroundPage() {
  const [query, setQuery] = useState("machine learning applications");
  const [topK, setTopK] = useState("5");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/70 bg-card/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Link href="/" className="gap-2 flex items-center">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">API Playground</h1>
              <p className="text-muted-foreground">
                Test the ResearchAgent API
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Request */}
          <Card className="space-y-6 border-border/80 p-6 shadow-lg">
            <h2 className="font-semibold text-lg">Request</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-foreground/90">
                  Research Query
                </label>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter your research query"
                  className="bg-background"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-foreground/90">
                  Top-K Results
                </label>
                <Input
                  type="number"
                  value={topK}
                  onChange={(e) => setTopK(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-foreground/90">
                  Active Agents
                </label>
                <div className="flex gap-2 flex-wrap">
                  {["retrieval", "NLP", "summary", "citation"].map((agent) => (
                    <Badge
                      key={agent}
                      variant="outline"
                      className="cursor-pointer border-border/80 text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-foreground"
                    >
                      {agent}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Button size="lg" className="w-full gap-2">
              <PlayCircle className="w-4 h-4" />
              Send Request
            </Button>
          </Card>

          {/* Response */}
          <div className="space-y-4">
            <Card className="border-border/80 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Response</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>

              <div className="max-h-96 overflow-auto rounded-md border border-border/80 bg-muted/40 p-4 font-mono text-sm text-foreground">
                <pre>{`{
  "query": "${query}",
  "status": "success",
  "results": [
    {
      "id": "paper_001",
      "title": "Deep Learning for Research",
      "relevance": 0.95,
      "citations": 1247
    },
    {
      "id": "paper_002",
      "title": "AI Agents in Automation",
      "relevance": 0.92,
      "citations": 856
    }
  ],
  "summary": "Based on the analysis...",
  "processing_time": "2.34s"
}`}</pre>
              </div>
            </Card>

            <Card className="border-border/80 p-4">
              <p className="text-xs text-muted-foreground">
                Status:
                <Badge className="ml-2 bg-green-600 text-white">200 OK</Badge>
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
