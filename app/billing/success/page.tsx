import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBillingPeriod, getBillingPortalUrl } from "@/lib/billing";

type BillingSuccessPageProps = {
  searchParams?: {
    session_id?: string;
    plan?: string;
  };
};

export default async function BillingSuccessPage({
  searchParams,
}: BillingSuccessPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const subscription = user
    ? await supabase
        .from("user_subscriptions")
        .select("plan, status, current_period_end, provider")
        .eq("user_id", user.id)
        .maybeSingle()
    : {
        data: null as null | {
          plan: string;
          status: string;
          current_period_end: string | null;
          provider?: string | null;
        },
      };

  const displayPlan =
    searchParams?.plan || subscription.data?.plan || "your selected plan";

  return (
    <div className="min-h-screen bg-background px-4 py-16 text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Card className="border-border/70 bg-card/80 p-8 shadow-lg">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">Payment received</Badge>
            <Badge variant="outline">Razorpay checkout</Badge>
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance">
            Your upgrade is being activated
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            The checkout completed successfully. Razorpay will sync your
            subscription into the app automatically.
          </p>

          <div className="mt-6 grid gap-3 rounded-xl border border-border/70 bg-muted/30 p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Plan</p>
              <p className="font-medium capitalize">{displayPlan}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium capitalize">
                {subscription.data?.status || "pending sync"}
              </p>
            </div>
            {subscription.data?.current_period_end ? (
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Renewal date</p>
                <p className="font-medium">
                  {formatBillingPeriod(subscription.data.current_period_end)}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={getBillingPortalUrl("/dashboard")}>
                Manage billing
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/price">Back to pricing</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
