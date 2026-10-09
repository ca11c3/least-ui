import { Toaster } from "leastui";
import { DocsNav } from "./components/docs-nav";
import { SiteHeader } from "./components/site-header";
import { ComponentPage } from "./pages/component-page";
import { ComponentsIndex } from "./pages/components-index";
import { Home } from "./pages/home";
import { Installation } from "./pages/installation";
import { Introduction } from "./pages/introduction";
import { NotFound } from "./pages/not-found";
import { Theming } from "./pages/theming";
import { getDoc } from "./registry";
import { usePath } from "./router";

function DocsRoute({ path }: { path: string }) {
  if (path === "/docs") return <Introduction />;
  if (path === "/docs/installation") return <Installation />;
  if (path === "/docs/theming") return <Theming />;
  if (path === "/docs/components") return <ComponentsIndex />;

  const doc = getDoc(path.replace("/docs/components/", ""));
  return doc ? <ComponentPage key={doc.slug} doc={doc} /> : <NotFound />;
}

export default function App() {
  const path = usePath();
  const isDocs = path.startsWith("/docs");

  return (
    <div className="bg-background isolate min-h-svh">
      <div aria-hidden className="site-backdrop" />
      <SiteHeader path={path} />
      {isDocs ? (
        <div className="mx-auto grid max-w-screen-2xl px-4 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 md:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
          <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] overflow-y-auto border-r py-8 pr-4 md:block">
            <DocsNav path={path} />
          </aside>
          <main className="min-w-0">
            <DocsRoute path={path} />
          </main>
        </div>
      ) : path === "/" ? (
        <Home />
      ) : (
        <NotFound />
      )}
      <Toaster />
    </div>
  );
}
