'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, BookOpen, Brain, Database, Zap } from 'lucide-react'

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-bold text-lg">ResearchAgent</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/research" className="text-sm hover:text-accent transition">
              Research
            </Link>
            <Link href="/dashboard" className="text-sm hover:text-accent transition">
              Dashboard
            </Link>
            <Link href="/playground" className="text-sm hover:text-accent transition">
              Playground
            </Link>
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
              <Link href="/research">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/10 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-balance">
                  AI-Powered Research Automation
                </h1>
                <p className="text-xl text-muted-foreground text-balance">
                  Automated literature retrieval, intelligent data analysis, and evidence-based synthesis powered by advanced AI agents.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                  <Link href="/research" className="gap-2">
                    Try Demo <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/playground">API Playground</Link>
                </Button>
              </div>
            </div>
            
            {/* Animated Illustration */}
            <div className="relative h-96 hidden lg:flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-primary/10 to-transparent rounded-2xl" />
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="absolute w-32 h-32 rounded-full border-2 border-accent/30 animate-pulse" />
                <div className="absolute w-24 h-24 rounded-full border-2 border-primary/50 animate-spin" style={{ animationDuration: '3s' }} />
                <Brain className="w-16 h-16 text-accent relative z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">Powerful Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need for intelligent research automation
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Database,
                title: 'Literature Retrieval',
                description: 'Access comprehensive databases and retrieve relevant papers instantly'
              },
              {
                icon: Brain,
                title: 'NLP Analysis',
                description: 'Extract entities, relations, and insights using advanced NLP'
              },
              {
                icon: Zap,
                title: 'Smart Summarization',
                description: 'Generate concise, evidence-based summaries automatically'
              },
              {
                icon: BookOpen,
                title: 'Citation Tracking',
                description: 'Automatic citation management and verification'
              }
            ].map((feature, i) => (
              <Card key={i} className="p-6 border-border/50 bg-card/50 hover:bg-card/80 transition">
                <feature.icon className="w-8 h-8 text-accent mb-4" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Ready to automate your research?</h2>
            <p className="text-muted-foreground text-lg">
              Start exploring the power of AI-driven research in seconds
            </p>
          </div>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link href="/research">Start Research Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-accent" />
              <span className="font-semibold">ResearchAgent</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition">Privacy</Link>
              <Link href="#" className="hover:text-foreground transition">Terms</Link>
              <Link href="#" className="hover:text-foreground transition">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
