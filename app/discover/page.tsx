import { ResearchDiscovery } from "@/components/research-discovery";

export const metadata = {
  title: "Discover Research",
  description: "Search and discover research papers shared across the platform",
};

export default function DiscoveryPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ResearchDiscovery />
      </div>
    </div>
  );
}
