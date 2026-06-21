import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function LandingHero() {
  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* Background Blur */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[15%] top-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute right-[15%] top-1/3 h-[400px] w-[400px] rounded-full bg-fuchsia-500/10 blur-[120px]" />
      </div>

      <Badge
        variant="secondary"
        className="mb-8 rounded-full px-5 py-2 text-sm border border-border bg-secondary/50 text-secondary-foreground shadow-sm"
      >
        ✨ The New Era of Research
      </Badge>

      <h1 className="max-w-5xl text-5xl font-extrabold tracking-tight md:text-7xl lg:text-[90px] leading-[1.1]">
        Synthesize knowledge <br className="hidden md:block" />
        <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500 bg-clip-text text-transparent">
          instantly
        </span>
      </h1>

      <p className="mt-8 max-w-3xl text-xl leading-relaxed text-muted-foreground md:text-2xl">
        Your research and thinking partner, grounded in trusted sources,
        powered by AI, and designed to help you discover insights faster.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Button
          asChild
          size="lg"
          className="rounded-full bg-black px-8 py-7 text-lg text-white hover:bg-black/90"
        >
          <Link href="/research">
            Try Techsodh
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
