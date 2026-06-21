import { LayoutDashboard } from "lucide-react";

export default function Loading() {
  return (
    <main className="min-h-screen bg-background text-foreground pt-16 px-6 sm:px-12 lg:px-24">
      <div className="mx-auto max-w-6xl py-12">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4 border-b border-border/50 pb-8">
          <div className="h-12 w-12 rounded-2xl bg-muted/40 animate-pulse flex items-center justify-center">
            <LayoutDashboard className="h-6 w-6 text-muted-foreground/30" />
          </div>
          <div className="space-y-2">
            <div className="h-8 w-48 rounded bg-muted/50 animate-pulse" />
            <div className="h-4 w-64 rounded bg-muted/30 animate-pulse" />
          </div>
        </div>

        {/* Stats Row Skeleton */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/50 bg-card/50 p-6 shadow-sm">
              <div className="h-4 w-24 rounded bg-muted/40 animate-pulse mb-4" />
              <div className="h-10 w-16 rounded bg-muted/60 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Main Content Area Skeleton */}
        <div className="mt-12">
          <div className="h-6 w-32 rounded bg-muted/50 animate-pulse mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card/30 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-5 w-3/4 rounded bg-muted/50 animate-pulse" />
                  <div className="h-6 w-12 rounded-full bg-muted/30 animate-pulse" />
                </div>
                <div className="space-y-2 mb-6">
                  <div className="h-4 w-full rounded bg-muted/30 animate-pulse" />
                  <div className="h-4 w-5/6 rounded bg-muted/30 animate-pulse" />
                </div>
                <div className="flex items-center gap-2 border-t border-border/30 pt-4 mt-auto">
                  <div className="h-6 w-6 rounded-full bg-muted/40 animate-pulse" />
                  <div className="h-3 w-20 rounded bg-muted/30 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
