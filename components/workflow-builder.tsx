"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Play, Trash2, ChevronRight } from "lucide-react";
import type { WorkflowDefinition, WorkflowStep } from "@/lib/research-types";

export function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] =
    useState<WorkflowDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    steps: [
      {
        id: "step_1",
        name: "Research Query",
        type: "research" as const,
        config: { query: "{{query}}", mode: "topic" },
      },
    ] as WorkflowStep[],
  });

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await fetch("/api/workflows?my_workflows=true");
        const data = await response.json();
        setWorkflows(data);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, []);

  const handleCreateWorkflow = async () => {
    if (!newWorkflow.name || newWorkflow.steps.length === 0) return;

    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWorkflow),
      });

      if (response.ok) {
        const workflow = await response.json();
        setWorkflows([...workflows, workflow]);
        setNewWorkflow({
          name: "",
          description: "",
          steps: [
            {
              id: "step_1",
              name: "Research Query",
              type: "research",
              config: { query: "{{query}}", mode: "topic" },
            },
          ],
        });
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error("Failed to create workflow:", error);
    }
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    setExecuting(true);
    try {
      const response = await fetch("/api/workflows/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow_id: workflowId,
          variables: { query: "Example research query" },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Workflow execution completed. Tokens used: ${result.tokens_used}`,
        );
      }
    } catch (error) {
      console.error("Failed to execute workflow:", error);
    } finally {
      setExecuting(false);
    }
  };

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      name: "New Step",
      type: "research",
      config: {},
    };
    setNewWorkflow({
      ...newWorkflow,
      steps: [...newWorkflow.steps, newStep],
    });
  };

  const updateStep = (index: number, updates: Partial<WorkflowStep>) => {
    const updatedSteps = [...newWorkflow.steps];
    updatedSteps[index] = { ...updatedSteps[index], ...updates };
    setNewWorkflow({ ...newWorkflow, steps: updatedSteps });
  };

  const removeStep = (index: number) => {
    setNewWorkflow({
      ...newWorkflow,
      steps: newWorkflow.steps.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflows</h2>
          <p className="text-gray-600">
            Chain multiple research tasks together
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant={showCreateForm ? "outline" : "default"}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Workflow
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="p-4 bg-blue-50">
          <div className="space-y-4">
            <Input
              placeholder="Workflow name"
              value={newWorkflow.name}
              onChange={(e) =>
                setNewWorkflow({ ...newWorkflow, name: e.target.value })
              }
            />
            <Textarea
              placeholder="Description"
              value={newWorkflow.description}
              onChange={(e) =>
                setNewWorkflow({ ...newWorkflow, description: e.target.value })
              }
            />

            {/* Steps Editor */}
            <div className="space-y-3">
              <p className="font-medium">Workflow Steps</p>
              {newWorkflow.steps.map((step, index) => (
                <Card key={step.id} className="p-3 bg-white">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Step {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Step name"
                      value={step.name}
                      onChange={(e) =>
                        updateStep(index, { name: e.target.value })
                      }
                    />
                    <select
                      value={step.type}
                      onChange={(e) =>
                        updateStep(index, {
                          type: e.target.value as WorkflowStep["type"],
                        })
                      }
                      className="w-full border rounded px-3 py-2 text-sm"
                    >
                      <option value="research">Research</option>
                      <option value="condition">Condition</option>
                      <option value="transform">Transform</option>
                      <option value="merge">Merge</option>
                    </select>
                    <Textarea
                      placeholder="Config (JSON)"
                      value={JSON.stringify(step.config, null, 2)}
                      onChange={(e) => {
                        try {
                          updateStep(index, {
                            config: JSON.parse(e.target.value),
                          });
                        } catch (error) {
                          // Invalid JSON, ignore
                        }
                      }}
                      className="min-h-16 font-mono text-sm"
                    />
                  </div>
                </Card>
              ))}

              <Button onClick={addStep} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateWorkflow}>Create Workflow</Button>
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

      {/* Workflows List */}
      <div className="space-y-3">
        {loading ? (
          <Card className="p-4 text-center">Loading...</Card>
        ) : workflows.length === 0 ? (
          <Card className="p-4 text-center text-gray-500">
            No workflows yet. Create one to get started!
          </Card>
        ) : (
          workflows.map((workflow) => (
            <Card key={workflow.id} className="p-4 hover:shadow-lg transition">
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-lg">{workflow.name}</h3>
                  {workflow.description && (
                    <p className="text-sm text-gray-600">
                      {workflow.description}
                    </p>
                  )}
                </div>

                {/* Steps Preview */}
                <div className="flex items-center gap-2 text-sm">
                  {workflow.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {step.name}
                      </span>
                      {index < workflow.steps.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handleExecuteWorkflow(workflow.id)}
                  disabled={executing}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {executing ? "Running..." : "Execute"}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
