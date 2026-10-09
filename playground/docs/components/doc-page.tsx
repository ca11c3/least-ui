import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { Button, cn } from "leastui";
import { allPages } from "../registry";
import { Link } from "../router";

export type TocItem = { id: string; title: string; depth?: 2 | 3 };

export function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Hash routing owns the URL fragment, so in-page links scroll instead of navigating.
function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function H2({ children, id }: { children: string; id?: string }) {
  return (
    <h2
      id={id ?? slugify(children)}
      className="mt-12 scroll-mt-20 border-b pb-2 text-xl font-semibold tracking-tight first:mt-0"
    >
      {children}
    </h2>
  );
}

export function H3({ children, id }: { children: string; id?: string }) {
  return (
    <h3 id={id ?? slugify(children)} className="mt-8 scroll-mt-20 text-lg font-semibold tracking-tight">
      {children}
    </h3>
  );
}

export function P({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-foreground/85 mt-4 leading-7", className)} {...props} />;
}

export function InlineCode(props: React.ComponentProps<"code">) {
  return <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-[0.85em]" {...props} />;
}

// Renders `backticks` in plain description strings as inline code.
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith("`") ? <InlineCode key={i}>{part.slice(1, -1)}</InlineCode> : part,
      )}
    </>
  );
}

function Toc({ items }: { items: TocItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="sticky top-20 hidden h-[calc(100vh-6rem)] overflow-y-auto text-sm xl:block">
      <p className="mb-3 font-medium">On this page</p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className={item.depth === 3 ? "pl-3" : undefined}>
            <button
              type="button"
              onClick={() => scrollToId(item.id)}
              className="text-muted-foreground hover:text-foreground text-left transition-colors"
            >
              {item.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Pager({ path }: { path: string }) {
  const index = allPages.findIndex((page) => page.path === path);
  if (index === -1) return null;
  const prev = allPages[index - 1];
  const next = allPages[index + 1];

  return (
    <div className="mt-16 flex items-center justify-between gap-4 border-t pt-6">
      {prev ? (
        <Button asChild variant="ghost" className="text-foreground">
          <Link to={prev.path}>
            <ArrowLeftIcon />
            {prev.title}
          </Link>
        </Button>
      ) : (
        <span />
      )}
      {next && (
        <Button asChild variant="ghost" className="text-foreground">
          <Link to={next.path}>
            {next.title}
            <ArrowRightIcon />
          </Link>
        </Button>
      )}
    </div>
  );
}

export function DocPage({
  path,
  title,
  description,
  toc = [],
  crumbs = [],
  badge,
  children,
}: {
  path: string;
  title: string;
  description: string;
  toc?: TocItem[];
  /** Breadcrumb steps between "Docs" and the title, e.g. ["Pro", "Charts"]. */
  crumbs?: string[];
  /** Shown beside the title, e.g. the component's edition. */
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_200px] xl:gap-10">
      <article className="min-w-0 py-8 lg:py-10">
        <p className="text-muted-foreground mb-2 text-sm">
          Docs <span className="mx-1">/</span>
          {crumbs.map((crumb) => (
            <span key={crumb}>
              {crumb} <span className="mx-1">/</span>
            </span>
          ))}
          <span className="text-foreground">{title}</span>
        </p>
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
          {title}
          {badge}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          <RichText text={description} />
        </p>
        <div className="mt-8">{children}</div>
        <Pager path={path} />
      </article>
      <aside className="py-10">
        <Toc items={toc} />
      </aside>
    </div>
  );
}
