import type { Deck } from "./types";

/** A hand-written deck that shows every layout, so the first click needs no key at all. */
export const SAMPLE: Deck = {
  id: "sample",
  title: "How to give a talk people remember",
  prompt: "A short talk on giving talks people remember.",
  theme: "paper",
  createdAt: 0,
  updatedAt: 0,
  slides: [
    { id: "s1", layout: "title", title: "How to give a talk people remember", subtitle: "Ten minutes, one idea, and a room that leaves repeating it." },
    { id: "s2", layout: "statement", title: "Nobody remembers your slides. They remember one sentence.", text: "So decide what that sentence is before you open any software, and build everything else to carry it." },
    { id: "s3", layout: "cards", title: "Three things every memorable talk has", items: [
      { title: "One idea", text: "A single claim you could say to a friend in a lift." },
      { title: "A reason to care", text: "The cost of not knowing it, shown in the first minute." },
      { title: "A way to act", text: "One step the room can take before the day is over." },
    ] },
    { id: "s4", layout: "chart", title: "Where the minutes go in a ten-minute talk", subtitle: "A suggested split, in minutes", items: [
      { title: "The idea", value: "4" }, { title: "The problem", value: "2" }, { title: "The proof", value: "2" }, { title: "The hook", value: "1" }, { title: "The ask", value: "1" },
    ] },
    { id: "s5", layout: "steps", title: "Build it backwards", items: [
      { title: "Write the ask", text: "What should people do when you stop talking?" },
      { title: "Find the proof", text: "The one story or number that makes the ask reasonable." },
      { title: "Name the problem", text: "Why the room should feel the gap right now." },
      { title: "Open with a hook", text: "A question, a scene or a surprise. Never your CV." },
    ] },
    { id: "s6", layout: "compare", title: "Slides that help, slides that hurt", left: { title: "Hurts", bullets: ["Paragraphs you then read aloud", "Six ideas on one slide", "Charts with no headline"] }, right: { title: "Helps", bullets: ["One claim per slide, in the title", "Words the back row can read", "A picture of the point, not decoration"] } },
    { id: "s7", layout: "timeline", title: "The week before", items: [
      { title: "Day 7", text: "Write the one sentence. Say it to three people." },
      { title: "Day 5", text: "Draft the slides. Cut a third." },
      { title: "Day 3", text: "Rehearse aloud, standing, with a timer." },
      { title: "Day 1", text: "Run it once. Then stop touching it." },
    ] },
    { id: "s8", layout: "bullets", title: "On the day", bullets: ["Arrive early and click through every slide on their machine", "Start with the hook, not with thanks", "Pause after the one sentence. Let it land", "Finish early. Nobody minds"] },
    { id: "s9", layout: "quote", text: "If you can't write your idea on the back of a business card, you don't have a clear idea.", by: "" },
    { id: "s10", layout: "closing", title: "Write the one sentence first.", subtitle: "Then let the slides do the carrying." },
  ],
};
