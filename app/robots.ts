import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/business";

const PRIVATE_PATHS = [
  "/admin",
  "/admin/",
  "/api/",
  "/profile",
  "/profile/",
  "/booking/checkout",
  "/booking/success",
  "/pay/",
];

// AI search / answer-engine crawlers, explicitly welcomed so ChatGPT,
// Perplexity, Claude, Gemini/AI Overviews, Copilot and Apple Intelligence can
// cite the site. A crawler that matches a named group ignores the "*" group
// entirely, so each named group must repeat the private-path disallows —
// otherwise naming a bot would quietly open /admin and /api to it.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "DuckAssistBot",
  "Meta-ExternalAgent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
