'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Upload, Search, Loader2, CheckCircle } from 'lucide-react'

export function ResearchInterface() {
  const [query, setQuery] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    
    setIsSearching(true)
    setHasSearched(true)
    
    // Simulate API call
    setTimeout(() => {
      setResults([
        {
          id: 1,
          title: 'Deep Learning Architectures for NLP',
          authors: 'Smith, J., Johnson, M.',
          abstract: 'This paper explores modern deep learning architectures used in natural language processing...',
          citations: 1247,
          relevance: 0.95
        },
        {
          id: 2,
          title: 'Retrieval-Augmented Generation in LLMs',
          authors: 'Chen, L., Wang, Y.',
          abstract: 'RAG systems combine retrieval mechanisms with generative models for improved accuracy...',
          citations: 856,
          relevance: 0.92
        },
        {
          id: 3,
          title: 'Multi-Agent Systems for Information Retrieval',
          authors: 'Davis, K., Thompson, R.',
          abstract: 'Multi-agent frameworks enable collaborative problem-solving in complex information tasks...',
          citations: 623,
          relevance: 0.88
        }
      ])
      setIsSearching(false)
    }, 2000)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  return (
    <div className="space-y-8">
      {/* Search Section */}
      <Card className="p-8 border-border/50 bg-card/50">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3">Research Query</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter your research query..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 bg-input border-border/50"
              />
              <Button
                onClick={handleSearch}
                disabled={!query.trim() || isSearching}
                className="bg-primary hover:bg-primary/90"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="border-t border-border/50 pt-6">
            <label className="block text-sm font-medium mb-3">Upload Document (Optional)</label>
            <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-accent/50 transition">
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".pdf,.txt,.docx"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {uploadedFile ? uploadedFile.name : 'Click to upload or drag and drop'}
                </span>
                <span className="text-xs text-muted-foreground">PDF, TXT, or DOCX</span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            {!isSearching && results.length > 0 && (
              <CheckCircle className="w-5 h-5 text-accent" />
            )}
            Research Results ({results.length} found)
          </h3>

          {isSearching ? (
            <Card className="p-12 border-border/50 bg-card/50 flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
              <span className="text-muted-foreground">Analyzing research papers...</span>
            </Card>
          ) : (
            <div className="grid gap-4">
              {results.map((result) => (
                <Card key={result.id} className="p-6 border-border/50 bg-card/50 hover:bg-card/80 transition">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-base">{result.title}</h4>
                      <p className="text-sm text-muted-foreground">{result.authors}</p>
                    </div>
                    <p className="text-sm">{result.abstract}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex gap-6 text-xs text-muted-foreground">
                        <span>{result.citations} citations</span>
                        <span>Relevance: {(result.relevance * 100).toFixed(0)}%</span>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
