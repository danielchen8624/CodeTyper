import { useState } from "react";
import { supabase } from "./lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    setLoading(false);
    if (error) setMsg(error.message);
    else window.location.hash = ""; // back to app
  }

  async function onReset() {
    setMsg(null);
    if (!email) {
      setMsg("Enter your email first, then click reset.");
      return;
    }
    // Sends an email link that creates a temporary session and redirects to /#/reset
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/reset`,
    });
    if (error) setMsg(error.message);
    else setMsg("Password reset email sent. Check your inbox.");
  }

  return (
    <div className="wrap" style={{ maxWidth: 420 }}>
      <h2 style={{ margin: "8px 0 16px" }}>Sign in</h2>
      <form onSubmit={onLogin} className="settings-card" style={{ position: "static" }}>
        <div className="settings-row">
          <label className="settings-label">Email</label>
          <input
            className="settings-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            required
            style={{ flex: 1 }}
          />
        </div>

        <div className="settings-row">
          <label className="settings-label">Password</label>
          <input
            className="settings-input"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            required
            style={{ flex: 1 }}
          />
        </div>

        {msg && (
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>
            {msg}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button className="mini" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <button className="mini" type="button" onClick={onReset} title="Email a reset link">
            Forgot password?
          </button>
        </div>
      </form>
    </div>
  );
}
