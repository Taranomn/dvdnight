import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dvdnight.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Movie Night",
  title: {
    default: "Movie Night | Find Movies to Watch Together",
    template: "%s | Movie Night",
  },
  description:
    "Browse movies, watch trailers, save films to your Watch List, and match with friends on what to watch together.",
  keywords: [
    "movie night",
    "movie watch list",
    "movie recommendations",
    "watch movies with friends",
    "movie matcher",
    "TMDB movies",
    "IMDb ratings",
    "Rotten Tomatoes ratings",
  ],
  authors: [{ name: "Movie Night" }],
  creator: "Movie Night",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Movie Night",
    title: "Movie Night | Find Movies to Watch Together",
    description:
      "Browse movies, save films to your Watch List, and match with friends on what to watch together.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Movie Night | Find Movies to Watch Together",
    description:
      "A social movie matcher for finding what to watch with friends.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Navbar />
        <main className="min-h-screen pb-24 pt-4 md:pb-8 md:pl-[17rem]">{children}</main>
      </body>
    </html>
  );
}
