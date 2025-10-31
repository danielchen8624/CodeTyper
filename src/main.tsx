// main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Login from "./Login";
import ResetPassword from "./ResetPassword";
import Profile from "./Profile";
import { supabase } from "./lib/supabaseClient";
import Header from "./Header";              
import "./styles.css";

function Router() {
  const [hash, setHash] = React.useState<string>(window.location.hash);
  const [isSignedIn, setIsSignedIn] = React.useState<boolean>(false);
  const [userLabel, setUserLabel] = React.useState<string | undefined>();
  const [booted, setBooted] = React.useState<boolean>(false);

  React.useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const session = data.session;
      setIsSignedIn(!!session);
      setUserLabel(session?.user?.email ?? session?.user?.user_metadata?.name);
      setBooted(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsSignedIn(!!session);
      setUserLabel(session?.user?.email ?? session?.user?.user_metadata?.name);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!booted) return null;

  let page: React.ReactNode = <App isSignedIn={isSignedIn} />;
  if (hash === "#/login") page = <Login />;
  else if (hash === "#/reset") page = <ResetPassword />;
  else if (hash === "#/profile") {
    page = isSignedIn ? (
      <Profile onBack={() => (window.location.hash = "")} userLabel={userLabel} />
    ) : (
      <Login />
    );
  }

  return (
    <>
      <Header />     {/* ← always visible brand */}
      {page}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
