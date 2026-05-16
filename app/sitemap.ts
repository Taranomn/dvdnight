import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dvdnight.com").replace(/\/$/, "");

const publicRoutes = [
  "",
  "/search",
  "/explore",
  "/lists/now-playing",
  "/lists/trending",
  "/lists/popular",
  "/lists/top-rated",
  "/lists/imdb-top-250",
  "/lists/rotten-favorites",
  "/lists/modern-classics",
  "/lists/cult-night",
  "/lists/upcoming",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route.startsWith("/lists") ? "daily" : "weekly",
    priority: route === "" ? 1 : route.startsWith("/lists") ? 0.75 : 0.8,
  }));
}
