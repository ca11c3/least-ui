import { CodeBlock } from "../components/code-block";
import { ComponentPreview } from "../components/component-preview";
import { DocPage, H2, H3, P, RichText, type TocItem } from "../components/doc-page";
import { TierBadge } from "../components/tier-badge";
import { getExamples, tiers, type ComponentDoc } from "../registry";

// Pull the `import { ... } from "leastui"` statement out of the demo source,
// so the Usage section always matches what the example actually uses.
function getImport(code: string) {
  return code.match(/import\s*\{[^}]*\}\s*from\s*"leastui";/)?.[0] ?? "";
}

export function ComponentPage({ doc }: { doc: ComponentDoc }) {
  const [main, ...rest] = getExamples(doc);
  const exampleId = (name: string) => `example-${name}`;

  const toc: TocItem[] = [
    { id: "installation", title: "Installation" },
    { id: "usage", title: "Usage" },
    ...(rest.length
      ? [
          { id: "examples", title: "Examples" },
          ...rest.map((ex) => ({ id: exampleId(ex.name), title: ex.title, depth: 3 as const })),
        ]
      : []),
  ];

  return (
    <DocPage
      path={`/docs/components/${doc.slug}`}
      title={doc.title}
      description={doc.description}
      toc={toc}
      crumbs={[tiers.find((t) => t.id === doc.tier)!.title, doc.group]}
      badge={<TierBadge tier={doc.tier} className="text-xs" />}
    >
      <ComponentPreview example={main} />

      <H2>Installation</H2>
      <P>Every component ships in the one package.</P>
      <CodeBlock lang="bash" code="npm install leastui" className="mt-4" />

      <H2>Usage</H2>
      <CodeBlock code={getImport(main.code)} className="mt-4" />

      {rest.length > 0 && (
        <>
          <H2>Examples</H2>
          {rest.map((example) => (
            <section key={example.name}>
              <H3 id={exampleId(example.name)}>{example.title}</H3>
              {example.description && (
                <P className="mt-2">
                  <RichText text={example.description} />
                </P>
              )}
              <ComponentPreview example={example} className="mt-4" />
            </section>
          ))}
        </>
      )}
    </DocPage>
  );
}
