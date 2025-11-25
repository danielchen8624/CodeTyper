import { useState } from "react";
import { supabase } from "./lib/supabaseClient";

type Mode = "login" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [username, setUsername] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      if (mode === "login") {
        // LOGIN
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });
        if (error) throw error;
        window.location.hash = ""; // back to main
      } else {
        // SIGNUP
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
        });
        if (error) throw error;

        const user = data.user;
        if (!user) throw new Error("No user returned from sign up.");

        // 🔥 INSERT INTO public.users, not profiles
        const { error: userError } = await supabase.from("users").insert({
          id: user.id,
          email: user.email,
          username,
        });

        if (userError) throw userError;

        setMsg("Check your email to confirm your account.");
      }
    } catch (err: any) {
      setMsg(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const isSignup = mode === "signup";

  return (
    <div className="wrap" style={{ maxWidth: 420 }}>
      <h2 style={{ margin: "8px 0 16px" }}>
        {isSignup ? "Sign up" : "Log in"}
      </h2>

      <form
        onSubmit={onSubmit}
        className="settings-card"
        style={{ position: "static" }}
      >
        <div className="settings-row">
          <label className="settings-label">Email</label>
          <input
            className="settings-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ flex: 1 }}
          />
        </div>

        {isSignup && (
          <div className="settings-row">
            <label className="settings-label">Username</label>
            <input
              className="settings-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ flex: 1 }}
            />
          </div>
        )}

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
            {loading
              ? isSignup
                ? "Signing up…"
                : "Logging in…"
              : isSignup
              ? "Sign up"
              : "Log in"}
          </button>

          <button
            className="mini"
            type="button"
            onClick={() => {
              setMode((m) => (m === "login" ? "signup" : "login"));
              setMsg(null);
            }}
          >
            {isSignup ? "Have an account? Log in" : "New here? Sign up"}
          </button>
        </div>
      </form>
    </div>
  );
}
