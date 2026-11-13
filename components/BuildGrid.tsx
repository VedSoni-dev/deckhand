import type { Build } from "@/lib/builds";

/** The builds as cards: name, what it does, and the two links that matter (open it, read the code). */
export function BuildGrid({ builds, empty }: { builds: Build[]; empty: string }) {
  if (!builds.length) return <p className="text-mute">{empty}</p>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {builds.map((b, i) => (
        <li key={b.slug} className="build-card rise flex flex-col rounded-2xl border border-line bg-panel p-5" style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}>
          {b.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.cover} alt="" className="mb-4 aspect-[1200/630] w-full rounded-xl border border-line object-cover" loading="lazy" />
          )}
          <h3 className="text-lg font-semibold tracking-tight">{b.name}</h3>
          <p className="mt-1 flex-1 text-sm text-mute">{b.tagline}{b.alternativeTo ? ` Free alternative to ${b.alternativeTo}.` : ""}</p>
          <div className="mt-4 flex gap-2">
            {b.status === "soon"
              ? <span className="btn" aria-disabled>Coming soon</span>
              : <a className="btn btn-primary min-h-11" href={b.url} target="_blank" rel="noopener noreferrer">Open</a>}
            <a className="btn btn-ghost min-h-11" href={b.repo} target="_blank" rel="noopener noreferrer">Code</a>
          </div>
        </li>
      ))}
    </ul>
  );
}
