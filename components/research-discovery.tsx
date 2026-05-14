"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Tag, Eye, Zap } from "lucide-react";
import type { ResearchSearchResult } from "@/lib/research-types";

export function ResearchDiscovery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<ResearchSearchResult[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        limit: "20",
      });

      selectedTags.forEach((tag) => {
        params.append("tags", tag);
      });

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();
      setResults(data.results || []);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    const newSet = new Set(selectedTags);
    if (newSet.has(tag)) {
      newSet.delete(tag);
    } else {
      newSet.add(tag);
    }
    setSelectedTags(newSet);
  };

  useEffect(() => {
    if (selectedTags.size > 0) {
      handleSearch();
    }
  }, [selectedTags]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search research papers and findings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>
      </Card>

      {/* Common Tags */}
      <div>
        <p className="text-sm font-medium mb-2">Popular Tags</p>
        <div className="flex flex-wrap gap-2">
          {[
            "ai",
            "research",
            "analysis",
            "trending",
            "verification",
            "market",
          ].map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-sm transition ${
                selectedTags.has(tag)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              <Tag className="w-3 h-3 mr-1 inline" />
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {results.length === 0 && searchQuery && !loading && (
          <Card className="p-6 text-center text-gray-500">
            No research found matching your query
          </Card>
        )}

        {results.map((result) => (
          <Card
            key={result.research_id}
            className="p-4 hover:shadow-lg transition"
          >
            <a href={`/research/${result.research_id}`} className="block">
              <h3 className="font-bold text-lg mb-2 hover:text-blue-600">
                {result.title}
              </h3>
            </a>
            <p className="text-sm text-gray-600 mb-2">{result.summary_text}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {result.view_count} views
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4" />
                {result.citation_count} citations
              </div>
              <span>{new Date(result.created_at).toLocaleDateString()}</span>
            </div>
            {result.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {result.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
