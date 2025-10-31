import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

function parseFragmentTokens() {
  // Handles "#/reset#access_token=...&refresh_token=...&type=recovery"
  const hash = window.location.hash || "";
  // take the part AFTER the second '#', if present
  const secondHashIdx = hash.indexOf("#", 1);
  const frag = secondHashIdx >= 0 ? hash.slice(secondHashIdx + 1) : hash.slice(1);
  const qs = new URLSearchParams(frag);
  const access_token = qs.get("access_token") || undefined;
  const refresh_token = qs.get("refresh_token") || undefined;
  const type = qs.get("type") || undefined;
  return { access_token, refresh_token, type };
}

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let unsub = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    }).data.subscription;

    (async () => {
      // 1) If tokens are in the fragment, set a session explicitly.
      const { access_token, refresh_token, type } = parseFragmentTokens();
      if (access_token && refresh_token && type === "recovery") {
        try {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!error) {
            setReady(true);
            // Clean URL to stable "#/reset" (optional nicety)
            window.history.replaceState({}, "", `${window.location.origin}/#/reset`);
            return;
          }
        } catch {
          // fall through to checks below
        }
      }

      // 2) Else if a session already exists, allow changing password.
      const { data } = await supabase.auth.getSession();
      if (data.session) setReady(true);
    })();

    return () => unsub?.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!ready) {
      setMsg("Open this page from the reset email link first.");
      return;
    }
    if (pw1.length < 6) {
      setMsg("Use at least 6 characters.");
      return;
    }
    if (pw1 !== pw2) {
      setMsg("Passwords don’t match.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setSaving(false);
    if (error) setMsg(error.message);
    else {
      setMsg("Password updated. You can now sign in.");
      setTimeout(() => (window.location.hash = "#/login"), 800);
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 420 }}>
      <h2 style={{ margin: "8px 0 16px" }}>Reset password</h2>
      <form onSubmit={onSubmit} className="settings-card" style={{ position: "static" }}>
        {!ready && (
          <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 10 }}>
            Waiting for recovery session… open this page from the reset email.
          </div>
        )}

        <div className="settings-row">
          <label className="settings-label">New password</label>
          <input
            className="settings-input"
            type="password"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            disabled={!ready}
            style={{ flex: 1 }}
          />
        </div>
        <div className="settings-row">
          <label className="settings-label">Confirm</label>
          <input
            className="settings-input"
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            disabled={!ready}
            style={{ flex: 1 }}
          />
        </div>

        {msg && (
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>
            {msg}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button className="mini" type="submit" disabled={!ready || saving}>
            {saving ? "Saving…" : "Set new password"}
          </button>
        </div>
      </form>
    </div>
  );
}
