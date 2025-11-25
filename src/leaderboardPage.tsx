// LeaderboardPage.tsx
import { useEffect, useState } from "react";
import { fetchLeaderboard, type LeaderboardRow } from "./leaderboard";

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await fetchLeaderboard(50);
      setRows(data);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="wrap" style={{ maxWidth: 720 }}>
      <h2 style={{ margin: "8px 0 16px" }}>Leaderboard</h2>

      {loading ? (
        <div style={{ fontSize: 14, color: "var(--muted)" }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={{ fontSize: 14, color: "var(--muted)" }}>
          No scores yet. Finish a run while logged in to appear here.
        </div>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 14,
            marginTop: 8,
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "6px 4px" }}>#</th>
              <th style={{ textAlign: "left", padding: "6px 4px" }}>User</th>
              <th style={{ textAlign: "left", padding: "6px 4px" }}>Language</th>
              <th style={{ textAlign: "right", padding: "6px 4px" }}>
                Code / min
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.username}-${row.language}-${i}`}>
                <td style={{ padding: "4px" }}>{i + 1}</td>
                <td style={{ padding: "4px" }}>{row.username}</td>
                <td style={{ padding: "4px" }}>{row.language}</td>
                <td style={{ padding: "4px", textAlign: "right" }}>
                  {row.code_per_minute}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
