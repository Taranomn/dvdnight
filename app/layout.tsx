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

export const metadata: Metadata = {
  title: "Movie Night",
  description: "A cinematic social movie matcher for movie nights.",
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
