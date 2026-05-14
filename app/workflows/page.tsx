import { WorkflowBuilder } from "@/components/workflow-builder";

export const metadata = {
  title: "Workflows",
  description:
    "Create and manage research workflows to automate multi-step research tasks",
};

export default function WorkflowsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <WorkflowBuilder />
      </div>
    </div>
  );
}
