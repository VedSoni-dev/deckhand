// The public page at "/": every build, no sign-in needed to look.
import Link from "next/link";
import { BUILDS } from "@/lib/builds";
import { BuildGrid } from "@/components/BuildGrid";
import { PublikPitch } from "@/components/PublikGate";

export default function Home() {
  const live = BUILDS.filter((b) => b.status !== "soon");
  return (
    <main className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
      <nav className="flex items-center justify-between py-5">
        <span className="font-semibold tracking-tight">Vedant&apos;s builds</span>
        <div className="flex items-center gap-2">
          <a className="btn btn-ghost min-h-11" href="https://instagram.com/vedanttalksai" target="_blank" rel="noopener noreferrer">@vedanttalksai</a>
          <Link className="btn btn-primary min-h-11" href="/app">Your apps</Link>
        </div>
      </nav>
      <header className="rise pt-12 pb-14 sm:pt-20">
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">Free apps, built in public.</h1>
        <p className="mt-5 max-w-xl text-lg text-mute">
          Clones of paid software, useful AI tools and things I wanted to exist. Every one is open source, lives at its own
          address, and lets you bring your own AI: a local model, your ChatGPT plan, a Claude key, or publik.
        </p>
      </header>
      <section aria-labelledby="all">
        <h2 id="all" className="mb-4 text-sm font-medium uppercase tracking-widest text-mute">{live.length ? `${live.length} apps` : "Apps"}</h2>
        <BuildGrid builds={BUILDS} empty="The first build is on its way." />
      </section>
      <section className="mt-20 max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight">One sign-in for all of them</h2>
        <p className="mt-3 text-mute">Sign in with publik once and every build can use your publik plan for AI: 20x cheaper than OpenAI and Anthropic, and no keys to paste.</p>
        <PublikPitch appName="Vedant's builds" className="landing-pitch mt-6" />
      </section>
    </main>
  );
}
