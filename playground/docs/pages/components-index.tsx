import { DocPage, H2, P } from "../components/doc-page";
import { TierBadge } from "../components/tier-badge";
import { componentDocs, docsByGroup, tiers } from "../registry";
import { Link } from "../router";

export function ComponentsIndex() {
  const counts = Object.fromEntries(tiers.map((t) => [t.id, componentDocs.filter((d) => d.tier === t.id).length]));

  return (
    <DocPage
      path="/docs/components"
      title="Components"
      description={`${componentDocs.length} components in two editions: ${counts.basic} Basic and ${counts.pro} Pro.`}
      toc={tiers.map((t) => ({ id: t.id, title: t.title }))}
    >
      {tiers.map((tier) => (
        <section key={tier.id}>
          <H2 id={tier.id}>{tier.title}</H2>
          <P className="mt-2">{tier.description}</P>
          {docsByGroup(tier.id).map(({ group, docs }) => (
            <div key={group} className="mt-8">
              <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">{group}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {docs.map((doc) => (
                  <Link
                    key={doc.slug}
                    to={`/docs/components/${doc.slug}`}
                    className="hover:bg-muted/50 hover:border-primary/40 rounded-lg border p-4 transition-colors"
                  >
                    <p className="flex items-center gap-2 font-medium">
                      {doc.title}
                      <TierBadge tier={doc.tier} />
                    </p>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{doc.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </DocPage>
  );
}
