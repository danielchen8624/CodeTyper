// src/Router.tsx
import { useEffect, useSyncExternalStore, useState } from "react";
import App from "./App";
import Login from "./Login";
import { supabase } from "./lib/supabaseClient";

function useHash() {
  return useSyncExternalStore(
    (cb) => { addEventListener("hashchange", cb); return () => removeEventListener("hashchange", cb); },
    () => location.hash || "#/",
    () => "#/"
  );
}
export default function Router() {
  const hash = useHash();
  const [sessionReady, setReady] = useState(false);
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!sessionReady) return null;

  if (hash.startsWith("#/login")) return <Login />;
  return <App isSignedIn={!!session} />;
}
