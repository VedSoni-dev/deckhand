import Image from "next/image";
import Link from "next/link";
import { PublikPitch } from "@/components/PublikGate";
import { Logo } from "@/components/ui";

// The public landing page. No gate here: Sign in with publik wraps only the software at /app (app/app/page.tsx).

const GITHUB = "https://github.com/VedSoni-dev/deckhand";
const PUBLIK_LISTING = "https://publikhq.com/deckhand";

// Before 0.1.4 the app lived at /, so share links (/#s=...) and saved-deck links (/#/d/<id>) point here.
// The hash never reaches the server, so this runs in the page, before anything else, and sends them on to /app.
const FORWARD_OLD_LINKS = `if(/^#(s=|\\/d\\/)/.test(location.hash))location.replace("/app"+location.hash)`;

const STEPS = [
  ["Type a topic", "A topic works. So does a wall of pasted notes. Pick a kind of deck (pitch, lesson, report or talk) and a length."],
  ["Fix the plan", "The model outlines the deck first, one line per slide. Reorder, rewrite or cut lines before anything is built."],
  ["Get the deck", "Slides appear one by one as they are written, each drawn from thirteen layouts. Then edit, restyle, present or export."],
] as const;

type Shot = { src: string; w: number; h: number; alt: string; title: string; text: string; wide?: boolean };
const SHOTS: Shot[] = [
  { src: "/media/02-editor.png", w: 2880, h: 1800, alt: "The Deckhand editor: slide thumbnails on the left, a chart slide being edited, with a layout picker and a Rewrite button", title: "Edit anything", text: "Click any text to change it, switch a slide's layout, reorder slides, or ask the AI to rewrite one slide." },
  { src: "/media/03-restyle.png", w: 2880, h: 1800, alt: "The Restyle menu open over a dark purple deck, showing eight themes and five transitions", title: "Restyle in one click", text: "Eight themes and five slide transitions. The words stay put when the look changes." },
  { src: "/media/06-themes.png", w: 2600, h: 748, alt: "Eight slides from the example deck, each in a different theme", title: "Thirteen layouts, eight themes", text: "Stats, timelines, comparisons, charts, quotes and big numbers. Here, eight slides of one deck, each shown in a different theme.", wide: true },
  { src: "/media/04-export.png", w: 2880, h: 1800, alt: "The Export menu: animated web deck, PowerPoint, PDF, copy share link and deck data", title: "Export it your way", text: "PowerPoint, one self-contained animated HTML file, PDF, the deck as JSON, or a share link that carries the whole deck." },
  { src: "/media/07-present.png", w: 2880, h: 1800, alt: "Present mode: a chart slide full screen on a blue theme", title: "Present from the browser", text: "Full screen, with the transition you picked. Slides build in, numbers count up and bars grow." },
  { src: "/media/05-pptx-quicklook.png", w: 3744, h: 1450, alt: "Six slides of the exported .pptx file, rendered by macOS Quick Look", title: "Real PowerPoint", text: "The exported .pptx, rendered by macOS Quick Look. Titles, bullets, cards and charts are native, editable objects, not pictures of slides. It uses system fonts, so type differs slightly from the web view.", wide: true },
];

const GETS = [
  ["No credits, no watermark", "Decks are saved in your browser. Nothing to buy inside the app."],
  ["Your deck as code", "One self-contained, animated .html file that plays in any browser."],
  ["Share by link", "The whole deck is packed into the link. Nothing is uploaded."],
  ["Bring any model", "publik API with no key to paste, or your own OpenAI or Anthropic key, or any OpenAI-compatible endpoint such as OpenRouter or Ollama."],
] as const;

// The README's comparison, Gamma details from gamma.app/pricing, checked November 10, 2026.
const COMPARE: [string, string, string][] = [
  ["Price of the app", "Free, MIT licensed", "Free plan; Plus $12/mo ($9/mo billed yearly); Pro $25/mo ($18/mo yearly); Ultra $100/mo ($90/mo yearly)"],
  ["What the AI costs", "Pay per use from a publik balance (starts at $0.00; linking a publik account adds $0.05 once), or your own OpenAI or Anthropic key billed by them", "400 credits at signup on Free; 1,500 to 20,000 monthly credits on paid plans"],
  ["Account needed", "A free publik account (you sign in with publik when you open the app)", "Yes"],
  ["Gamma or Deckhand branding", "None", "Removing Gamma branding is listed as a Plus feature"],
  ["PowerPoint export", "Yes, native editable text, shapes and charts", "Yes, on every plan"],
  ["Other exports", "PDF, one-file animated HTML, JSON, share link", "PDF, PNG, Google Slides"],
  ["Choice of model", "publik API, your own OpenAI or Anthropic key, or any OpenAI-compatible endpoint (OpenRouter, Ollama)", "Gamma's built-in models"],
  ["AI images", "No, artwork is generative and drawn from the theme", "Yes"],
  ["Collaboration, cloud workspace", "No, decks live in your browser", "Yes"],
  ["Docs, websites, custom domains", "No, slide decks only", "Yes"],
  ["Source code", "Open", "Closed"],
];

const LIMITS = [
  "No images yet: artwork is generative and drawn from the theme.",
  "No collaboration. Decks live in one browser unless you share a link or export.",
  "PowerPoint export uses system fonts, so type differs slightly from the web view.",
  "The model can be wrong. The prompts forbid invented statistics, but check any number before you present it.",
];

const OpenApp = ({ className = "" }: { className?: string }) => (
  <Link href="/app" className={`btn btn-primary ${className}`}>Open Deckhand →</Link>
);

export default function Landing() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 sm:px-6">
      <script dangerouslySetInnerHTML={{ __html: FORWARD_OLD_LINKS }} />
      <header className="flex items-center justify-between gap-3 py-4">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight"><Logo /> Deckhand</Link>
        <nav className="flex items-center gap-1.5" aria-label="Deckhand">
          <a className="hidden rounded-[0.6rem] px-3 py-2 text-xs font-medium text-mute transition hover:bg-sunk hover:text-fg sm:inline-block" href={GITHUB}>GitHub</a>
          <OpenApp />
        </nav>
      </header>

      <main className="flex-1 pb-16">
        <section className="mx-auto max-w-3xl pt-10 text-center sm:pt-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-xs font-medium">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden /> Free Gamma alternative · open source
          </p>
          <h1 className="mt-5 text-balance font-serif text-5xl leading-[1.02] tracking-tight sm:text-7xl">
            Type a topic.<br />Get a <em className="text-accent">designed</em> deck.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-mute sm:text-base">
            Deckhand turns a topic, or a wall of pasted notes, into a designed slide deck. Fix the outline, restyle in one click,
            present from the browser, and export real PowerPoint you can keep editing. No credits, no watermark.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <OpenApp className="h-11 px-5 text-[15px]" />
            <a className="btn h-11 px-5 text-[15px]" href={GITHUB}>View the source</a>
          </div>
          <p className="mx-auto mt-3 max-w-md text-pretty text-xs leading-relaxed text-mute">The app is free. You sign in with a free publik account, then AI runs on a publik plan or your own OpenAI or Anthropic key.</p>
        </section>

        <figure className="mt-10 sm:mt-14">
          <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-[var(--shadow)]">
            <Image
              src="/media/demo.gif" width={1000} height={564} unoptimized preload
              alt="Opening the example deck, restyling it through four themes, and opening the export menu"
              className="block h-auto w-full"
            />
          </div>
          <figcaption className="mt-3 text-center text-xs leading-relaxed text-mute">
            The live app: open the built-in example deck, restyle it through four themes, open Export. No model call in this clip.
          </figcaption>
        </figure>

        <section className="mt-16 sm:mt-24" aria-labelledby="how">
          <h2 id="how" className="font-serif text-4xl tracking-tight sm:text-5xl">How it works</h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-3">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="rounded-2xl border border-line bg-panel p-5">
                <span className="font-mono text-xs text-accent">0{i + 1}</span>
                <h3 className="mt-2 text-[15px] font-semibold">{t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-mute">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16 sm:mt-24" aria-labelledby="tour">
          <h2 id="tour" className="font-serif text-4xl tracking-tight sm:text-5xl">A look inside</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mute">
            Screenshots of the live app with its built-in example deck, &ldquo;How to give a talk people remember&rdquo;. That deck is
            hand-written and ships with the app, so anyone can look around before making their own. It was not generated by a model.
          </p>
          <div className="mt-6 grid gap-x-4 gap-y-8 sm:grid-cols-2">
            {SHOTS.map((s) => (
              <figure key={s.src} className={s.wide ? "sm:col-span-2" : undefined}>
                <a href={s.src} className="block overflow-hidden rounded-xl border border-line bg-sunk transition hover:border-mute" aria-label={`${s.title}: open the full-size screenshot`}>
                  <Image
                    src={s.src} width={s.w} height={s.h} alt={s.alt} className="block h-auto w-full"
                    sizes={s.wide ? "(min-width: 1024px) 976px, 100vw" : "(min-width: 1024px) 480px, (min-width: 640px) 50vw, 100vw"}
                  />
                </a>
                <figcaption className="mt-3">
                  <span className="text-[15px] font-semibold">{s.title}.</span>{" "}
                  <span className="text-sm leading-relaxed text-mute">{s.text}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="mt-16 sm:mt-24" aria-labelledby="gets">
          <h2 id="gets" className="font-serif text-4xl tracking-tight sm:text-5xl">Also in the box</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {GETS.map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-line bg-panel p-5">
                <h3 className="text-[15px] font-semibold">{t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-mute">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 sm:mt-24" aria-labelledby="gamma">
          <h2 id="gamma" className="font-serif text-4xl tracking-tight sm:text-5xl">Compared with Gamma</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mute">
            Gamma is the polished, paid option and does more. Deckhand is for people who want a free, open deck maker with real
            PowerPoint export and their own choice of model.
          </p>
          <div className="mt-6 rounded-2xl border border-line bg-panel px-4 sm:px-5">
            <table className="w-full border-collapse text-left text-sm leading-relaxed">
              <thead className="max-sm:hidden">
                <tr className="text-xs text-mute">
                  <th scope="col" className="w-[24%] py-3 pr-4 font-medium"><span className="sr-only">Feature</span></th>
                  <th scope="col" className="w-[38%] py-3 pr-4 font-semibold text-fg">Deckhand</th>
                  <th scope="col" className="py-3 font-semibold text-fg">Gamma</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([k, d, g]) => (
                  <tr key={k} className="border-t border-line first:max-sm:border-t-0 max-sm:block max-sm:py-3">
                    <th scope="row" className="py-3 pr-4 align-top font-medium max-sm:block max-sm:py-0">{k}</th>
                    <td className="py-3 pr-4 align-top max-sm:block max-sm:py-0.5 max-sm:pr-0">
                      <span className="text-xs font-semibold sm:hidden">Deckhand: </span>{d}
                    </td>
                    <td className="py-3 align-top text-mute max-sm:block max-sm:py-0.5">
                      <span className="text-xs font-semibold text-fg sm:hidden">Gamma: </span>{g}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-mute">
            Gamma details are from <a className="underline underline-offset-2" href="https://gamma.app/pricing">gamma.app/pricing</a>,
            checked November 10, 2026. Deckhand is not affiliated with Gamma.
          </p>
        </section>

        <section className="mt-16 rounded-2xl border border-line bg-panel p-5 sm:mt-24 sm:p-8" aria-labelledby="free">
          <h2 id="free" className="font-serif text-4xl tracking-tight sm:text-5xl">Free, because of publik</h2>
          <PublikPitch appName="Deckhand" className="landing-pitch mt-4 max-w-2xl" />
        </section>

        <section className="mt-16 sm:mt-24" aria-labelledby="limits">
          <h2 id="limits" className="font-serif text-4xl tracking-tight sm:text-5xl">Limits, honestly</h2>
          <ul className="mt-5 max-w-2xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-mute marker:text-accent">
            {LIMITS.map((l) => <li key={l}>{l}</li>)}
          </ul>
        </section>

        <section className="mt-16 border-t border-line pt-12 text-center sm:mt-24" aria-labelledby="go">
          <h2 id="go" className="text-balance font-serif text-4xl tracking-tight sm:text-6xl">Make your first deck.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-mute">Type a topic, fix the outline, get the deck. The example deck is there if you want to look around first.</p>
          <OpenApp className="mt-6 h-11 px-5 text-[15px]" />
        </section>
      </main>

      <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-line py-6 text-center text-xs leading-relaxed text-mute">
        <span>Deckhand is free and open source, MIT licensed.</span>
        <a className="underline underline-offset-2 hover:text-fg" href={GITHUB}>Source on GitHub</a>
        <a className="underline underline-offset-2 hover:text-fg" href={PUBLIK_LISTING}>Deckhand on publik</a>
      </footer>
    </div>
  );
}
