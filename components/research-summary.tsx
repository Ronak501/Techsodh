'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, FileText } from 'lucide-react'

export function ResearchSummary() {
  return (
    <div className="space-y-6">
      <Card className="p-6 border-border/50 bg-gradient-to-br from-card/50 to-card/30">
        <h3 className="font-semibold mb-4">Research Summary</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Based on the analysis of 3 retrieved papers, the research indicates that multi-agent systems with RAG capabilities provide superior performance for information retrieval tasks. Key findings show a 94% accuracy improvement over traditional methods.
        </p>
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Key Finding 1</p>
              <p className="text-sm text-muted-foreground">Multi-agent collaboration improves retrieval accuracy</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Key Finding 2</p>
              <p className="text-sm text-muted-foreground">RAG mechanisms reduce hallucination in generated summaries</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Key Finding 3</p>
              <p className="text-sm text-muted-foreground">NLP preprocessing enhances citation accuracy</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-border/50 bg-card/50">
        <h3 className="font-semibold mb-4">Quality Metrics</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-card/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
            <p className="text-2xl font-bold text-accent">94%</p>
          </div>
          <div className="p-3 rounded-lg bg-card/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Relevance</p>
            <p className="text-2xl font-bold text-accent">92%</p>
          </div>
          <div className="p-3 rounded-lg bg-card/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Coverage</p>
            <p className="text-2xl font-bold text-accent">88%</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-border/50 bg-card/50">
        <h3 className="font-semibold mb-4">Citations & Sources</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded border border-border/50 bg-card/30">
              <div className="flex gap-3 items-start">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Paper Title {i}</p>
                  <p className="text-xs text-muted-foreground truncate">Smith et al., {2023 + i}</p>
                </div>
                <Badge variant="outline" className="flex-shrink-0">Cited</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
