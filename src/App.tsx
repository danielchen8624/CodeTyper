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
import { supabase } from "./lib/supabaseClient";

type TestState = "idle" | "running" | "done";

// -------- helpers --------
const consumeWhile = (T: string, i: number, p: (c: string) => boolean) => {
  let j = i;
  while (j < T.length && p(T[j])) j++;
  return T.slice(i, j);
};
const isSpace = (c: string) => c === " " || c === "\t";
const isNL = (c: string) => c === "\n";

// Minutes helper
const minutesElapsed = (start: number, end: number) =>
  Math.max((end - start) / 60000, 1e-6);

function correctWordChars(target: string, input: string): number {
  const T = target.replace(/^\s+/, "");
  const I = input.replace(/^\s+/, "");

  const t = T.split(/(\s+)/);
  const i = I.split(/(\s+)/);

  let chars = 0;

  for (let k = 0; k < t.length && k < i.length; k += 2) {
    const tWord = t[k] ?? "";
    const tSep = t[k + 1] ?? "";
    const iWord = i[k] ?? "";
    const iSep = i[k + 1] ?? "";

    const wordOk = iWord === tWord;
    const sepOk = iSep === tSep || (!tSep && !iSep);

    if (wordOk && sepOk) {
      chars += tWord.length + tSep.length;
    } else {
      break;
    }
  }

  return chars;
}

// Hard-wrap text to a max line length while preserving indentation (no mid-token splits when possible)
function hardWrap(text: string, limit = 70): string {
  const breakable = (s: string) => {
    const w = s.slice(0, limit + 1);
    const pts = [
      w.lastIndexOf(" "),
      w.lastIndexOf("\t"),
      w.lastIndexOf(","),
      w.lastIndexOf(";"),
    ].filter((x) => x > 0);
    return pts.length ? Math.max(...pts) : -1;
  };
  const out: string[] = [];
  for (const original of text.split("\n")) {
    const indent = original.match(/^(\s*)/)?.[1] ?? "";
    let line = original;
    while (line.length > limit) {
      const bp = breakable(line);
      if (bp === -1) {
        out.push(line.slice(0, limit));
        line = indent + line.slice(limit).trimStart();
      } else {
        out.push(line.slice(0, bp).replace(/\s+$/, ""));
        line = indent + line.slice(bp).trimStart();
      }
    }
    out.push(line);
  }
  return out.join("\n");
}

function computeLineStarts(text: string): number[] {
  const starts = [0];
  for (let i = 0; i < text.length; i++)
    if (text[i] === "\n") starts.push(i + 1);
  return starts;
}

// ---- layout constants for exact-fit math ----
const PAD_T = 28;
const PAD_B = 36;
const LINES = 10;
const LINE_H = 1.9;
const MIN_FONT = 14;
const MAX_FONT = 32;

export default function App({ isSignedIn = false }: { isSignedIn?: boolean }) {
  // ---- state ----
  const [lang, setLang] = useState<Lang>("python");
  const [concept, setConcept] = useState<Concept>("loops");
  const [blocks, setBlocks] = useState<number>(3);
  const [autoIndent, setAutoIndent] = useState<boolean>(true);
  const [repeatSame, setRepeatSame] = useState<boolean>(false);

  const [target, setTarget] = useState<string>(
    hardWrap(generateSnippet(concept, blocks, lang), 70)
  );
  const [lastTarget, setLastTarget] = useState<string>(target);

  const [input, setInput] = useState<string>("");
  const [state, setState] = useState<TestState>("idle");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);

  const [showSettings, setShowSettings] = useState<boolean>(false);

  // 🆕 Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // resizable panel height
  const [panelH, setPanelH] = useState<number>(320);

  // focus indicators & focus mode
  const [hasFocus, setHasFocus] = useState<boolean>(true);
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [squelchHint, setSquelchHint] = useState<boolean>(false);

  // DOM refs
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLTextAreaElement>(null);
  const hasSavedRef = useRef(false);
  const hasRunSavedRef = useRef(false); // 🆕

  // derive font size so 10 lines fill inner height exactly
  const innerHeight = Math.max(0, panelH - PAD_T - PAD_B);
  const fontPxRaw = innerHeight / (LINES * LINE_H);
  const fontPx = Math.min(MAX_FONT, Math.max(MIN_FONT, fontPxRaw));

  // dynamic min height so 10 lines always fit at MIN_FONT
  const getPanelMin = () => PAD_T + PAD_B + LINES * LINE_H * MIN_FONT;

  // cap so ≥1/5 viewport bottom stays free
  const getPanelMax = () => {
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const reserve = Math.max(120, Math.round(vh / 5));
    const top = stageWrapRef.current
      ? Math.max(0, stageWrapRef.current.getBoundingClientRect().top)
      : 0;
    const cap = vh - reserve - top;
    return Math.max(getPanelMin(), Math.min(720, cap));
  };

  const dragRef = useRef<{ dragging: boolean; startY: number; startH: number }>(
    {
      dragging: false,
      startY: 0,
      startH: 320,
    }
  );

  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform || "");

  // Focus textarea on mount
  useEffect(() => {
    hiddenRef.current?.focus();
  }, []);

  // Track DOM focus (for hint badge)
  useEffect(() => {
    const sync = () =>
      setHasFocus(document.activeElement === hiddenRef.current);
    document.addEventListener("focusin", sync);
    document.addEventListener("focusout", sync);
    window.addEventListener("blur", () => setHasFocus(false));
    window.addEventListener("focus", sync);
    return () => {
      document.removeEventListener("focusin", sync);
      document.removeEventListener("focusout", sync);
      window.removeEventListener("blur", () => setHasFocus(false));
      window.removeEventListener("focus", sync);
    };
  }, []);

  // Exit focus mode on any pointer activity
  useEffect(() => {
    const exit = () => setFocusMode(false);
    window.addEventListener("mousemove", exit);
    window.addEventListener("mousedown", exit);
    window.addEventListener("touchstart", exit, { passive: true } as any);
    return () => {
      window.removeEventListener("mousemove", exit);
      window.removeEventListener("mousedown", exit);
      window.removeEventListener("touchstart", exit as any);
    };
  }, []);

  // Scoped auto-focus when clicking empty areas (but ignore controls + brand bar)
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (
        el.closest(".topbar-mk") ||
        el.closest(".mk-profile") ||
        el.closest(".settings-card") ||
        el.closest(".settings-link-fixed") ||
        el.closest(".feedback-link-fixed") ||
        el.closest(".resize-handle") ||
        el.closest(".center-actions") ||
        el.closest(".brand-bar")
      )
        return;
      const tag = el.tagName.toLowerCase();
      if (
        ["select", "button", "input", "textarea"].includes(tag) ||
        el.isContentEditable
      )
        return;
      hiddenRef.current?.focus();
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // Enforce initial min height
  useEffect(() => {
    setPanelH((h) => Math.max(h, getPanelMin()));
  }, []);

  // Keep height within caps on resize
  useEffect(() => {
    const onResize = () => {
      setPanelH((h) => {
        const min = getPanelMin();
        const max = getPanelMax();
        return Math.min(max, Math.max(min, h));
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Release squelch when mouse/touch ends
  useEffect(() => {
    const release = () => setSquelchHint(false);
    window.addEventListener("mouseup", release);
    window.addEventListener("touchend", release);
    return () => {
      window.removeEventListener("mouseup", release);
      window.removeEventListener("touchend", release);
    };
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
      setPanelH(next);
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

  // ---- Stats (Monkeytype) ----
  const { accuracy, wpm, rawWpm } = useMemo(() => {
    // accuracy: correct keystrokes / total keystrokes
    let correctKeys = 0;
    for (let k = 0; k < input.length && k < target.length; k++) {
      if (input[k] === target[k]) correctKeys++;
    }
    const acc = input.length
      ? Math.round((correctKeys / input.length) * 100)
      : 100;

    const end = endedAt ?? Date.now();
    let mins = startedAt ? minutesElapsed(startedAt, end) : 0;

    // Warm-up floor while running to avoid first-keystroke spikes
    if (!endedAt) {
      const FLOOR = 2 / 60; // 2 seconds
      if (mins < FLOOR) mins = FLOOR;
    } else {
      mins = Math.max(mins, 1e-6);
    }

    const correctCharsInCorrectWords = correctWordChars(target, input);
    const mtWpm = Math.round(correctCharsInCorrectWords / 5 / mins); // Monkeytype WPM
    const mtRaw = Math.round(input.length / 5 / mins); // Raw WPM

    return { accuracy: acc, wpm: mtWpm, rawWpm: mtRaw };
  }, [input, target, startedAt, endedAt]);

  // Start/finish transitions
  useEffect(() => {
    if (state === "idle" && input.length > 0) {
      setState("running");
      setStartedAt(Date.now());
      setFocusMode(true);
    }
    if (state !== "done" && input.length === target.length) {
      setState("done");
      setEndedAt(Date.now());
      setFocusMode(false); // ensure no blur after finish
    }
  }, [input, target.length, state]);

  // Save run + leaderboard once per finished run
  useEffect(() => {
    if (state !== "done") return;

    console.log("Save effect hit", {
      isSignedIn,
      startedAt,
      endedAt,
      alreadySaved: hasSavedRef.current,
    });

    if (!startedAt || !endedAt || hasSavedRef.current) return;

    hasSavedRef.current = true;

    const saveScore = async () => {
      // If they’re not signed in, still save an anon run (but no leaderboard row)
      const { data, error: userError } = await supabase.auth.getUser();

      const user = data?.user ?? null;
      const isAnon = !user;

      if (userError) {
        console.error("getUser error:", userError);
      }

      const mins = minutesElapsed(startedAt, endedAt);
      const durationMs = endedAt - startedAt;
      const codePerMinute = Math.round(input.length / Math.max(mins, 1e-6));

      // 1) INSERT into runs
      const { error: runsErr } = await supabase.from("runs").insert({
        user_id: user ? user.id : null,
        started_at: new Date(startedAt).toISOString(),
        ended_at: new Date(endedAt).toISOString(),
        duration_ms: durationMs,
        lang,
        concept,
        wpm,
        raw_wpm: rawWpm,
        accuracy,
        is_anon: isAnon,
      });

      if (runsErr) {
        console.error("Error inserting into runs:", runsErr);
      }

      // 2) Only put logged-in users on the leaderboard
      if (!user) return;

      const usernameFromMeta =
        (user.user_metadata as any)?.username ??
        user.email?.split("@")[0] ??
        "anon";

      const { error: upsertErr } = await supabase.from("users").upsert(
        {
          id: user.id,
          email: user.email,
          username: usernameFromMeta,
        },
        { onConflict: "id" }
      );

      if (upsertErr) {
        console.error("Error upserting into users:", upsertErr);
        return;
      }

      const { error: lbErr } = await supabase.from("leaderboard").insert({
        user_id: user.id,
        language: lang,
        code_per_minute: codePerMinute,
      });

      if (lbErr) {
        console.error("Error saving score to leaderboard:", lbErr);
      } else {
        console.log("Saved score to leaderboard:", {
          language: lang,
          codePerMinute,
        });
      }
    };

    void saveScore();
  }, [
    state,
    startedAt,
    endedAt,
    input.length,
    lang,
    concept,
    wpm,
    rawWpm,
    accuracy,
    isSignedIn,
  ]);

  async function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setFeedbackStatus("sending");
    setFeedbackError(null);

    const { error } = await supabase.from("feedback").insert({
      message: feedbackText.trim(),
    });

    if (error) {
      console.error("Error sending feedback:", error);
      setFeedbackStatus("error");
      setFeedbackError("Something went wrong. Please try again.");
      return;
    }

    setFeedbackStatus("sent");
    setFeedbackText("");
    // auto-close after a short delay
    setTimeout(() => {
      setShowFeedbackModal(false);
      setFeedbackStatus("idle");
    }, 800);
  }

  // ---- controls ----
  function restart(
    nextBlocks?: number,
    nextConcept?: Concept,
    nextLang?: Lang
  ) {
    const c = nextConcept ?? concept;
    const L = nextLang ?? lang;
    const b = nextBlocks ?? blocks;

    let next = target;
    if (!repeatSame || target.length === 0) {
      next = hardWrap(generateSnippet(c, b, L), 70);
      setLastTarget(next);
    } else {
      next = hardWrap(lastTarget, 70);
    }

    setTarget(next);
    setInput("");
    setState("idle");
    setStartedAt(null);
    setEndedAt(null);
    setFocusMode(false); // reset; typing will enable it again
    hasSavedRef.current = false;
    hasRunSavedRef.current = false; // 🆕 reset run-saving flag
    hiddenRef.current?.focus();
  }

  function switchConcept(c: Concept) {
    setConcept(c);
    const fresh =
      repeatSame && lastTarget
        ? hardWrap(lastTarget, 70)
        : hardWrap(generateSnippet(c, blocks, lang), 70);
    setTarget(fresh);
    if (!repeatSame) setLastTarget(fresh);
    setInput("");
    setState("idle");
    setStartedAt(null);
    setEndedAt(null);
    setFocusMode(false);
  }

  function switchLang(L: Lang) {
    setLang(L);
    const supported = SUPPORTED[L];
    const nextConcept = supported.includes(concept) ? concept : supported[0];
    setConcept(nextConcept);
    const fresh = repeatSame
      ? hardWrap(lastTarget, 70)
      : hardWrap(generateSnippet(nextConcept, blocks, L), 70);
    setTarget(fresh);
    if (!repeatSame) setLastTarget(fresh);
    setInput("");
    setState("idle");
    setStartedAt(null);
    setEndedAt(null);
    setFocusMode(false);
  }

  // Typing handlers — enter focus mode only while NOT done
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setFocusMode(true);
    if (state === "done") return;
    const raw = e.target.value;
    const nextClamped =
      raw.length <= target.length ? raw : raw.slice(0, target.length);
    setInput(nextClamped);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (state !== "done") setFocusMode(true);

    // ⌘/Ctrl + Enter → restart
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setSquelchHint(true);
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
    // Enter → insert the exact run of target newlines, then indent of the first non-empty line after them
    if (e.key === "Enter") {
      e.preventDefault();
      setInput((prev) => {
        const caret = prev.length;

        // 1) Add the exact newline run from target (preserves block jumps)
        let add = "\n";
        if (caret < target.length && isNL(target[caret])) {
          add = consumeWhile(target, caret, isNL); // may be "\n\n" etc.
        }

        // 2) Append indentation from the first non-empty line after that run
        if (autoIndent) {
          let scan = caret + add.length;
          let indent = "";

          while (scan < target.length) {
            const start = scan;
            while (scan < target.length && isSpace(target[scan])) scan++;

            // if this line has code, capture its leading spaces/tabs
            if (scan < target.length && target[scan] !== "\n") {
              indent = target.slice(start, scan);
              break;
            }

            // empty line → skip to the next line
            const nl = target.indexOf("\n", scan);
            if (nl === -1) break;
            scan = nl + 1;
          }
          add += indent;
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
  const startLine = Math.min(
    currentLine < BEFORE ? 0 : currentLine - BEFORE,
    maxStart
  );
  const endLine = Math.min(totalLines, startLine + WINDOW);

  const startChar = lineStarts[startLine] ?? 0;
  const endChar = endLine < totalLines ? lineStarts[endLine] : target.length;

  const visibleChars = useMemo(() => {
    const arr: { ch: string; status: "pending" | "correct" | "wrong" }[] = [];
    for (let gi = startChar; gi < endChar; gi++) {
      let status: "pending" | "correct" | "wrong" = "pending";
      if (gi < input.length)
        status = input[gi] === target[gi] ? "correct" : "wrong";
      arr.push({ ch: target[gi], status });
    }
    return arr;
  }, [target, input, startChar, endChar]);

  const fullChars = useMemo(() => {
    if (state !== "done") return null;
    const arr: { ch: string; status: "pending" | "correct" | "wrong" }[] = [];
    for (let gi = 0; gi < target.length; gi++) {
      let status: "pending" | "correct" | "wrong" = "pending";
      if (gi < input.length)
        status = input[gi] === target[gi] ? "correct" : "wrong";
      arr.push({ ch: target[gi], status });
    }
    return arr;
  }, [state, target, input]);

  const caretInSlice = Math.max(
    0,
    Math.min(input.length - startChar, endChar - startChar)
  );
  const progress = Math.round((input.length / target.length) * 100);

  const availableConcepts = SUPPORTED[lang];

  // ---- UI ----
  return (
    <div className={`wrap ${focusMode ? "focus-mode" : ""}`}>
      {/* Top bar */}
      <div className="topbar-mk dim-on-focus">
        <div className="mk-group">
          <span className="mk-icon">@</span>
          <span className="mk-label">lang</span>
          <span className="mk-selectwrap">
            <select
              className="mk-select"
              value={lang}
              onChange={(e) => switchLang(e.target.value as Lang)}
            >
              {LANGS.map((L) => (
                <option key={L.id} value={L.id}>
                  {L.label}
                </option>
              ))}
            </select>
          </span>
        </div>

        <div className="mk-divider" />

        <div className="mk-group">
          <span className="mk-icon">A</span>
          <span className="mk-label">mode</span>
          <span className="mk-selectwrap">
            <select
              className="mk-select"
              value={concept}
              onChange={(e) => switchConcept(e.target.value as Concept)}
            >
              {CONCEPTS.filter((c) => availableConcepts.includes(c.id)).map(
                ({ id, label }) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                )
              )}
            </select>
          </span>
        </div>

        <div className="mk-spacer" />

        <div className="mk-stats">
          {state === "done" ? (
            <>
              <div className="mk-pill">
                <strong>WPM</strong>
                {wpm}
              </div>
              <div className="mk-pill">
                <strong>RAW</strong>
                {rawWpm}
              </div>
              <div className="mk-pill">
                <strong>ACC</strong>
                {accuracy}%
              </div>
            </>
          ) : null}
          <div className="mk-pill">
            <strong>PROG</strong>
            {progress}%
          </div>
        </div>

        {/* View leaderboard button (left of profile) */}
        <button
          className="mk-pill"
          type="button"
          onClick={() => {
            window.location.hash = "#/leaderboardPage"; // <- match main.tsx route
          }}
          aria-label="View leaderboard"
        >
          View leaderboard
        </button>

        {/* Profile button */}
        <div
          className="mk-profile dim-on-focus"
          aria-label="Profile"
          title="Profile"
        >
          <button
            className="profile-btn"
            type="button"
            onClick={() => {
              window.location.hash = isSignedIn ? "#/profile" : "#/login";
            }}
            aria-label="Profile"
            title="Profile"
          >
            <span className="avatar-circle"></span>
          </button>
        </div>
      </div>

      {/* Hidden textarea */}
      <textarea
        ref={hiddenRef}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setHasFocus(true)}
        onBlur={() => setHasFocus(false)}
        className="ghost-input"
        rows={1}
        readOnly={state === "done"}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        autoFocus
      />

      {/* Stage (resizable) */}
      <div
        ref={stageWrapRef}
        className={`stage-wrap ${hasFocus ? "" : "unfocused"}`}
        style={{ height: panelH }}
        onClick={() => hiddenRef.current?.focus()}
      >
        <main className={`stage ${state === "done" ? "done" : ""}`}>
          {state !== "done" ? (
            <div className="text" style={{ fontSize: `${fontPx}px` }}>
              {visibleChars.map((c, i) => (
                <span
                  key={i}
                  className={
                    c.status === "correct"
                      ? "char ok"
                      : c.status === "wrong"
                      ? "char bad"
                      : "char"
                  }
                >
                  {c.ch === " " ? "\u00A0" : c.ch}
                  {i === caretInSlice ? <span className="caret" /> : null}
                </span>
              ))}
            </div>
          ) : (
            <div
              className="text text-scroll"
              style={{ fontSize: `${fontPx}px` }}
            >
              {fullChars!.map((c, i) => (
                <span
                  key={i}
                  className={
                    c.status === "correct"
                      ? "char ok"
                      : c.status === "wrong"
                      ? "char bad"
                      : "char"
                  }
                >
                  {c.ch === " " ? "\u00A0" : c.ch}
                </span>
              ))}
            </div>
          )}
        </main>

        {/* drag handle */}
        <div
          className="resize-handle"
          onMouseDown={onDragStart}
          role="separator"
          aria-label="Resize editor"
          aria-orientation="vertical"
          tabIndex={-1}
        />

        {/* focus hint */}
        {!hasFocus && !squelchHint && (
          <div className="focus-indicator" aria-hidden>
            Click to focus
          </div>
        )}
      </div>

      {/* Centered hint */}
      <div className="center-hint">
        {isMac ? "⌘" : "Ctrl"} + Return to restart
      </div>

      {/* Restart icon under hint */}
      <div className="center-actions">
        <button
          className="btn-icon"
          onMouseDown={() => setSquelchHint(true)}
          onTouchStart={() => setSquelchHint(true)}
          onClick={() => restart()}
          aria-label="Restart test"
          title="Restart (⌘/Ctrl + Return)"
        >
          ↻
        </button>
      </div>

      {state === "done" && (
        <footer className="results dim-on-focus">
          <div>
            Finished — <strong>{wpm} WPM</strong> (<strong>raw {rawWpm}</strong>
            ), <strong>{accuracy}%</strong> accuracy.
          </div>

          {!isSignedIn && (
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                color: "var(--muted)",
              }}
            >
              Log in to be displayed on the leaderboard!
            </div>
          )}
        </footer>
      )}

      {/* Bottom-left feedback link (fixed) */}
      <button
        className="feedback-link-fixed dim-on-focus"
        onClick={() => setShowFeedbackModal(true)}
        aria-label="Send feedback"
      >
        Send feedback
      </button>

      {/* Settings (fixed BR) */}
      <button
        className="settings-link-fixed dim-on-focus"
        onClick={() => setShowSettings((s) => !s)}
        aria-label="Open settings"
      >
        Settings
      </button>

      {showSettings && (
        <div className="settings-card dim-on-focus">
          <div className="settings-row">
            <label className="settings-label">Blocks</label>
            <input
              className="settings-input"
              type="number"
              min={1}
              max={10}
              value={blocks}
              onChange={(e) => {
                const v = Math.max(
                  1,
                  Math.min(10, Number(e.target.value) || 1)
                );
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

      {/* Minimal feedback modal */}
      {showFeedbackModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => {
            if (feedbackStatus !== "sending") setShowFeedbackModal(false);
          }}
        >
          <div
            className="settings-card"
            style={{
              position: "relative",
              maxWidth: 420,
              width: "90%",
              margin: "0 auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>
              How can we improve?
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "var(--muted)",
                marginBottom: 8,
              }}
            >
              Tell us what you liked, what felt off, or what you’d change.
            </p>

            <form
              onSubmit={handleSubmitFeedback}
              style={{ display: "grid", gap: 8 }}
            >
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={6}
                style={{
                  width: "100%",
                  height: 140,
                  resize: "none",
                  background: "transparent",
                  borderRadius: 8,
                  border: "1px solid #232a3a",
                  padding: 8,
                  color: "var(--fg)",
                }}
                placeholder="Type your feedback here…"
              />

              {feedbackError && (
                <div style={{ fontSize: 12, color: "#f66" }}>
                  {feedbackError}
                </div>
              )}

              {feedbackStatus === "sent" && (
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  Thanks — feedback sent.
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 4,
                }}
              >
                <button
                  type="button"
                  className="mini"
                  onClick={() => setShowFeedbackModal(false)}
                  disabled={feedbackStatus === "sending"}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mini"
                  disabled={
                    feedbackStatus === "sending" || !feedbackText.trim()
                  }
                >
                  {feedbackStatus === "sending" ? "Sending…" : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
