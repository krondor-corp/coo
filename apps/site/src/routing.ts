import { useEffect, useState } from "react";

export type Route =
  | { page: "home" }
  | { page: "docs"; slug: string; anchor?: string };

function parseHash(hash: string): Route {
  const match = hash.match(/^#\/docs\/([\w-]+)(#.*)?$/);
  if (match) {
    const [, slug, anchor] = match;
    return { page: "docs", slug, anchor: anchor?.slice(1) };
  }
  if (hash === "#/docs" || hash === "#/docs/") {
    return { page: "docs", slug: "install" };
  }
  return { page: "home" };
}

export function useHashRoute(): Route {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return parseHash(hash);
}
