import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dvdnight.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/search", "/explore", "/movies/", "/people/", "/lists/"],
        disallow: ["/admin", "/api", "/dashboard", "/friends", "/groups", "/login", "/match", "/messages", "/onboarding", "/profile", "/signup", "/watchlist"],
      },
    ],
    sitemap: `${siteUrl.replace(/\/$/, "")}/sitemap.xml`,
  };
}
