/**
 * Scroll chapters below the hero. Static marketing copy (a draft for the author to rewrite):
 * no outcome claims, no phone numbers or organisation names. Hidden in safe mode by CSS.
 */
const HOW = [
  "Tell me what's on your mind.",
  "We pick one small step.",
  "Come back and tell me how it went.",
] as const;

const CAN_DO: ReadonlyArray<{ title: string; note: string }> = [
  { title: "Listen", note: "Say it out loud or type it. No judgment." },
  { title: "One small step", note: "Break a stuck feeling into something doable." },
  { title: "Breathe and ground", note: "Short guided exercises, paced for you." },
  { title: "Celebrate progress", note: "Notice what you did, however small." },
];

const FACTS: ReadonlyArray<{ title: string; note: string }> = [
  { title: "Not a therapist", note: "No diagnoses and no medical advice." },
  { title: "No record kept", note: "This app doesn't save the conversation." },
  { title: "Safety comes first", note: "If things feel unsafe, I stop chatting and show a fixed, reviewed message and resources." },
];

export function Chapters() {
  return (
    <>
      <section className="chapter" id="how" aria-labelledby="how-h">
        <h2 id="how-h" className="reveal">How it works</h2>
        <ol className="steps">
          {HOW.map((text, i) => (
            <li key={text} className="reveal">
              <span className="num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <p className="statement">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="chapter chapter-white" aria-labelledby="can-h">
        <h2 id="can-h" className="reveal">What I can do</h2>
        <ul className="rows">
          {CAN_DO.map((r) => (
            <li key={r.title} className="reveal">
              <strong>{r.title}</strong>
              <span>{r.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="chapter chapter-dark dark-surface" id="privacy" aria-labelledby="priv-h">
        <h2 id="priv-h" className="reveal">Privacy and safety</h2>
        <div className="facts">
          {FACTS.map((f) => (
            <p key={f.title} className="reveal">
              <strong>{f.title}</strong>
              <span>{f.note}</span>
            </p>
          ))}
        </div>
      </section>

      <footer className="foot dark-surface">
        <p className="foot-mark" aria-hidden="true">Wellness companion</p>
        <div className="legal">
          <span>A portfolio proof of concept</span>
          <span>Not a medical service</span>
        </div>
      </footer>
    </>
  );
}
