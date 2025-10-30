import { useEffect, useMemo, useRef, useState } from "react";
import { CONCEPTS, generateSnippet, type Concept } from "./lib/generators";
import "./styles.css";

type TestState = "idle" | "running" | "done";

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

function computeLineStarts(text: string): number[] {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === "\n") starts.push(i + 1);
  return starts;
}

export default function App() {
  const [concept, setConcept] = useState<Concept>("loops");
  const [target, setTarget] = useState<string>(generateSnippet(concept, 3));
  const [input, setInput] = useState<string>("");
  const [state, setState] = useState<TestState>("idle");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const [autoIndent, setAutoIndent] = useState<boolean>(true);
  const hiddenRef = useRef<HTMLTextAreaElement>(null);

  // Focus once on mount
  useEffect(() => {
    hiddenRef.current?.focus();
  }, []);

  // Scoped focus so the dropdown stays open
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest(".toolbar")) return;
      const tag = el.tagName.toLowerCase();
      if (
        tag === "select" ||
        tag === "button" ||
        tag === "input" ||
        tag === "textarea" ||
        el.isContentEditable
      )
        return;
      hiddenRef.current?.focus();
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // Stats
  const { accuracy, wpm } = useMemo(() => {
    let ok = 0;
    for (let i = 0; i < input.length; i++) if (input[i] === target[i]) ok++;
    const elapsedMin = Math.max(
      ((endedAt ?? Date.now()) - (startedAt ?? Date.now())) / 60000,
      1 / 60000
    );
    const grossWpm = Math.max(Math.round(ok / 5 / elapsedMin), 0);
    const acc = input.length
      ? Math.max(0, Math.round((ok / input.length) * 100))
      : 100;
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

  // No space-skipping while typing; Enter controls indentation
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (state === "done") return;
    const raw = e.target.value;
    const nextClamped = raw.length <= target.length ? raw : raw.slice(0, target.length);
    setInput(nextClamped);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Cmd/Ctrl+Enter → restart
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      restart();
      return;
    }

    // If done, ignore
    if (state === "done") return;

    const idx = input.length;

    // Tab → manual skip (optional)
    if (e.key === "Tab") {
      e.preventDefault();
      if (idx < target.length) {
        const run = consumeWhile(target, idx, (c) => c === " " || c === "\t");
        if (run.length) setInput((p) => (p + run).slice(0, target.length));
      }
      return;
    }

    // Enter → newline + EXACT target indent (no synthesis at all)
    if (e.key === "Enter") {
      e.preventDefault();
      setInput((prev) => {
        const caret = prev.length;

        // 1) Insert newline(s) present at caret in target, else single "\n"
        let add =
          caret < target.length && isNL(target[caret])
            ? consumeWhile(target, caret, isNL)
            : "\n";

        if (autoIndent) {
          // 2) Copy the target's indent after those newline(s); may be empty
          const after = prev.length + add.length;
          if (after < target.length) {
            add += consumeWhile(target, after, isSpace);
          }
          // No fallback "+4 after ':'" — always mirror target, fixes gaps/dedents.
        }

        return (prev + add).slice(0, target.length);
      });
      return;
    }
  }

  // ------ 10-line window (current line fixed at row 3 once ≥2 lines typed) ------
  const BEFORE = 2;
  const WINDOW = 10;
  const lineStarts = useMemo(() => computeLineStarts(target), [target]);
  const totalLines = lineStarts.length;

  const currentLine = useMemo(() => {
    const typed = input.match(/\n/g)?.length ?? 0;
    return Math.min(typed, totalLines - 1);
  }, [input, totalLines]);

  const maxStart = Math.max(0, totalLines - WINDOW);
  const desiredStart = currentLine < BEFORE ? 0 : currentLine - BEFORE;
  const startLine = Math.min(desiredStart, maxStart);
  const endLine = Math.min(totalLines, startLine + WINDOW);

  const startChar = lineStarts[startLine] ?? 0;
  const endChar = endLine < totalLines ? lineStarts[endLine] : target.length;

  const visibleChars = useMemo(() => {
    const arr: { ch: string; status: "pending" | "correct" | "wrong" }[] = [];
    for (let gi = startChar; gi < endChar; gi++) {
      let status: "pending" | "correct" | "wrong" = "pending";
      if (gi < input.length) status = input[gi] === target[gi] ? "correct" : "wrong";
      arr.push({ ch: target[gi], status });
    }
    return arr;
  }, [target, input, startChar, endChar]);

  const fullChars = useMemo(() => {
    if (state !== "done") return null;
    const arr: { ch: string; status: "pending" | "correct" | "wrong" }[] = [];
    for (let gi = 0; gi < target.length; gi++) {
      let status: "pending" | "correct" | "wrong" = "pending";
      if (gi < input.length) status = input[gi] === target[gi] ? "correct" : "wrong";
      arr.push({ ch: target[gi], status });
    }
    return arr;
  }, [state, target, input]);

  const caretInSlice = Math.max(0, Math.min(input.length - startChar, endChar - startChar));
  const progress = Math.round((input.length / target.length) * 100);

  return (
    <div className="wrap">
      {/* Toolbar */}
      <div className="toolbar">
        <label className="mode">
          <span className="mode-label">Mode</span>
          <select
            className="mode-select"
            value={concept}
            onChange={(e) => switchConcept(e.target.value as Concept)}
          >
            {CONCEPTS.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="spacer" />

        {/* Auto-indent toggle */}
        <label className="mode" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={autoIndent}
            onChange={(e) => setAutoIndent(e.target.checked)}
          />
          <span className="mode-label">Auto-indent</span>
        </label>

        <button className="btn" onClick={() => restart()}>Restart</button>
        <button className="btn" onClick={() => restart(4)}>New (4 blocks)</button>
      </div>

      {/* Hidden textarea */}
      <textarea
        ref={hiddenRef}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="ghost-input"
        rows={1}
        readOnly={state === "done"}
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

      {/* Stage */}
      <main
        className={`stage ${state === "done" ? "done" : ""}`}
        onClick={() => hiddenRef.current?.focus()}
      >
        {state !== "done" ? (
          <div className="text">
            {visibleChars.map((c, i) => (
              <span
                key={i}
                className={
                  c.status === "correct" ? "char ok" :
                  c.status === "wrong"   ? "char bad" : "char"
                }
              >
                {c.ch === " " ? "\u00A0" : c.ch}
                {i === caretInSlice ? <span className="caret" /> : null}
              </span>
            ))}
          </div>
        ) : (
          <div className="text text-scroll">
            {fullChars!.map((c, i) => (
              <span
                key={i}
                className={
                  c.status === "correct" ? "char ok" :
                  c.status === "wrong"   ? "char bad" : "char"
                }
              >
                {c.ch === " " ? "\u00A0" : c.ch}
              </span>
            ))}
          </div>
        )}
      </main>

      {state === "done" && (
        <footer className="results">
          <div>
            Finished — <strong>{wpm} WPM</strong>, <strong>{accuracy}%</strong> accuracy.
          </div>
          <button className="btn" onClick={() => restart()}>Try Again</button>
        </footer>
      )}
    </div>
  );
}
