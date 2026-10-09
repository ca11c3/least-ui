import { cn } from "leastui";
import { docsByGroup, guidePages, tiers } from "../registry";
import { Link } from "../router";
import { TierBadge } from "./tier-badge";

function NavLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-muted text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
      )}
    >
      {children}
    </Link>
  );
}

function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <h5 className="text-muted-foreground/80 mb-1 px-2 text-xs font-medium tracking-wide uppercase">{children}</h5>
  );
}

export function DocsNav({ path }: { path: string }) {
  return (
    <nav className="flex flex-col gap-8 text-sm">
      <div>
        <GroupHeading>Getting started</GroupHeading>
        {guidePages.map((page) => (
          <NavLink key={page.path} to={page.path} active={path === page.path}>
            {page.title}
          </NavLink>
        ))}
      </div>

      {/* One section per edition, like MUI (core) and MUI X (advanced). */}
      {tiers.map((tier) => (
        <section key={tier.id} aria-labelledby={`nav-tier-${tier.id}`} className="flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b px-2 pb-2">
            <h4 id={`nav-tier-${tier.id}`} className="text-foreground text-sm font-semibold">
              {tier.title}
            </h4>
            <TierBadge tier={tier.id} />
          </div>
          {docsByGroup(tier.id).map(({ group, docs }) => (
            <div key={group}>
              <GroupHeading>{group}</GroupHeading>
              {docs.map((doc) => {
                const to = `/docs/components/${doc.slug}`;
                return (
                  <NavLink key={doc.slug} to={to} active={path === to}>
                    {doc.title}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </section>
      ))}
    </nav>
  );
}
