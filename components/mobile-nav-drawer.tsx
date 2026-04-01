"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

type MobileNavItem = {
  href: string;
  label: string;
};

type MobileNavDrawerProps = {
  title: string;
  items: MobileNavItem[];
};

export function MobileNavDrawer({ title, items }: MobileNavDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-70 lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
          />

          <aside className="glass-panel absolute right-3 top-3 w-72 rounded-3xl border-border/70 p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {title}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close navigation menu"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <nav className="space-y-2">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl border border-border/60 bg-background/70 px-3 py-2.5 text-sm transition hover:bg-accent hover:text-accent-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}
