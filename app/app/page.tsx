// "/app": the signed-in launcher (publik's rule for a listed app: it opens with Sign in with publik).
import { PublikGate } from "@/components/PublikGate";
import { BuildGrid } from "@/components/BuildGrid";
import { BUILDS } from "@/lib/builds";

export default function Launcher() {
  return (
    <PublikGate appName="Vedant's builds">
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">Your apps</h1>
        <p className="mt-2 mb-8 text-mute">You&apos;re signed in to publik. In any of these, pick <strong>publik</strong> as the AI and it uses your plan.</p>
        <BuildGrid builds={BUILDS} empty="The first build is on its way." />
      </main>
    </PublikGate>
  );
}
