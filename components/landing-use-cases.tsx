import { GraduationCap, Presentation, Lightbulb } from "lucide-react";

export function LandingUseCases() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 relative">
      {/* Subtle background glow for the whole section to enhance 3D effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full -z-10" />

      <h2 className="mb-24 text-center text-3xl font-medium tracking-tight md:text-6xl">
        How people use Techsodh
      </h2>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Card 1 */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-border/60 bg-gradient-to-b from-card/80 to-card/40 p-10 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-indigo-500/30">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          <div className="relative z-10">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <GraduationCap className="h-8 w-8" />
            </div>

            <h3 className="mb-4 text-2xl font-semibold">Power Research</h3>

            <p className="text-md leading-relaxed text-muted-foreground">
              Upload research papers, PDFs, technical documentation, and
              datasets. Ask Techsodh to explain difficult concepts, summarize
              findings, and uncover key insights.
            </p>
          </div>

          <p className="relative z-10 mt-8 font-medium text-indigo-500 opacity-80 transition-opacity group-hover:opacity-100">
            Learn faster and deeper. &rarr;
          </p>
        </div>

        {/* Card 2 */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-border/60 bg-gradient-to-b from-card/80 to-card/40 p-10 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-violet-500/30">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          <div className="relative z-10">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <Presentation className="h-8 w-8" />
            </div>

            <h3 className="mb-4 text-2xl font-semibold">
              Organize Your Thinking
            </h3>

            <p className="text-md leading-relaxed text-muted-foreground">
              Turn scattered notes, articles, and documents into structured
              reports, presentation outlines, and research summaries backed by
              citations.
            </p>
          </div>

          <p className="relative z-10 mt-8 font-medium text-violet-500 opacity-80 transition-opacity group-hover:opacity-100">
            Present with confidence. &rarr;
          </p>
        </div>

        {/* Card 3 */}
        <div className="group relative flex flex-col justify-between rounded-3xl border border-border/60 bg-gradient-to-b from-card/80 to-card/40 p-10 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-fuchsia-500/30">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-fuchsia-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          <div className="relative z-10">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-fuchsia-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <Lightbulb className="h-8 w-8" />
            </div>

            <h3 className="mb-4 text-2xl font-semibold">Discover New Ideas</h3>

            <p className="text-md leading-relaxed text-muted-foreground">
              Upload market research, brainstorming notes, competitor analysis,
              and business documents. Let AI identify trends, opportunities, and
              innovative directions.
            </p>
          </div>

          <p className="relative z-10 mt-8 font-medium text-fuchsia-500 opacity-80 transition-opacity group-hover:opacity-100">
            Unlock creative potential. &rarr;
          </p>
        </div>
      </div>
    </section>
  );
}
