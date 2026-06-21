import { MessageSquare, Sparkles } from "lucide-react";

export default function Loading() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted/40 animate-pulse flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-muted-foreground/30" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-muted/50 animate-pulse" />
              <div className="h-3 w-20 rounded bg-muted/30 animate-pulse" />
            </div>
          </div>
          <div className="h-9 w-24 rounded-full bg-muted/40 animate-pulse" />
        </div>
      </header>

      {/* Chat Area Skeleton */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-5 py-4 ${i % 2 === 0 ? 'bg-primary/5 border border-primary/20 rounded-br-sm' : 'bg-muted/30 border border-border/50 rounded-bl-sm'}`}>
                {i % 2 === 0 ? (
                  // User Message Skeleton
                  <div className="h-4 w-48 sm:w-64 rounded bg-primary/20 animate-pulse" />
                ) : (
                  // AI Message Skeleton
                  <div className="space-y-3 w-64 sm:w-96">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-muted-foreground/30" />
                      <div className="h-3 w-16 rounded bg-muted-foreground/30 animate-pulse" />
                    </div>
                    <div className="h-4 w-full rounded bg-muted-foreground/20 animate-pulse" />
                    <div className="h-4 w-[90%] rounded bg-muted-foreground/20 animate-pulse" />
                    <div className="h-4 w-[75%] rounded bg-muted-foreground/20 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Area Skeleton */}
      <div className="border-t border-border/40 bg-background/95 p-4 sm:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end gap-3 rounded-[24px] border border-border/70 bg-card p-2 shadow-sm">
            <div className="flex-1 px-4 py-3">
              <div className="h-6 w-1/3 rounded bg-muted/40 animate-pulse" />
            </div>
            <div className="h-12 w-12 shrink-0 rounded-full bg-primary/20 animate-pulse" />
          </div>
          <div className="mt-3 flex justify-center">
            <div className="h-3 w-48 rounded bg-muted/30 animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}
