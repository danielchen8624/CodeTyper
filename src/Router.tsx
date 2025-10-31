// Router.tsx
import { useEffect, useSyncExternalStore } from "react";
import App from "./App";
import Login from "./Login";

function useHash() {
  return useSyncExternalStore(
    (cb) => { window.addEventListener("hashchange", cb); return () => window.removeEventListener("hashchange", cb); },
    () => window.location.hash || "#/",
    () => "#/"
  );
}

export default function Router() {
  const hash = useHash();
  useEffect(() => {
    // default route
    if (!hash) window.location.hash = "#/";
  }, [hash]);

  if (hash.startsWith("#/login")) return <Login />;
  return <App />;
}
