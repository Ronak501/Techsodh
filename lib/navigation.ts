/**
 * Shared navigation configuration across the app
 * This eliminates duplicate navigation arrays in multiple pages
 */

export const mainNavigation = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/research", label: "Research" },
  { href: "/humanizer", label: "Humanizer" },
  { href: "/chat", label: "Chat" },
  { href: "/price", label: "Pricing" },
] as const;

export const dashboardNavigation = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/research", label: "Research" },
  { href: "/humanizer", label: "Humanizer" },
  { href: "/chat", label: "Chat" },
  { href: "/price", label: "Pricing" },
] as const;

export const researchNavigation = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chat", label: "Chat" },
  { href: "/humanizer", label: "Humanizer" },
  { href: "/research", label: "Research" },
] as const;

export const chatNavigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/research", label: "Research" },
  { href: "/humanizer", label: "Humanizer" },
  { href: "/chat", label: "Chat" },
] as const;

export const humanizerNavigation = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/research", label: "Research" },
  { href: "/chat", label: "Chat" },
  { href: "/humanizer", label: "Humanizer" },
] as const;
