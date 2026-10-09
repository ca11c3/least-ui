import { useEffect, useState } from "react";
import { MenuIcon, MoonIcon, SearchIcon, SunIcon } from "lucide-react";
import {
  Button,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Sheet,
  SheetContent,
  SheetTrigger,
  cn,
  useSidebarStore,
} from "leastui";
import { componentDocs, guidePages, tiers } from "../registry";
import { TierBadge } from "./tier-badge";
import { Link, navigate } from "../router";
import { DocsNav } from "./docs-nav";

export const GITHUB_URL = "https://github.com/chaosatleast/least-ui";

function GithubIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2 0 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.1.9 2.3v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2 font-semibold", className)}>
      <svg viewBox="0 0 100 100" className="size-7" aria-hidden>
        <rect x="25" y="25" width="20" height="48" rx="10" fill="#7C3AED" />
        <rect x="25" y="55" width="45" height="20" rx="10" fill="#7C3AED" />
        <rect x="49" y="30" width="20" height="20" rx="999" className="fill-foreground" />
      </svg>
      leastui
    </Link>
  );
}

function SearchCommand() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="text-muted-foreground bg-muted/40 hover:bg-muted h-8 w-full justify-start border-[var(--color-border)] px-3 font-normal md:w-56 lg:w-64"
      >
        <SearchIcon />
        <span className="flex-1 text-left">Search docs...</span>
        <kbd className="bg-background hidden rounded border px-1.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search documentation">
        <CommandInput placeholder="Search components and guides..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Getting started">
            {guidePages.map((page) => (
              <CommandItem key={page.path} onSelect={() => go(page.path)}>
                {page.title}
              </CommandItem>
            ))}
          </CommandGroup>
          {tiers.map((tier) => (
            <CommandGroup key={tier.id} heading={`${tier.title} components`}>
              {componentDocs
                .filter((doc) => doc.tier === tier.id)
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((doc) => (
                  <CommandItem
                    key={doc.slug}
                    value={`${doc.title} ${doc.group} ${tier.title} ${doc.description}`}
                    onSelect={() => go(`/docs/components/${doc.slug}`)}
                  >
                    {doc.title}
                    <TierBadge tier={doc.tier} className="ml-auto" />
                  </CommandItem>
                ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}

function ThemeToggle() {
  const theme = useSidebarStore((s) => s.theme);
  const toggleTheme = useSidebarStore((s) => s.toggleTheme);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-foreground size-8"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}

function MobileNav({ path }: { path: string }) {
  const [open, setOpen] = useState(false);

  // Close the menu once a link has been followed.
  useEffect(() => setOpen(false), [path]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-foreground size-8 md:hidden" aria-label="Open menu">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" title="Navigation" className="w-72 overflow-y-auto p-6">
        <Logo className="mb-6" />
        <DocsNav path={path} />
      </SheetContent>
    </Sheet>
  );
}

export function SiteHeader({ path }: { path: string }) {
  const navLinks = [
    { to: "/docs", label: "Docs", active: path === "/docs" || path === "/docs/installation" || path === "/docs/theming" },
    { to: "/docs/components", label: "Components", active: path.startsWith("/docs/components") },
  ];

  return (
    <header className="bg-background/90 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-4 px-4 md:px-8">
        <MobileNav path={path} />
        <Logo className="hidden md:flex" />
        <nav className="hidden items-center gap-5 text-sm md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "hover:text-foreground transition-colors",
                link.active ? "text-foreground font-medium" : "text-muted-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex flex-1 items-center justify-end gap-1 md:flex-none">
          <div className="mr-1 flex-1 md:flex-none">
            <SearchCommand />
          </div>
          <Button asChild variant="ghost" size="icon" className="text-foreground size-8">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub">
              <GithubIcon className="size-4" />
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
