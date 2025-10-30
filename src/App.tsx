// App.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CONCEPTS,
  LANGS,
  SUPPORTED,
  generateSnippet,
  type Concept,
  type Lang,
} from "./lib/generators";
import "./styles.css";

type TestState = "idle" | "running" | "done";

// -------- helpers --------
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

// ---- layout constants for exact-fit math ----
const PAD_T = 28;            // match CSS .stage padding-top
const PAD_B = 36;            // match CSS .stage padding-bottom
const LINES = 10;            // fixed visible lines
const LINE_H = 1.9;          // match CSS .text line-height
const MIN_FONT = 14;         // px
const MAX_FONT = 32;         // px

export default function App() {
  // ---- state ----
  const [lang, setLang] = useState<Lang>("python");
  const [concept, setConcept] = useState<Concept>("loops");
  const [blocks, setBlocks] = useState<number>(3);
  const [autoIndent, setAutoIndent] = useState<boolean>(true);
  const [repeatSame, setRepeatSame] = useState<boolean>(false);

  const [target, setTarget] = useState<string>(generateSnippet(concept, blocks, lang));
  const [lastTarget, setLastTarget] = useState<string>(target);

  const [input, setInput] = useState<string>("");
  const [state, setState] = useState<TestState>("idle");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);

  const [showSettings, setShowSettings] = useState<boolean>(false);

  // panel height (outer)
  const [panelH, setPanelH] = useState<number>(320);

  // DOM ref to measure wrapper position for accurate cap
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLTextAreaElement>(null);

  // derive font size so 10 lines fill inner height exactly
  const innerHeight = Math.max(0, panelH - PAD_T - PAD_B);
  const fontPxRaw = innerHeight / (LINES * LINE_H);
  const fontPx = Math.min(MAX_FONT, Math.max(MIN_FONT, fontPxRaw)); // continuous scaling, clamped

  // dynamic min height so 10 lines always fit at MIN_FONT
  const getPanelMin = () => PAD_T + PAD_B + LINES * LINE_H * MIN_FONT;

  // keep ~1/5 of viewport free at bottom (≥120px), computed from actual on-screen top
  const getPanelMax = () => {
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const reserve = Math.max(120, Math.round(vh / 5));
    const top =
      stageWrapRef.current ? Math.max(0, stageWrapRef.current.getBoundingClientRect().top) : 0;
    const cap = vh - reserve - top;
    return Math.max(getPanelMin(), Math.min(720, cap));
  };

  const dragRef = useRef<{ dragging: boolean; startY: number; startH: number }>({
    dragging: false,
    startY: 0,
    startH: 320,
  });

  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform || "");

  // Focus once on mount
  useEffect(() => {
    hiddenRef.current?.focus();
  }, []);

  // Ensure initial height respects computed min
  useEffect(() => {
    setPanelH((h) => Math.max(h, getPanelMin()));
  }, []);

  // Scoped focus so dropdowns/settings/handle stay usable
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (
        el.closest(".toolbar") ||
        el.closest(".settings-card") ||
        el.closest(".settings-link-fixed") ||
        el.closest(".resize-handle")
      )
        return;
      const tag = el.tagName.toLowerCase();
      if (["select", "button", "input", "textarea"].includes(tag) || el.isContentEditable) return;
      hiddenRef.current?.focus();
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // Keep cap in sync with viewport changes
  useEffect(() => {
    function onResize() {
      setPanelH((h) => {
        const min = getPanelMin();
        const max = getPanelMax();
        return Math.min(max, Math.max(min, h));
      });
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Drag handlers
  function onDragStart(e: React.MouseEvent<HTMLDivElement>) {
    dragRef.current.dragging = true;
    dragRef.current.startY = e.clientY;
    dragRef.current.startH = panelH;
    document.body.style.userSelect = "none";
  }
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragRef.current.dragging) return;
      const dy = e.clientY - dragRef.current.startY;
      const min = getPanelMin();
      const max = getPanelMax();
      const next = Math.min(max, Math.max(min, dragRef.current.startH + dy));
      setPanelH(next); // fontPx recomputes continuously from panelH, no rounding
    }
    function onUp() {
      if (!dragRef.current.dragging) return;
      dragRef.current.dragging = false;
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
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

  // ---- controls ----
  function restart(nextBlocks?: number, nextConcept?: Concept, nextLang?: Lang) {
    const c = nextConcept ?? concept;
    const L = nextLang ?? lang;
    const b = nextBlocks ?? blocks;

    let next = target;
    if (!repeatSame || target.length === 0) {
      next = generateSnippet(c, b, L);
      setLastTarget(next);
    } else {
      next = lastTarget;
    }

    setTarget(next);
    setInput("");
    setState("idle");
    setStartedAt(null);
    setEndedAt(null);
    hiddenRef.current?.focus();
  }

  function switchConcept(c: Concept) {
    setConcept(c);
    if (repeatSame && lastTarget) {
      setTarget(lastTarget);
      setInput("");
      setState("idle");
      setStartedAt(null);
      setEndedAt(null);
    } else {
      const fresh = generateSnippet(c, blocks, lang);
      setTarget(fresh);
      setLastTarget(fresh);
      setInput("");
      setState("idle");
      setStartedAt(null);
      setEndedAt(null);
    }
  }

  function switchLang(L: Lang) {
    setLang(L);
    const supported = SUPPORTED[L];
    const nextConcept = supported.includes(concept) ? concept : supported[0];
    setConcept(nextConcept);
    const fresh = repeatSame ? lastTarget : generateSnippet(nextConcept, blocks, L);
    setTarget(fresh);
    if (!repeatSame) setLastTarget(fresh);
    setInput("");
    setState("idle");
    setStartedAt(null);
    setEndedAt(null);
  }

  // Typing handlers (no space-skipping while typing; Enter mirrors target)
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (state === "done") return;
    const raw = e.target.value;
    const nextClamped = raw.length <= target.length ? raw : raw.slice(0, target.length);
    setInput(nextClamped);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // ⌘/Ctrl + Enter → restart
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      restart();
      return;
    }

    if (state === "done") return;

    const idx = input.length;

    // Tab → manual skip
    if (e.key === "Tab") {
      e.preventDefault();
      if (idx < target.length) {
        const run = consumeWhile(target, idx, (c) => c === " " || c === "\t");
        if (run.length) setInput((p) => (p + run).slice(0, target.length));
      }
      return;
    }

    // Enter → newline(s) + EXACT target indent (no synthesis)
    if (e.key === "Enter") {
      e.preventDefault();
      setInput((prev) => {
        const caret = prev.length;
        let add =
          caret < target.length && isNL(target[caret])
            ? consumeWhile(target, caret, isNL)
            : "\n";

        if (autoIndent) {
          const after = prev.length + add.length;
          if (after < target.length) {
            add += consumeWhile(target, after, isSpace); // may be empty
          }
        }
        return (prev + add).slice(0, target.length);
      });
      return;
    }
  }

  // ------ fixed 10-line window ------
  const BEFORE = 2;
  const WINDOW = LINES;
  const lineStarts = useMemo(() => computeLineStarts(target), [target]);
  const totalLines = lineStarts.length;

  const currentLine = useMemo(() => {
    const typed = input.match(/\n/g)?.length ?? 0;
    return Math.min(typed, totalLines - 1);
  }, [input, totalLines]);

  const maxStart = Math.max(0, totalLines - WINDOW);
  const startLine = Math.min(currentLine < BEFORE ? 0 : currentLine - BEFORE, maxStart);
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

  const availableConcepts = SUPPORTED[lang];

  // ---- UI ----
  return (
    <div className="wrap">
      {/* Toolbar */}
      <div className="toolbar">
        <label className="mode">
          <span className="mode-label">Lang</span>
          <select
            className="mode-select"
            value={lang}
            onChange={(e) => switchLang(e.target.value as Lang)}
          >
            {LANGS.map((L) => (
              <option key={L.id} value={L.id}>
                {L.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mode">
          <span className="mode-label">Mode</span>
          <select
            className="mode-select"
            value={concept}
            onChange={(e) => switchConcept(e.target.value as Concept)}
          >
            {CONCEPTS.filter((c) => availableConcepts.includes(c.id)).map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="spacer" />

        {/* Restart only */}
        <button className="btn" onClick={() => restart()}>
          Restart
        </button>
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
        <div className="stat">
          <strong>WPM</strong> {wpm}
        </div>
        <div className="stat">
          <strong>ACC</strong> {accuracy}%
        </div>
        <div className="stat">
          <strong>PROG</strong> {progress}%
        </div>
      </header>

      {/* Stage (resizable) */}
      <div
        ref={stageWrapRef}
        className="stage-wrap"
        style={{ height: panelH }}
        onClick={() => hiddenRef.current?.focus()}
      >
        <main className={`stage ${state === "done" ? "done" : ""}`}>
          {state !== "done" ? (
            <div className="text" style={{ fontSize: `${fontPx}px` }}>
              {visibleChars.map((c, i) => (
                <span
                  key={i}
                  className={c.status === "correct" ? "char ok" : c.status === "wrong" ? "char bad" : "char"}
                >
                  {c.ch === " " ? "\u00A0" : c.ch}
                  {i === caretInSlice ? <span className="caret" /> : null}
                </span>
              ))}
            </div>
          ) : (
            <div className="text text-scroll" style={{ fontSize: `${fontPx}px` }}>
              {fullChars!.map((c, i) => (
                <span
                  key={i}
                  className={c.status === "correct" ? "char ok" : c.status === "wrong" ? "char bad" : "char"}
                >
                  {c.ch === " " ? "\u00A0" : c.ch}
                </span>
              ))}
            </div>
          )}
        </main>

        {/* ultra-minimal drag handle */}
        <div
          className="resize-handle"
          onMouseDown={onDragStart}
          role="separator"
          aria-label="Resize editor"
          aria-orientation="vertical"
          tabIndex={-1}
        />
      </div>

      {/* Centered hint */}
      <div className="center-hint">
        {isMac ? "⌘" : "Ctrl"} + Return to restart
      </div>

      {state === "done" && (
        <footer className="results">
          <div>
            Finished — <strong>{wpm} WPM</strong>, <strong>{accuracy}%</strong> accuracy.
          </div>
        </footer>
      )}

      {/* Subtle Settings link (fixed bottom-right) */}
      <button
        className="settings-link-fixed"
        onClick={() => setShowSettings((s) => !s)}
        aria-label="Open settings"
      >
        Settings
      </button>

      {showSettings && (
        <div className="settings-card">
          <div className="settings-row">
            <label className="settings-label">Blocks</label>
            <input
              className="settings-input"
              type="number"
              min={1}
              max={10}
              value={blocks}
              onChange={(e) => {
                const v = Math.max(1, Math.min(10, Number(e.target.value) || 1));
                setBlocks(v);
              }}
            />
            <button className="mini" onClick={() => restart()}>
              Apply
            </button>
          </div>

          <div className="settings-row">
            <label className="settings-label">Auto-indent</label>
            <input
              type="checkbox"
              checked={autoIndent}
              onChange={(e) => setAutoIndent(e.target.checked)}
            />
          </div>

          <div className="settings-row">
            <label className="settings-label">Repeat same test</label>
            <input
              type="checkbox"
              checked={repeatSame}
              onChange={(e) => setRepeatSame(e.target.checked)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
