// Profile.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabaseClient";

type Run = {
  id: string;
  tsStart: number;
  tsEnd: number;
  durationMs: number;
  lang: string;
  concept: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
};

const fmtDur = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
};

// load runs for this user from Supabase
function useRuns(userId: string | null) {
  const [runs, setRuns] = useState<Run[]>([]);

  useEffect(() => {
    if (!userId) {
      setRuns([]);
      return;
    }

    let cancelled = false;

    const fetchRuns = async () => {
      const { data, error } = await supabase
        .from("runs")
        .select("*") // <- no fragile column list
        .eq("user_id", userId)
        .order("created_at", { ascending: false }) // <- use created_at if you have it
        .limit(200);

      if (error) {
        console.error("Error loading runs:", error.message, error.details);
        if (!cancelled) setRuns([]);
        return;
      }

      if (cancelled || !data) return;

      const mapped: Run[] = (data as any[]).map((row) => {
        // try to pull times from whatever you have
        const tsStart = row.ts_start
          ? new Date(row.ts_start).getTime()
          : row.created_at
          ? new Date(row.created_at).getTime()
          : 0;

        const tsEnd = row.ts_end ? new Date(row.ts_end).getTime() : tsStart;

        const durationMs =
          row.duration_ms ?? (tsEnd && tsStart ? tsEnd - tsStart : 0);

        return {
          id: row.id,
          tsStart,
          tsEnd,
          durationMs,
          lang: row.lang,
          concept: row.concept,
          wpm: row.wpm,
          rawWpm: row.raw_wpm,
          accuracy: row.accuracy,
        };
      });

      setRuns(mapped);
    };

    fetchRuns();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return runs;
}

type PieDatum = { key: string; value: number };

function Donut({
  data,
  title,
  size = 180,
}: {
  data: PieDatum[];
  title: string;
  size?: number;
}) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const r = size / 2;
  const inner = r * 0.6;
  let a0 = -Math.PI / 2;

  const slices = data
    .filter((d) => d.value > 0)
    .map((d, i) => {
      const a1 = a0 + (d.value / total) * Math.PI * 2;
      const x0 = r + r * Math.cos(a0),
        y0 = r + r * Math.sin(a0);
      const x1 = r + r * Math.cos(a1),
        y1 = r + r * Math.sin(a1);
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const path = `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${r} ${r} Z`;
      a0 = a1;
      return { path, key: d.key, value: d.value, i };
    });

  return (
    <div style={{ display: "grid", placeItems: "center", gap: 8 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={r} cy={r} r={r} fill="#131826" />
        {slices.map((s, i) => (
          <path
            key={s.key}
            d={s.path}
            fill={`hsl(${(i * 47) % 360} 30% 55%)`}
            opacity={0.9}
          />
        ))}
        <circle cx={r} cy={r} r={inner} fill="#0e121a" />
        <text
          x={r}
          y={r + 4}
          fontSize="14"
          textAnchor="middle"
          fill="var(--fg)"
          style={{ opacity: 0.85 }}
        >
          {total}
        </text>
      </svg>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{title}</div>
      <div
        style={{ display: "grid", gap: 4, fontSize: 12, color: "var(--muted)" }}
      >
        {data
          .filter((d) => d.value > 0)
          .sort((a, b) => b.value - a.value)
          .slice(0, 6)
          .map((d, i) => (
            <div
              key={d.key}
              style={{ display: "flex", gap: 8, alignItems: "center" }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: `hsl(${(i * 47) % 360} 30% 55%)`,
                  display: "inline-block",
                }}
              />
              <span style={{ color: "var(--fg)" }}>{d.key}</span>
              <span>— {d.value}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function Profile({
  onBack,
  userLabel = "You",
  userId,
}: {
  onBack: () => void;
  userLabel?: string;
  userId: string | null;
}) {
  const runs = useRuns(userId);

  const stats = useMemo(() => {
    const started = runs.length;
    const completed = runs.length;
    const timeMs = runs.reduce((a, r) => a + r.durationMs, 0);
    const bestWpm = runs.reduce((a, r) => Math.max(a, r.rawWpm), 0);
    const avgWpm =
      runs.length === 0
        ? 0
        : Math.round(runs.reduce((a, r) => a + r.rawWpm, 0) / runs.length);

    const avgAcc =
      runs.length === 0
        ? 0
        : Math.round(runs.reduce((a, r) => a + r.accuracy, 0) / runs.length);

    const byLang = new Map<string, number>();
    const byMode = new Map<string, number>();
    for (const r of runs) {
      byLang.set(r.lang, (byLang.get(r.lang) || 0) + 1);
      byMode.set(r.concept, (byMode.get(r.concept) || 0) + 1);
    }

    const langData = Array.from(byLang, ([key, value]) => ({ key, value }));
    const modeData = Array.from(byMode, ([key, value]) => ({ key, value }));

    const recent = [...runs].sort((a, b) => b.tsEnd - a.tsEnd).slice(0, 8);

    return {
      started,
      completed,
      timeMs,
      bestWpm,
      avgWpm,
      avgAcc,
      langData,
      modeData,
      recent,
    };
  }, [runs]);

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Sign out error:", e);
    } finally {
      window.location.hash = "#/login";
    }
  }

  return (
    <div className="wrap" style={{ gap: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          justifyContent: "space-between",
        }}
      >
        <button className="mini" onClick={onBack} aria-label="Back">
          ← Back
        </button>
        <div style={{ opacity: 0.6, fontSize: 12 }}>Profile</div>
      </div>

      {/* Header card */}
      <div
        style={{
          background: "#0e121a",
          border: "1px solid #1a2130",
          borderRadius: 16,
          padding: 16,
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#151b29",
            display: "grid",
            placeItems: "center",
            color: "var(--fg)",
            fontWeight: 700,
          }}
        >
          {userLabel.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{userLabel}</div>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>
            tests started <b style={{ color: "var(--fg)" }}>{stats.started}</b>{" "}
            · tests completed{" "}
            <b style={{ color: "var(--fg)" }}>{stats.completed}</b> · time
            typing <b style={{ color: "var(--fg)" }}>{fmtDur(stats.timeMs)}</b>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridAutoFlow: "column",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div className="stat">
            <strong>Best</strong> {stats.bestWpm} WPM
          </div>
          <div className="stat">
            <strong>Avg</strong> {stats.avgWpm} WPM
          </div>
          <div className="stat">
            <strong>Acc</strong> {stats.avgAcc}%
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <div
          style={{
            background: "#0e121a",
            border: "1px solid #1a2130",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <Donut title="Languages (tests)" data={stats.langData} />
        </div>

        <div
          style={{
            background: "#0e121a",
            border: "1px solid #1a2130",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <Donut title="Modes (tests)" data={stats.modeData} />
        </div>
      </div>

      {/* Recent results */}
      <div
        style={{
          background: "#0e121a",
          border: "1px solid #1a2130",
          borderRadius: 16,
          padding: 12,
        }}
      >
        <div
          style={{ color: "var(--muted)", fontSize: 12, margin: "0 4px 6px" }}
        >
          recent results
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto auto auto",
            gap: 8,
            padding: 6,
            fontSize: 14,
          }}
        >
          {stats.recent.length === 0 ? (
            <div style={{ color: "var(--muted)", padding: 8 }}>
              No results yet.
            </div>
          ) : (
            stats.recent.map((r) => (
              <div key={r.id} style={{ display: "contents" }}>
                <div style={{ color: "var(--muted)" }}>
                  {new Date(r.tsEnd).toLocaleDateString()}
                </div>
                <div style={{ color: "var(--fg)" }}>
                  {r.lang} · {r.concept}
                </div>
                <div className="stat">
                  <strong>WPM</strong> {r.wpm}
                </div>
                <div className="stat">
                  <strong>RAW</strong> {r.rawWpm}
                </div>
                <div className="stat">
                  <strong>ACC</strong> {r.accuracy}%
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Nonchalant centered sign out */}
      <div
        style={{
          textAlign: "center",
          fontSize: 12,
          opacity: 0.7,
          marginTop: 10,
        }}
      >
        <button
          onClick={handleSignOut}
          style={{
            background: "none",
            border: "none",
            color: "var(--fg)",
            cursor: "pointer",
            padding: 6,
          }}
          aria-label="Sign out"
          title="Sign out"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
