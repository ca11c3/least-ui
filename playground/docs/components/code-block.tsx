import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button, cn } from "leastui";
import type { HighlighterCore } from "shiki/core";

type Lang = "tsx" | "bash" | "css";

let highlighter: Promise<HighlighterCore> | undefined;

// Load only the languages and themes the docs use, once, on first render.
function getHighlighter() {
  highlighter ??= Promise.all([
    import("shiki/core"),
    import("shiki/engine/javascript"),
  ]).then(([{ createHighlighterCore }, { createJavaScriptRegexEngine }]) =>
    createHighlighterCore({
      themes: [
        import("shiki/themes/github-light.mjs"),
        import("shiki/themes/github-dark.mjs"),
      ],
      langs: [
        import("shiki/langs/tsx.mjs"),
        import("shiki/langs/bash.mjs"),
        import("shiki/langs/css.mjs"),
      ],
      engine: createJavaScriptRegexEngine(),
    }),
  );
  return highlighter;
}

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-7 text-muted-foreground", className)}
      aria-label={copied ? "Copied" : "Copy code"}
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  );
}

export function CodeBlock({
  code,
  lang = "tsx",
  className,
}: {
  code: string;
  lang?: Lang;
  className?: string;
}) {
  const source = code.trim();
  const [html, setHtml] = useState<string>();

  useEffect(() => {
    let active = true;
    getHighlighter().then((hl) => {
      if (!active) return;
      setHtml(
        hl.codeToHtml(source, {
          lang,
          themes: { light: "github-light", dark: "github-dark" },
        }),
      );
    });
    return () => {
      active = false;
    };
  }, [source, lang]);

  return (
    <div
      className={cn(
        "group bg-muted/40 relative overflow-hidden rounded-lg border",
        className,
      )}
    >
      <CopyButton value={source} className="absolute top-2 right-2 z-10" />
      <div className="max-h-[480px] overflow-auto p-4 pr-12 font-mono text-[13px] leading-6">
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre>
            <code>{source}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
