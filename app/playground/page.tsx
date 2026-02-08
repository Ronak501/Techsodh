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
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-zinc-300 hover:text-white"
            >
              <Link href="/" className="gap-2 flex items-center">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">API Playground</h1>
              <p className="text-zinc-400">Test the ResearchAgent API</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Request */}
          <Card className="p-6 bg-zinc-900 border border-zinc-800 shadow-lg space-y-6">
            <h2 className="font-semibold text-lg">Request</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-zinc-300">
                  Research Query
                </label>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter your research query"
                  className="bg-black border-zinc-700 text-white focus:border-blue-500 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-zinc-300">
                  Top-K Results
                </label>
                <Input
                  type="number"
                  value={topK}
                  onChange={(e) => setTopK(e.target.value)}
                  className="bg-black border-zinc-700 text-white focus:border-blue-500 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-zinc-300">
                  Active Agents
                </label>
                <div className="flex gap-2 flex-wrap">
                  {["retrieval", "NLP", "summary", "citation"].map((agent) => (
                    <Badge
                      key={agent}
                      variant="outline"
                      className="cursor-pointer border-zinc-700 text-zinc-300 hover:bg-blue-500/10 hover:border-blue-500"
                    >
                      {agent}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-500 gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Send Request
            </Button>
          </Card>

          {/* Response */}
          <div className="space-y-4">
            <Card className="p-6 bg-zinc-900 border border-zinc-800 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Response</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-zinc-400 hover:text-white gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>

              <div className="bg-black border border-zinc-800 rounded-md p-4 text-sm font-mono text-zinc-300 overflow-auto max-h-96">
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

            <Card className="p-4 bg-zinc-900 border border-zinc-800">
              <p className="text-xs text-zinc-400">
                Status:
                <Badge className="ml-2 bg-green-600">200 OK</Badge>
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
