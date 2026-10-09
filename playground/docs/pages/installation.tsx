import { CodeBlock } from "../components/code-block";
import { DocPage, H2, InlineCode, P } from "../components/doc-page";

export function Installation() {
  return (
    <DocPage
      path="/docs/installation"
      title="Installation"
      description="Add leastui to a React project that uses Tailwind CSS v4."
      toc={[
        { id: "install-the-package", title: "Install the package" },
        { id: "import-the-styles", title: "Import the styles" },
        { id: "use-a-component", title: "Use a component" },
        { id: "dark-mode", title: "Dark mode" },
      ]}
    >
      <H2>Install the package</H2>
      <P>
        leastui needs React 18 or 19 and Tailwind CSS v4. Radix UI, lucide icons and
        the other dependencies install with it.
      </P>
      <CodeBlock lang="bash" code="npm install leastui" className="mt-4" />

      <H2>Import the styles</H2>
      <P>
        Add the theme to your global stylesheet, after Tailwind. It defines the colour
        tokens and animations, and tells Tailwind to scan the package for the classes
        the components use.
      </P>
      <CodeBlock
        lang="css"
        className="mt-4"
        code={`@import "tailwindcss";\n@import "leastui/styles.css";`}
      />

      <H2>Use a component</H2>
      <P>
        Import from the package root, or from a single component path such as{" "}
        <InlineCode>leastui/button</InlineCode>.
      </P>
      <CodeBlock
        className="mt-4"
        code={`import { Button } from "leastui";

export default function Page() {
  return <Button>Click me</Button>;
}`}
      />

      <H2>Dark mode</H2>
      <P>
        Dark styles apply under a <InlineCode>.dark</InlineCode> class on an ancestor,
        usually <InlineCode>{"<html>"}</InlineCode>. The bundled{" "}
        <InlineCode>useSidebarStore</InlineCode> can manage it for you: it remembers the
        choice and follows the system setting on the first visit.
      </P>
      <CodeBlock
        className="mt-4"
        code={`import { Button, useSidebarStore } from "leastui";

export function ThemeToggle() {
  const toggleTheme = useSidebarStore((s) => s.toggleTheme);
  return <Button variant="outline" onClick={toggleTheme}>Toggle theme</Button>;
}`}
      />
    </DocPage>
  );
}
