import { CodeBlock } from "../components/code-block";
import { DocPage, H2, InlineCode, P } from "../components/doc-page";

const tokens = [
  { name: "background", fg: "foreground" },
  { name: "card", fg: "card-foreground" },
  { name: "popover", fg: "popover-foreground" },
  { name: "primary", fg: "primary-foreground" },
  { name: "secondary", fg: "secondary-foreground" },
  { name: "muted", fg: "muted-foreground" },
  { name: "accent", fg: "accent-foreground" },
  { name: "destructive", fg: "background" },
  { name: "success", fg: "success-foreground" },
  { name: "warning", fg: "warning-foreground" },
  { name: "info", fg: "info-foreground" },
  { name: "pending", fg: "pending-foreground" },
  { name: "border", fg: "foreground" },
  { name: "input", fg: "foreground" },
  { name: "ring", fg: "foreground" },
  { name: "sidebar", fg: "sidebar-foreground" },
];

export function Theming() {
  return (
    <DocPage
      path="/docs/theming"
      title="Theming"
      description="Every colour, radius and shadow is a CSS variable you can override."
      toc={[
        { id: "colour-tokens", title: "Colour tokens" },
        { id: "customising", title: "Customising" },
        { id: "per-component-colour", title: "Per-component colour" },
      ]}
    >
      <H2 id="colour-tokens">Colour tokens</H2>
      <P>
        Tokens come in pairs: a background and the foreground that sits on it. Toggle the
        theme in the header to see the dark values.
      </P>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tokens.map((token) => (
          <div key={token.name} className="overflow-hidden rounded-lg border">
            <div
              className="flex h-16 items-end p-2 text-xs font-medium"
              style={{ background: `var(--${token.name})`, color: `var(--${token.fg})` }}
            >
              Aa
            </div>
            <p className="px-2 py-1.5 font-mono text-xs">--{token.name}</p>
          </div>
        ))}
      </div>

      <H2>Customising</H2>
      <P>
        Override any token after importing the theme. Set the light value on{" "}
        <InlineCode>:root</InlineCode> and the dark one on <InlineCode>.dark</InlineCode>.
      </P>
      <CodeBlock
        lang="css"
        className="mt-4"
        code={`@import "tailwindcss";
@import "leastui/styles.css";

:root {
  --primary: rgb(5 150 105);
  --ring: rgb(52 211 153);
  --radius: 0.375rem;
}

.dark {
  --primary: rgb(16 185 129);
}`}
      />

      <H2 id="per-component-colour">Per-component colour</H2>
      <P>
        <InlineCode>Button</InlineCode> and <InlineCode>Badge</InlineCode> take a{" "}
        <InlineCode>color</InlineCode> prop that recolours one instance without
        touching the theme.
      </P>
      <CodeBlock
        className="mt-4"
        code={`<Button color="rgb(234 88 12)">Orange</Button>
<Badge variant="secondary" color="rgb(13 148 136)">Teal</Badge>`}
      />
    </DocPage>
  );
}
