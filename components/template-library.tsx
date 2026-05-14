"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Plus, Copy } from "lucide-react";
import type { ResearchTemplateRecord } from "@/lib/research-types";

export function TemplateLibrary() {
  const [templates, setTemplates] = useState<ResearchTemplateRecord[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    category: "literature_review",
    prompt_template: "",
    is_public: false,
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        let url = "/api/templates";
        if (category !== "all") {
          url += `?category=${category}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        setTemplates(data);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [category]);

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.prompt_template) return;

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTemplate,
          settings: {
            output_style: "balanced",
            depth: "standard",
            model_name: "gemini-default",
          },
        }),
      });

      if (response.ok) {
        const template = await response.json();
        setTemplates([template, ...templates]);
        setNewTemplate({
          name: "",
          description: "",
          category: "literature_review",
          prompt_template: "",
          is_public: false,
        });
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error("Failed to create template:", error);
    }
  };

  const useTemplate = (template: ResearchTemplateRecord) => {
    // Copy template to clipboard
    navigator.clipboard.writeText(template.prompt_template);
    alert(`Template prompt copied to clipboard!`);
  };

  const categories = [
    "all",
    "literature_review",
    "technical_report",
    "claim_verification",
    "market_analysis",
    "competitor_analysis",
    "trend_research",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Template Library</h2>
          <p className="text-gray-600">
            Choose from pre-built research templates
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant={showCreateForm ? "outline" : "default"}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="p-4 bg-blue-50">
          <div className="space-y-3">
            <Input
              placeholder="Template name"
              value={newTemplate.name}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, name: e.target.value })
              }
            />
            <Input
              placeholder="Description"
              value={newTemplate.description}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, description: e.target.value })
              }
            />
            <select
              value={newTemplate.category}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, category: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            >
              {categories.slice(1).map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <Textarea
              placeholder="Enter prompt template (use {{query}} as variable)"
              value={newTemplate.prompt_template}
              onChange={(e) =>
                setNewTemplate({
                  ...newTemplate,
                  prompt_template: e.target.value,
                })
              }
              className="min-h-24"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newTemplate.is_public}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    is_public: e.target.checked,
                  })
                }
              />
              <span>Make public (shareable with others)</span>
            </label>
            <div className="flex gap-2">
              <Button onClick={handleCreateTemplate}>Create</Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
              category === cat
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {cat === "all" ? "All Templates" : cat.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <Card className="p-4 col-span-full text-center">Loading...</Card>
        ) : templates.length === 0 ? (
          <Card className="p-4 col-span-full text-center text-gray-500">
            No templates found
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id} className="p-4 hover:shadow-lg transition">
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-lg">{template.name}</h3>
                  <p className="text-sm text-gray-600">
                    {template.description}
                  </p>
                </div>

                {template.example_usage && (
                  <div className="bg-gray-50 p-2 rounded text-sm text-gray-700">
                    <p className="font-medium mb-1">Example:</p>
                    <p>{template.example_usage}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">
                      {template.rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Used {template.usage_count} times
                  </span>
                </div>

                {template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <Button
                  onClick={() => useTemplate(template)}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
