"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "₹0",
    description: "Perfect for students getting started",
    features: [
      "10 Research Queries / month",
      "Basic AI Chat",
      "Limited Context Memory",
      "Community Support",
    ],
    button: "Get Started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "₹499 / month",
    description: "For serious researchers & creators",
    features: [
      "200 Research Queries / month",
      "Advanced AI Research",
      "Persistent Memory",
      "PDF Export",
      "Citation Tracking",
      "Priority Support",
    ],
    button: "Upgrade to Pro",
    highlight: true,
  },
  {
    name: "Premium",
    price: "₹1499 / month",
    description: "For power users & institutions",
    features: [
      "Unlimited Research",
      "Multi-Agent AI",
      "Deep Literature Retrieval",
      "Custom Model Selection",
      "API Access",
      "Premium Support",
    ],
    button: "Go Premium",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-20 px-4">
      <div className="max-w-6xl mx-auto text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">
          Simple & Transparent Pricing
        </h1>
        <p className="text-muted-foreground text-lg">
          Choose the perfect plan for your AI-powered research journey
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <Card
            key={index}
            className={`p-8 border-border/50 ${
              plan.highlight
                ? "border-2 border-primary shadow-lg scale-105"
                : ""
            }`}
          >
            <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
            <p className="text-3xl font-bold mb-4">{plan.price}</p>
            <p className="text-muted-foreground mb-6">{plan.description}</p>

            <ul className="space-y-3 mb-6 text-sm">
              {plan.features.map((feature, i) => (
                <li key={i}>✓ {feature}</li>
              ))}
            </ul>

            <Button
              className="w-full"
              variant={plan.highlight ? "default" : "outline"}
              asChild
            >
              <Link href="/signup">{plan.button}</Link>
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
