import { useEffect, useMemo, useRef, useState } from "react";
import { ALL_CONCEPTS, generateSnippet, label, type Concept } from "./lib/generators";
import "./styles.css";

type TestState = "idle" | "running" | "done";

const leadingSpaces = (s: string) => (s.match(/^( +)/)?.[1].length ?? 0);
const getPrevLine = (t: string) => {
  const k = t.lastIndexOf("\n");
  return k === -1 ? t : t.slice(k + 1);
};
const consumeWhile = (T: string, i: number, p: (c: string) => boolean) => {
  let j = i;
  while (j < T.length && p(T[j])) j++;
  return T.slice(i, j);
};
const isSpace = (c: string) => c === " " || c === "\t";
const isNL = (c: string) => c === "\n";

export default function App() {
  const [concept, setConcept] = useState<Concept>("for");
  const [target, setTarget] = useState<string>(generateSnippet(concept, 3));
  const [input, setInput] = useState<string>("");
  const [state, setState] = useState<TestState>("idle");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const hiddenRef = useRef<HTMLTextAreaElement>(null);

  // Keep focus on the hidden textarea (Monkeytype-like)
  useEffect(() => {
    const focus = () => hiddenRef.current?.focus();
    focus();
    window.addEventListener("click", focus);
    return () => window.removeEventListener("click", focus);
  }, []);

  // Stats
  const { accuracy, wpm } = useMemo(() => {
    let ok = 0;
    for (let i = 0; i < input.length; i++) if (input[i] === target[i]) ok++;
    const elapsedMin = Math.max(((endedAt ?? Date.now()) - (startedAt ?? Date.now())) / 60000, 1 / 60000);
    const grossWpm = Math.max(Math.round((ok / 5) / elapsedMin), 0);
    const acc = input.length ? Math.max(0, Math.round((ok / input.length) * 100)) : 100;
    return { accuracy: acc, wpm: grossWpm };
  }, [input, target, startedAt, endedAt]);

  // Start/finish transitions
  useEffect(() => {
    if (state === "idle" && input.length > 0) {
      setState("running");
      setStartedAt(Date.now());
    }
    if (state !== "done" && input.length === target.length) {
      setState("done");
      setEndedAt(Date.now());
    }
  }, [input, target.length, state]);

  function restart(blocks?: number, next?: Concept) {
    const c = next ?? concept;
    const b = blocks ?? 3;
    setTarget(generateSnippet(c, b));
    setInput("");
    setState("idle");
    setStartedAt(null);
    setEndedAt(null);
    hiddenRef.current?.focus();
  }

  function switchConcept(c: Concept) {
    setConcept(c);
    restart(undefined, c);
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    setInput(next.length <= target.length ? next : next.slice(0, target.length));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const idx = input.length;

    // Cmd/Ctrl+Enter → restart
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      restart();
      return;
    }

    // Tab → skip upcoming spaces/tabs in target (jump indentation)
    if (e.key === "Tab") {
      e.preventDefault();
      if (idx >= target.length) return;
      const run = consumeWhile(target, idx, isSpace);
      if (run.length > 0) setInput((p) => (p + run).slice(0, target.length));
      return;
    }

    // Enter → newline (consume block gaps), minimal smart indent after ':'
    if (e.key === "Enter") {
      e.preventDefault();
      let ins = "";
      if (idx < target.length && isNL(target[idx])) ins = consumeWhile(target, idx, isNL);
      else ins = "\n";
      const prev = getPrevLine(input);
      if (prev.trimEnd().endsWith(":")) ins += " ".repeat(leadingSpaces(prev) + 4);
      setInput((p) => (p + ins).slice(0, target.length));
      return;
    }
  }

  // Render per-char coloring
  const chars = useMemo(() => {
    const out: { ch: string; status: "pending" | "correct" | "wrong" }[] = [];
    for (let i = 0; i < target.length; i++) {
      let s: "pending" | "correct" | "wrong" = "pending";
      if (i < input.length) s = input[i] === target[i] ? "correct" : "wrong";
      out.push({ ch: target[i], status: s });
    }
    return out;
  }, [target, input]);

  const currentIndex = input.length;
  const progress = Math.round((currentIndex / target.length) * 100);

  return (
    <div className="wrap">
      {/* Concept tabs */}
      <div className="tabs">
        {ALL_CONCEPTS.map((c) => (
          <button
            key={c}
            className={`tab ${c === concept ? "active" : ""}`}
            onClick={() => switchConcept(c)}
          >
            {label(c)}
          </button>
        ))}
        <div className="spacer" />
        <button className="btn" onClick={() => restart()}>Restart</button>
        <button className="btn" onClick={() => restart(4)}>New (4 blocks)</button>
      </div>

      {/* Hidden textarea for capture */}
      <textarea
        ref={hiddenRef}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="ghost-input"
        rows={1}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        autoFocus
      />

      {/* Stats */}
      <header className="topbar">
        <div className="stat"><strong>WPM</strong> {wpm}</div>
        <div className="stat"><strong>ACC</strong> {accuracy}%</div>
        <div className="stat"><strong>PROG</strong> {progress}%</div>
      </header>

      {/* Typing stage */}
      <main className="stage" onClick={() => hiddenRef.current?.focus()}>
        <div className="text">
          {chars.map((c, i) => (
            <span
              key={i}
              className={c.status === "correct" ? "char ok" : c.status === "wrong" ? "char bad" : "char"}
            >
              {c.ch === " " ? "\u00A0" : c.ch}
              {i === currentIndex && state !== "done" ? <span className="caret" /> : null}
            </span>
          ))}
        </div>
      </main>

      {state === "done" && (
        <footer className="results">
          <div>Finished — <strong>{wpm} WPM</strong>, <strong>{accuracy}%</strong> accuracy.</div>
          <button className="btn" onClick={() => restart()}>Try Again</button>
        </footer>
      )}
    </div>
  );
}
