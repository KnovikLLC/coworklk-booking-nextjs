import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSpaces } from "@/lib/data/spaces";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://cowork.lk";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/booking", priority: 0.9, changeFrequency: "daily" },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" },
    { path: "/community", priority: 0.6, changeFrequency: "weekly" },
    { path: "/events", priority: 0.6, changeFrequency: "weekly" },
    { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
    { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  ];

  const staticEntries = routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let spaceEntries: MetadataRoute.Sitemap = [];
  try {
    const spaces = await getActiveSpaces(createAdminClient());
    spaceEntries = spaces.map((space) => ({
      url: `${SITE_URL}/booking/${space.id}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch {
    // Sitemap generation must never fail the build over a DB hiccup;
    // static routes above are still valid without the per-space entries.
  }

  return [...staticEntries, ...spaceEntries];
}
