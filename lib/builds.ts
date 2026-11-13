// The registry of builds this hub signs in for. Each entry is one app at <slug>.vedantsoni.com with its own repo.
// The studio adds entries (tools/hub-register.mjs); a beacon from an unknown build is still counted, and flagged.
import registry from "@/builds.json";

export interface Build {
  slug: string;
  name: string;
  tagline: string;
  url: string;
  repo: string;
  alternativeTo?: string;
  /** "live" shows an Open button; "soon" shows it greyed. */
  status?: "live" | "soon";
  /** Social image (1200×630 or 1280×640), usually <url>/og.png. */
  cover?: string;
}

export const BUILDS: Build[] = (registry as { builds: Build[] }).builds;
export const isKnown = (slug: string) => BUILDS.some((b) => b.slug === slug);
