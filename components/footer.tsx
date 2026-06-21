import Link from "next/link";
import { BookOpen } from "lucide-react";
import { FaDiscord, FaRedditAlien, FaXTwitter } from "react-icons/fa6";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12 text-foreground">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-8 md:grid-cols-4 lg:gap-12">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2 transition-opacity hover:opacity-80">
              <BookOpen className="h-6 w-6" />
              <span className="text-xl font-bold tracking-tight">Techsodh</span>
            </Link>
            <p className="mb-6 text-sm text-muted-foreground">
              Automated research with AI-powered literature retrieval, data analysis, and synthesis.
            </p>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Link href="#" className="hover:text-foreground">
                <FaXTwitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-foreground">
                <FaDiscord className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-foreground">
                <FaRedditAlien className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="mb-4 font-semibold">Product</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
              <li><Link href="/price" className="hover:text-foreground">Pricing</Link></li>
              <li><Link href="#testimonials" className="hover:text-foreground">Testimonials</Link></li>
              <li><Link href="/research" className="hover:text-foreground">App</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="mb-4 font-semibold">Resources</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">Documentation</Link></li>
              <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
              <li><Link href="#" className="hover:text-foreground">Community</Link></li>
              <li><Link href="#" className="hover:text-foreground">Help Center</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="mb-4 font-semibold">Legal</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-foreground">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-foreground">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Techsodh. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
