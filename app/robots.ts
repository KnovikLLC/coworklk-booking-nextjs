import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://cowork.lk";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/profile",
          "/profile/",
          "/booking/checkout",
          "/booking/success",
          "/pay/",
        ],
      },
      // Explicitly allow AI answer-engine crawlers (blocking them by default
      // would prevent citation in ChatGPT/Perplexity/Google AI Overviews).
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
