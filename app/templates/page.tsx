import { TemplateLibrary } from "@/components/template-library"

export const metadata = {
  title: "Template Library",
  description: "Choose from pre-built research templates to accelerate your workflow",
}

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <TemplateLibrary />
      </div>
    </div>
  )
}
