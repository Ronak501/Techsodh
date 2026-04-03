"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCheck,
  Copy,
  FilePenLine,
  Loader2,
  MessageSquareText,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";

const toneOptions = [
  {
    value: "natural",
    label: "Natural",
    description: "Keeps meaning while sounding like a real person wrote it.",
  },
  {
    value: "casual",
    label: "Casual",
    description: "Looser, friendlier, and more conversational.",
  },
  {
    value: "professional",
    label: "Professional",
    description: "Clear, polished, and ready for business use.",
  },
  {
    value: "concise",
    label: "Concise",
    description: "Shorter and sharper without losing the point.",
  },
] as const;

const samples = [
  {
    label: "Proposal",
    text: "The proposal showcases a comprehensive framework that leverages multiple stakeholders to enhance synergy across the broader ecosystem. Additionally, it underscores a pivotal shift toward more scalable operations.",
  },
  {
    label: "Email",
    text: "Following our review, we believe this direction aligns with the broader business objectives and would be beneficial to move forward with in the next phase.",
  },
  {
    label: "Product copy",
    text: "This feature helps teams coordinate work faster by combining context, outputs, and clear next steps in one place.",
  },
] as const;

const starterText = samples[0].text;

function getToneAccent(tone: (typeof toneOptions)[number]["value"]) {
  switch (tone) {
    case "casual":
      return "from-amber-500/20 to-orange-500/10";
    case "professional":
      return "from-sky-500/20 to-cyan-500/10";
    case "concise":
      return "from-emerald-500/20 to-teal-500/10";
    default:
      return "from-primary/20 to-primary/5";
  }
}

export default function HumanizerPage() {
  const [text, setText] = useState<string>(starterText);
  const [tone, setTone] =
    useState<(typeof toneOptions)[number]["value"]>("natural");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inputWordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const outputWordCount = output.trim() ? output.trim().split(/\s+/).length : 0;
  const toneLabel =
    toneOptions.find((option) => option.value === tone)?.label || "Natural";

  const handleHumanize = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, tone }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Humanizing failed");
      }

      setOutput(payload.text || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Humanizing failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!output.trim()) return;

    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="humanizer-surface min-h-screen bg-linear-to-br from-background via-background to-muted/35 text-foreground">
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <MobileNavDrawer
              title="Humanizer Navigation"
              items={[
                { href: "/", label: "Home" },
                { href: "/dashboard", label: "Dashboard" },
                { href: "/research", label: "Research" },
                { href: "/chat", label: "Chat" },
                { href: "/humanizer", label: "Humanizer" },
                { href: "/price", label: "Pricing" },
              ]}
            />
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link href="/dashboard" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Writing Studio
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Humanizer Studio
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Tone aware
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              <CheckCheck className="mr-2 h-3.5 w-3.5" />
              Copy ready
            </Badge>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <div className="space-y-6">
            <Card className="overflow-hidden border-border/70 bg-card/80 shadow-sm backdrop-blur">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Rewrite rough text into something human
                    </CardTitle>
                    <CardDescription className="mt-1 max-w-xl">
                      Paste a draft, choose a tone, and generate a cleaner
                      version that keeps the meaning.
                    </CardDescription>
                  </div>
                  <div className="grid gap-2 text-right text-xs text-muted-foreground sm:grid-cols-2 sm:text-left">
                    <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2">
                      <p className="uppercase tracking-[0.16em]">Input words</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {inputWordCount}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2">
                      <p className="uppercase tracking-[0.16em]">
                        Current tone
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {toneLabel}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 p-6 sm:p-8">
                <div>
                  <label className="mb-3 block text-sm font-medium">
                    Quick starts
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {samples.map((sample) => (
                      <Button
                        key={sample.label}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setText(sample.text)}
                        className="rounded-full"
                      >
                        {sample.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Input
                  </label>
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste the text you want to humanize"
                    className="min-h-72 resize-y rounded-2xl border-border/70 bg-background/80 text-sm leading-7"
                  />
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label className="block text-sm font-medium">Tone</label>
                    <p className="text-xs text-muted-foreground">
                      Choose the voice that best fits the destination.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {toneOptions.map((option) => {
                      const active = tone === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setTone(option.value)}
                          className={`rounded-2xl border p-4 text-left transition ${
                            active
                              ? `border-primary/40 bg-linear-to-br ${getToneAccent(option.value)} shadow-sm`
                              : "border-border/70 bg-background/70 hover:bg-muted/35"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold">
                              {option.label}
                            </span>
                            {active ? (
                              <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-primary-foreground">
                                Active
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-xs leading-6 text-muted-foreground">
                            {option.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={handleHumanize}
                    disabled={isLoading}
                    className="gap-2 sm:flex-1"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    Humanize Text
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setText(starterText);
                      setOutput("");
                      setError(null);
                    }}
                    className="gap-2 sm:w-auto"
                  >
                    Reset Example
                  </Button>
                </div>

                {error ? (
                  <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden border-border/70 bg-card/80 shadow-sm backdrop-blur">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">Output</CardTitle>
                    <CardDescription>
                      The rewritten draft appears here.
                    </CardDescription>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    disabled={!output.trim()}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 p-6 sm:p-8">
                <div
                  className={`min-h-80 rounded-3xl border border-border/70 bg-linear-to-br ${getToneAccent(tone)} p-4`}
                >
                  {isLoading ? (
                    <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <div>
                        <p className="text-sm font-medium">
                          Humanizing text...
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Refining tone and structure while keeping the meaning
                          intact.
                        </p>
                      </div>
                    </div>
                  ) : output ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        <FilePenLine className="h-4 w-4 text-primary" />
                        Rewritten draft
                      </div>
                      <div className="report-copy whitespace-pre-wrap rounded-2xl border border-border/60 bg-background/85 p-4 text-sm leading-7 text-foreground shadow-sm">
                        {output}
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-background/50 px-6 text-center">
                      <MessageSquareText className="h-10 w-10 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          Your humanized text will appear here.
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Use a sample or paste your own draft to start.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/60 bg-muted/25 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Status
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {isLoading ? "Working" : output ? "Ready" : "Idle"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/25 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Output words
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {outputWordCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/25 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Tone
                    </p>
                    <p className="mt-1 text-sm font-semibold">{toneLabel}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
