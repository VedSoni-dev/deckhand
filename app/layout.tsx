import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const title = "Vedant's builds: free, open-source apps";
const description = "Every app from @vedanttalksai in one place. Free and open source, each at its own address, one publik sign-in for all of them.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.HUB_URL ?? "https://deckhand-dusky.vercel.app"),
  title,
  description,
  openGraph: { type: "website", siteName: "Vedant's builds", url: "/", title, description },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e0d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
