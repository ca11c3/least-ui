import { useEffect, useState, type ComponentProps } from "react";

// Hash-based routing: the built site is static, so it works on any host
// (including GitHub Pages) without server rewrites.
function readPath() {
  return window.location.hash.replace(/^#/, "") || "/";
}

export function usePath() {
  const [path, setPath] = useState(readPath);

  useEffect(() => {
    const onChange = () => {
      setPath(readPath());
      // "instant" overrides the CSS smooth scrolling, which is meant for in-page links only.
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return path;
}

export function navigate(to: string) {
  window.location.hash = to;
}

export function Link({ to, ...props }: ComponentProps<"a"> & { to: string }) {
  return <a href={`#${to}`} {...props} />;
}
