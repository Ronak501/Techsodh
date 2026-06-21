import Link from "next/link";
import { BookOpen } from "lucide-react";
import { FaDiscord, FaRedditAlien, FaXTwitter } from "react-icons/fa6";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-foreground transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Techsodh</span>
        </Link>

        {/* Center Links */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="/price"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="#testimonials"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Testimonials
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 md:flex">
            <Link href="#" className="text-muted-foreground hover:text-foreground">
              <FaDiscord className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground">
              <FaXTwitter className="h-5 w-5" />
            </Link>
          </div>

          <div className="h-5 w-[1px] bg-border hidden md:block" />

          <Link href="/research">
            <Button size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-5 font-semibold shadow-sm">
              Launch App
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
