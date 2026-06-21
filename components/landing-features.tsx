import { Upload, Lightbulb, FileText, AudioLines } from "lucide-react";

export function LandingFeatures() {
  return (
    <div className="relative overflow-hidden">
      {/* Subtle background glows */}
      <div className="absolute top-1/4 left-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-violet-500/5 blur-[120px] -z-10" />
      <div className="absolute top-3/4 right-0 h-[600px] w-[600px] translate-x-1/2 rounded-full bg-fuchsia-500/5 blur-[120px] -z-10" />

      <h2 className="mb-24 mt-20 text-center text-5xl font-medium tracking-tight md:text-6xl">
        Your AI-Powered Research Partner
      </h2>

      {/* Feature 1 */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid items-center gap-16 lg:grid-cols-[420px_1fr]">
          <div className="group">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] transition-transform duration-300 group-hover:scale-110">
              <Upload className="h-8 w-8" />
            </div>

            <h3 className="mb-6 text-4xl font-medium tracking-tight">
              Upload your sources
            </h3>

            <p className="text-lg leading-relaxed text-muted-foreground">
              Upload PDFs, websites, YouTube videos, audio files, Google Docs,
              Google Slides, and more. Techsodh analyzes your content,
              summarizes important insights, and discovers meaningful
              connections between topics using advanced AI reasoning.
            </p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 rounded-[40px] bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 blur transition duration-1000 group-hover:opacity-40 group-hover:duration-200" />
            <div className="relative overflow-hidden rounded-[36px] border border-border/50 bg-card shadow-2xl p-2 backdrop-blur-xl">
              <div className="overflow-hidden rounded-[28px] border border-border/30">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                >
                  <source src="/upload.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2 */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid items-center gap-16 lg:grid-cols-[1fr_420px]">
          <div className="relative group order-last lg:order-first">
            <div className="absolute -inset-1 rounded-[40px] bg-gradient-to-r from-fuchsia-500 to-pink-500 opacity-20 blur transition duration-1000 group-hover:opacity-40 group-hover:duration-200" />
            <div className="relative overflow-hidden rounded-[36px] border border-border/50 bg-card shadow-2xl p-2 backdrop-blur-xl">
              <div className="overflow-hidden rounded-[28px] border border-border/30">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                >
                  <source src="/insight.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>

          <div className="group">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] transition-transform duration-300 group-hover:scale-110">
              <Lightbulb className="h-8 w-8" />
            </div>

            <h3 className="mb-6 text-4xl font-semibold tracking-tight">
              Instant insights
            </h3>

            <p className="text-lg leading-relaxed text-muted-foreground">
              With all of your sources in place, Techsodh gets to work and
              becomes a personalized AI expert in the information that matters
              most to you.
            </p>
          </div>
        </div>
      </section>

      {/* Feature 3 */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid items-center gap-16 lg:grid-cols-[420px_1fr]">
          <div className="group">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] transition-transform duration-300 group-hover:scale-110">
              <FileText className="h-8 w-8" />
            </div>

            <h3 className="mb-6 text-4xl font-semibold tracking-tight">
              See the source, not just the answer
            </h3>

            <p className="text-lg leading-relaxed text-muted-foreground">
              Gain confidence in every response because Techsodh provides
              clear citations for its work, showing you the exact quotes from
              your sources.
            </p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 rounded-[40px] bg-gradient-to-r from-blue-500 to-cyan-500 opacity-20 blur transition duration-1000 group-hover:opacity-40 group-hover:duration-200" />
            <div className="relative overflow-hidden rounded-[36px] border border-border/50 bg-card shadow-2xl p-2 backdrop-blur-xl">
              <div className="overflow-hidden rounded-[28px] border border-border/30">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                >
                  <source src="/answer.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 4 */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid items-center gap-16 lg:grid-cols-[1fr_420px]">
          <div className="relative group order-last lg:order-first">
            <div className="absolute -inset-1 rounded-[40px] bg-gradient-to-r from-emerald-500 to-teal-500 opacity-20 blur transition duration-1000 group-hover:opacity-40 group-hover:duration-200" />
            <div className="relative overflow-hidden rounded-[36px] border border-border/50 bg-card shadow-2xl p-2 backdrop-blur-xl">
              <div className="overflow-hidden rounded-[28px] border border-border/30">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                >
                  <source src="/onthego.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>

          <div className="group">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] transition-transform duration-300 group-hover:scale-110">
              <AudioLines className="h-8 w-8" />
            </div>

            <h3 className="mb-6 text-4xl font-semibold tracking-tight">
              Listen and learn on the go
            </h3>

            <p className="text-lg leading-relaxed text-muted-foreground">
              Our new Audio Overview feature can turn your sources into engaging
              “Deep Dive” discussions with one click.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
