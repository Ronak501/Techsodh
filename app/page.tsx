import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  ArrowRight,
  Upload,
  GraduationCap,
  Presentation,
  Lightbulb,
  ShieldCheck,
  FileText,
  Users,
  AudioLines,
} from "lucide-react";
import { FaDiscord, FaRedditAlien, FaXTwitter } from "react-icons/fa6";
import Testimonials from "@/components/testimonials";

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="bg-background/90 backdrop-blur-xl">
        <header className="w-full">
          <div className="mx-auto flex h-20 items-center justify-between px-10">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 stroke-[1.8]" />
              <span className="text-[25px] font-semibold tracking-tight">
                ResearchLM
              </span>
            </Link>

            {/* Right Section */}
            <div className="flex items-center gap-10">
              <nav className="hidden items-center gap-10 md:flex">
                <Link
                  href="#"
                  className="border-b-2 border-black pb-1 text-[18px] font-medium"
                >
                  Overview
                </Link>

                <Link
                  href="/price"
                  className="pb-1 text-[18px] font-medium hover:border-b-2 hover:border-black"
                >
                  Plans
                </Link>
              </nav>

              {/* Social Icons */}
              <div className="hidden items-center gap-6 md:flex">
                <FaDiscord className="h-6 w-6 cursor-pointer" />
                <FaRedditAlien className="h-6 w-6 cursor-pointer" />
                <FaXTwitter className="h-6 w-6 cursor-pointer" />
              </div>

              {/* CTA */}
              <Button className="h-12 rounded-full bg-black px-7 text-base font-medium text-white hover:bg-black/90">
                Get the App
              </Button>
            </div>
          </div>
        </header>
      </div>

      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
        {/* Background Blur */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-1/3 h-96 w-96 rounded-full bg-blue-400/10 blur-[120px]" />
          <div className="absolute right-1/4 top-1/4 h-96 w-96 rounded-full bg-green-400/10 blur-[120px]" />
        </div>

        <Badge
          variant="outline"
          className="mb-8 rounded-full px-5 py-2 text-sm"
        >
          AI Powered Research Platform
        </Badge>

        <h1 className="max-w-6xl text-6xl font-black tracking-tight md:text-8xl lg:text-[110px]">
          Understand{" "}
          <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-green-400 bg-clip-text text-transparent">
            Anything
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
              Try ResearchLM
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>w
      </section>

      <h2 className="mb-20 text-center text-5xl font-medium tracking-tight md:text-6xl">
        Your AI-Powered Research Partner
      </h2>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid items-center gap-16 lg:grid-cols-[420px_1fr]">
          {/* Left Content */}
          <div>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
              <Upload className="h-6 w-6" />
            </div>

            <h3 className="mb-6 text-4xl font-medium tracking-tight">
              Upload your sources
            </h3>

            <p className="text-lg leading-9 text-muted-foreground">
              Upload PDFs, websites, YouTube videos, audio files, Google Docs,
              Google Slides, and more. ResearchLM analyzes your content,
              summarizes important insights, and discovers meaningful
              connections between topics using advanced AI reasoning.
            </p>
          </div>

          <div className="overflow-hidden rounded-[36px] shadow-2xl">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            >
              <source src="/demo.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid items-center gap-16 lg:grid-cols-[420px_1fr]">
          {/* Left Content */}
          <div>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
              <Upload className="h-6 w-6" />
            </div>

            <h3 className="mb-6 text-4xl font-medium tracking-tight">
              Instant insights
            </h3>

            <p className="text-lg leading-9 text-muted-foreground">
              With all of your sources in place, NotebookLM gets to work and
              becomes a personalized AI expert in the information that matters
              most to you.
            </p>
          </div>

          {/* Video / Demo Card */}
          <div className="overflow-hidden rounded-[36px] shadow-2xl">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            >
              <source src="/demo.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid items-center gap-16 lg:grid-cols-[420px_1fr]">
          {/* Left Content */}
          <div>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
              <Upload className="h-6 w-6" />
            </div>

            <h3 className="mb-6 text-4xl font-medium tracking-tight">
              See the source, not just the answer
            </h3>

            <p className="text-lg leading-9 text-muted-foreground">
              Gain confidence in every response because NotebookLM provides
              clear citations for its work, showing you the exact quotes from
              your sources.
            </p>
          </div>

          {/* Video / Demo Card */}
          <div className="overflow-hidden rounded-[36px] shadow-2xl">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            >
              <source src="/demo.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid items-center gap-16 lg:grid-cols-[420px_1fr]">
          {/* Left Content */}
          <div>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
              <Upload className="h-6 w-6" />
            </div>

            <h3 className="mb-6 text-4xl font-medium tracking-tight">
              Listen and learn on the go
            </h3>

            <p className="text-lg leading-9 text-muted-foreground">
              Our new Audio Overview feature can turn your sources into engaging
              “Deep Dive” discussions with one click.
            </p>
          </div>

          {/* Video / Demo Card */}
          <div className="overflow-hidden rounded-[36px] shadow-2xl">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            >
              <source src="/demo.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="mb-24 text-center text-3xl font-medium tracking-tight md:text-6xl">
          How people use ResearchLM
        </h2>

        <div className="grid gap-16 md:grid-cols-3">
          {/* Card 1 */}
          <div>
            <div className="mb-8">
              <GraduationCap className="h-12 w-12 text-indigo-500" />
            </div>

            <h3 className="mb-6 text-[28px] font-normal">Power Research</h3>

            <p className="text-md leading-9 text-muted-foreground">
              Upload research papers, PDFs, technical documentation, and
              datasets. Ask ResearchLM to explain difficult concepts, summarize
              findings, and uncover key insights.
            </p>

            <p className="mt-10 italic text-muted-foreground">
              Learn faster and deeper.
            </p>
          </div>

          {/* Card 2 */}
          <div>
            <div className="mb-8">
              <Presentation className="h-12 w-12 text-indigo-500" />
            </div>

            <h3 className="mb-6 text-[28px] font-normal">
              Organize Your Thinking
            </h3>

            <p className="text-md leading-9 text-muted-foreground">
              Turn scattered notes, articles, and documents into structured
              reports, presentation outlines, and research summaries backed by
              citations.
            </p>

            <p className="mt-10 italic text-muted-foreground">
              Present with confidence.
            </p>
          </div>

          {/* Card 3 */}
          <div>
            <div className="mb-8">
              <Lightbulb className="h-12 w-12 text-indigo-500" />
            </div>

            <h3 className="mb-6 text-[28px] font-normal">Discover New Ideas</h3>

            <p className="text-md leading-9 text-muted-foreground">
              Upload market research, brainstorming notes, competitor analysis,
              and business documents. Let AI identify trends, opportunities, and
              innovative directions.
            </p>

            <p className="mt-10 italic text-muted-foreground">
              Unlock creative potential.
            </p>
          </div>
        </div>
      </section>

      <section className="py-32">
        <h2 className="mb-20 text-center text-6xl">What people are saying</h2>

        <Testimonials />
      </section>

      <section className="relative overflow-hidden px-6 py-15">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-medium leading-tight tracking-tight md:text-5xl">
            We value your privacy and never use your
            <br />
            research data to train our AI models
          </h2>

          <p className="mx-auto mt-8 max-w-4xl text-xl leading-relaxed text-muted-foreground">
            Your documents, reports, PDFs, and research materials remain
            private. ResearchLM keeps your workspace secure and your data is
            never used for model training without your explicit permission.
          </p>

          <button className="mt-4 text-lg font-medium text-blue-600 hover:underline">
            Learn more about privacy
          </button>
        </div>

        {/* Visual */}
        <div className="relative mx-auto mt-24 flex h-[400px] max-w-4xl items-center justify-center">
          {/* Outer Rings */}
          <div className="absolute h-[520px] w-[520px] rounded-full border border-green-500/10" />

          <div className="absolute h-[420px] w-[420px] rounded-full border border-green-500/20" />

          <div className="absolute h-[320px] w-[320px] rounded-full border border-green-500/30" />

          {/* Center Glow */}
          <div className="absolute h-44 w-44 rounded-full bg-green-400/10 blur-3xl" />

          {/* Center Shield */}
          <div className="relative z-10 flex h-36 w-36 items-center justify-center rounded-full bg-white shadow-xl">
            <ShieldCheck className="h-16 w-16 text-neutral-600" />
          </div>

          {/* Floating Icons */}

          <div className="absolute bottom-20 left-24">
            <AudioLines className="h-12 w-12 text-muted-foreground" />
          </div>

          <div className="absolute bottom-12">
            <Users className="h-12 w-12 text-muted-foreground" />
          </div>

          <div className="absolute right-24 top-28">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
      </section>
    </main>
  );
}
