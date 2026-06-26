import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || "https://techsodh.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/price", "/signin", "/signup"],
        disallow: [
          "/dashboard",
          "/research",
          "/chat",
          "/profile",
          "/humanizer",
          "/billing",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
