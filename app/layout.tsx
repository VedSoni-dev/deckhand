import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Space_Grotesk } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400" });
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"] });

const title = "Deckhand — a free AI deck maker";
const description =
  "Type a topic, get a designed slide deck. Free and open source: no credits, no watermark, real PowerPoint export. Runs on publik API or your own OpenAI or Anthropic key.";
const cover = { url: "/media/cover.png", width: 1200, height: 630, alt: "Deckhand: type a topic, get a designed deck. Free Gamma alternative." };

export const metadata: Metadata = {
  metadataBase: new URL("https://deckhand-dusky.vercel.app"),
  title,
  description,
  openGraph: { type: "website", siteName: "Deckhand", url: "/", title, description, images: [cover] },
  twitter: { card: "summary_large_image", title, description, images: [cover] },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e0d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${serif.variable} ${grotesk.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}
