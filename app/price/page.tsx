"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getBillingPlanAmountPaise,
  getBillingPlanConfig,
  type BillingPlan,
} from "@/lib/billing";

type CheckoutResponse = {
  order_id: string;
  amount: number;
  currency: string;
  key_id?: string;
};

async function readJsonSafely<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type") || "";
  const bodyText = await response.text();

  if (!bodyText.trim()) {
    return null;
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  try {
    return JSON.parse(bodyText) as T;
  } catch {
    return null;
  }
}

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      amount: number;
      currency: string;
      order_id: string;
      name: string;
      description: string;
      prefill?: { name?: string; email?: string };
      notes?: Record<string, string>;
      theme?: { color?: string };
      handler: (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => void | Promise<void>;
      modal?: { ondismiss?: () => void };
      on?: (
        event: "payment.failed",
        callback: (response: {
          error?: { code?: string; description?: string; reason?: string };
        }) => void,
      ) => void;
      "payment.failed"?: (response: {
        error?: { code?: string; description?: string; reason?: string };
      }) => void;
    }) => { open: () => void };
  }
}

type RazorpayCheckoutInstance = {
  open: () => void;
  on?: (
    event: "payment.failed",
    callback: (response: {
      error?: { code?: string; description?: string; reason?: string };
    }) => void,
  ) => void;
};

const checkoutKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

const plans = [
  {
    name: "Professional",
    price: "₹499 / month",
    description: "Designed for researchers, students, and professionals",
    plan: "pro" as const,
    features: [
      "50 Research Queries / month",
      "Advanced AI Research",
      "Persistent Memory",
      "PDF Export",
      "Citation Tracking",
      "Priority Support",
    ],
    button: "Start Professional",
    highlight: true,
  },
  {
    name: "Premium",
    price: "₹1499 / month",
    description: "For power users and advanced research workflows",
    plan: "premium" as const,
    features: [
      "Unlimited Research",
      "Multi-Agent AI",
      "Deep Literature Retrieval",
      "Custom Model Selection",
      "API Access",
      "Premium Support",
    ],
    button: "Choose Premium",
    highlight: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<BillingPlan | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (document.getElementById("razorpay-checkout-script")) return;

    const script = document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const openCheckout = async (plan: BillingPlan) => {
    setCheckoutError(null);
    setLoadingPlan(plan);

    try {
      const amount = getBillingPlanAmountPaise(plan);
      const receipt = `${plan}_${Date.now()}`;

      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          amount,
          currency: "INR",
          receipt,
        }),
      });

      const data = await readJsonSafely<CheckoutResponse | { error?: string }>(
        response,
      );

      if (!response.ok || !data || !("order_id" in data)) {
        throw new Error(
          data && "error" in data && data.error
            ? data.error
            : "Unable to start checkout",
        );
      }

      const Razorpay = window.Razorpay;
      if (!Razorpay) {
        throw new Error(
          "Razorpay checkout is still loading. Please try again.",
        );
      }

      const planConfig = getBillingPlanConfig(plan);
      const keyId = checkoutKeyId || data.key_id;

      if (!keyId) {
        throw new Error("Razorpay key id is missing");
      }

      const checkout = new Razorpay({
        key: keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: "TechSodh",
        description: `${planConfig.label} plan payment`,
        prefill: {
          name: "TechSodh user",
        },
        notes: {
          plan,
          plan_label: planConfig.label,
          receipt,
        },
        theme: { color: "#111827" },
        handler: async (paymentResponse) => {
          const verifyResponse = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            }),
          });

          if (!verifyResponse.ok) {
            const result = await readJsonSafely<{ error?: string }>(
              verifyResponse,
            );
            throw new Error(result?.error || "Payment verification failed");
          }

          router.push(`/billing/success?plan=${plan}`);
        },
        modal: {
          ondismiss: () => setLoadingPlan(null),
        },
      }) as RazorpayCheckoutInstance;

      checkout.on?.("payment.failed", (response) => {
        setCheckoutError(
          response.error?.description || "Payment failed or was cancelled",
        );
        setLoadingPlan(null);
      });

      checkout.open();
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "Checkout failed",
      );
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Button
            onClick={() => router.back()}
            className="text-sm font-medium text-muted-foreground hover:text-foreground bg-black text-white hover:bg-black/90"
          >
            ← Back
          </Button>

          <div className="flex items-center gap-4">
            <Button variant="ghost">Contact Sales</Button>

            <Button className="bg-black text-white hover:bg-black/90">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="text-5xl font-black tracking-tight md:text-7xl lg:text-8xl">
          TechSodh{" "}
          <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-green-400 bg-clip-text text-transparent">
            Plans
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Unlock higher limits and better models.
        </p>

        <p className="mx-auto mt-3 max-w-3xl text-muted-foreground">
          Choose the plan that matches your research ambitions and scale your
          AI-powered research workflow.
        </p>
      </div>

      {checkoutError ? (
        <div className="mx-auto mb-8 max-w-3xl rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {checkoutError}
        </div>
      ) : null}

      <div className="mx-auto mb-20 grid max-w-5xl gap-8 md:grid-cols-2">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative p-8 transition-all duration-300 ${plan.highlight
                ? "scale-105 border-2 border-black shadow-2xl"
                : "border border-border/50"
              }`}
          >
            <h2 className="mb-2 text-2xl font-semibold">{plan.name}</h2>
            <p className="mb-4 text-3xl font-bold">{plan.price}</p>
            <p className="mb-6 text-muted-foreground">{plan.description}</p>

            <ul className="mb-6 space-y-3 text-sm">
              {plan.features.map((feature, i) => (
                <li key={i}>✓ {feature}</li>
              ))}
            </ul>

            <Button
              className="w-full bg-black text-white hover:bg-black/90"
              variant={plan.highlight ? "default" : "outline"}
              onClick={() => openCheckout(plan.plan)}
              disabled={loadingPlan === plan.plan}
            >
              {loadingPlan === plan.plan ? "Opening checkout..." : plan.button}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
