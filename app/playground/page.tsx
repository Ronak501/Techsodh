'use client'

import { useState } from 'react'
import Link from 'link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, PlayCircle, Copy } from 'lucide-react'

export default function PlaygroundPage() {
  const [activeTab, setActiveTab] = useState('request')
  const [query, setQuery] = useState('machine learning applications')
  const [topK, setTopK] = useState('5')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">API Playground</h1>
              <p className="text-muted-foreground">Test the Research Agent API</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Request Section */}
          <div className="space-y-6">
            <Card className="p-6 border-border/50 bg-card/50">
              <h2 className="font-semibold mb-4">Request</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Query</label>
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter your research query"
                    className="bg-input border-border/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Top-K Results</label>
                  <Input
                    type="number"
                    value={topK}
                    onChange={(e) => setTopK(e.target.value)}
                    className="bg-input border-border/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Agents</label>
                  <div className="flex gap-2 flex-wrap">
                    {['retrieval', 'nLP', 'summary', 'citation'].map((agent) => (
                      <Badge key={agent} variant="outline" className="cursor-pointer hover:bg-accent/10">
                        {agent}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Button size="lg" className="w-full bg-primary hover:bg-primary/90 gap-2">
              <PlayCircle className="w-4 h-4" />
              Send Request
            </Button>
          </div>

          {/* Response Section */}
          <div className="space-y-4">
            <Card className="p-6 border-border/50 bg-card/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Response</h2>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>
              <div className="bg-input border border-border/50 rounded p-4 text-sm font-mono text-muted-foreground overflow-auto max-h-96">
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

            <Card className="p-4 border-border/50 bg-card/30">
              <p className="text-xs text-muted-foreground">Status: <Badge className="ml-2 bg-accent">200 OK</Badge></p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
