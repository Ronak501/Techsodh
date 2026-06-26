import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
        <BookOpen className="h-8 w-8" />
      </div>
      <h1 className="text-5xl font-bold tracking-tight mb-3">404</h1>
      <p className="text-xl font-semibold mb-2">Page not found</p>
      <p className="text-muted-foreground text-center max-w-sm mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Home
          </Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
