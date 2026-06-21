import { Search, Sparkles, FileText, LayoutDashboard } from "lucide-react";

export default function Loading() {
  return (
    <main className="research-surface min-h-screen bg-background text-foreground overflow-hidden">
      <section className="min-h-screen w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="grid min-h-[calc(100vh-3rem)] gap-4 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
          {/* History Sidebar Skeleton */}
          <div className="rounded-3xl border border-border/70 bg-card/90 p-3 shadow-sm lg:sticky lg:top-6">
            <div className="space-y-3 border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <div className="h-4 w-20 rounded bg-muted/50 animate-pulse" />
              </div>
              <div className="h-10 w-full rounded-2xl bg-muted/40 animate-pulse" />
            </div>
            <div className="mt-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 w-full rounded-2xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          </div>

          {/* Chat Main Skeleton */}
          <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
                <div className="w-full">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <div className="h-4 w-16 rounded bg-muted/50 animate-pulse" />
                  </div>
                  <div className="mt-3 h-8 w-2/3 rounded-md bg-muted/40 animate-pulse" />
                  <div className="mt-4 h-4 w-full max-w-2xl rounded bg-muted/30 animate-pulse" />
                  <div className="mt-2 h-4 w-3/4 max-w-2xl rounded bg-muted/30 animate-pulse" />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {/* User Message Skeleton */}
                <div className="ml-auto w-3/4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4">
                  <div className="h-4 w-full rounded bg-primary/20 animate-pulse" />
                </div>
                {/* Assistant Message Skeleton */}
                <div className="mr-auto w-5/6 rounded-2xl border border-border/70 bg-muted/30 px-4 py-4">
                  <div className="mb-2 h-3 w-20 rounded bg-muted-foreground/30 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-muted-foreground/20 animate-pulse" />
                    <div className="h-4 w-[90%] rounded bg-muted-foreground/20 animate-pulse" />
                    <div className="h-4 w-[60%] rounded bg-muted-foreground/20 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-[22px] border border-border/70 bg-background/95 p-4">
              <div className="h-4 w-24 rounded bg-muted/50 animate-pulse mb-3" />
              <div className="h-28 w-full rounded-2xl bg-muted/20 animate-pulse" />
              <div className="mt-3 flex gap-2">
                <div className="h-9 w-32 rounded-md bg-muted/40 animate-pulse" />
                <div className="h-9 w-24 rounded-md bg-muted/40 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Context/Export Sidebar Skeleton */}
          <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm lg:sticky lg:top-6">
            <div className="border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <div className="h-4 w-24 rounded bg-muted/50 animate-pulse" />
              </div>
              <div className="mt-3 h-6 w-3/4 rounded bg-muted/40 animate-pulse" />
              <div className="mt-3 space-y-2">
                <div className="h-4 w-full rounded bg-muted/30 animate-pulse" />
                <div className="h-4 w-2/3 rounded bg-muted/30 animate-pulse" />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div className="h-3 w-32 rounded bg-muted-foreground/30 animate-pulse mb-3" />
                <div className="h-5 w-full rounded bg-muted-foreground/20 animate-pulse" />
                <div className="mt-3 h-4 w-24 rounded bg-muted-foreground/20 animate-pulse" />
              </div>

              <div className="grid gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 w-full rounded-md bg-muted/30 animate-pulse" />
                ))}
              </div>

              <div className="mt-4 h-10 w-full rounded-md bg-secondary/50 animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
