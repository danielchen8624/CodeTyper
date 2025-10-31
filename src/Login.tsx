// Login.tsx
import { useEffect } from "react";
import "./styles.css";

export default function Login() {
  useEffect(() => {
    // keep background interactions silent on this page
    document.title = "Sign in";
  }, []);

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-title">Sign in</div>
        <div className="login-sub">Practice smarter with saved stats.</div>

        <button className="login-btn">
          <span className="login-ico">G</span>
          Continue with Google
        </button>

        <button className="login-btn ghost">
          <span className="login-ico"></span>
          Continue with Apple
        </button>

        <div className="login-foot">
          <a href="#/" className="login-link">Back</a>
        </div>
      </div>
    </div>
  );
}
