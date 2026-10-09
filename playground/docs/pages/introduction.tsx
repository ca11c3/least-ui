import { Button } from "leastui";
import { DocPage, H2, InlineCode, P } from "../components/doc-page";
import { componentDocs } from "../registry";
import { Link } from "../router";

export function Introduction() {
  return (
    <DocPage
      path="/docs"
      title="Introduction"
      description="Accessible React components built on Radix UI and Tailwind CSS v4."
      toc={[
        { id: "what-is-leastui", title: "What is leastui?" },
        { id: "what-s-included", title: "What's included" },
        { id: "credits", title: "Credits" },
      ]}
    >
      <H2 id="what-is-leastui">What is leastui?</H2>
      <P>
        leastui is a set of {componentDocs.length} components for building dashboards and
        admin tools. It installs as a single npm package, styles with Tailwind CSS v4, and
        is themed entirely through CSS variables, so it fits into an existing design
        without overriding component code.
      </P>
      <P>
        Every component supports light and dark mode, keyboard navigation, and screen
        readers. Each module is marked <InlineCode>"use client"</InlineCode>, so it works
        directly in Next.js App Router pages.
      </P>

      <H2 id="what-s-included">What's included</H2>
      <ul className="text-foreground/85 mt-4 ml-6 list-disc space-y-2 leading-7">
        <li>
          <strong>Core components</strong>: buttons, dialogs, menus, tabs, tables and
          more.
        </li>
        <li>
          <strong>Form controls</strong>: number, currency and multi-value inputs,
          autocomplete with infinite loading, and file upload with preview.
        </li>
        <li>
          <strong>Date and time pickers</strong>: typed input with masks, calendars
          with month and year views, ranges with shortcuts, and a mobile sheet layout.
        </li>
      </ul>

      <H2>Credits</H2>
      <P>
        Many components start from{" "}
        <a className="text-primary underline underline-offset-4" href="https://ui.shadcn.com" target="_blank" rel="noreferrer">
          shadcn/ui
        </a>{" "}
        and are built on{" "}
        <a className="text-primary underline underline-offset-4" href="https://www.radix-ui.com" target="_blank" rel="noreferrer">
          Radix UI
        </a>{" "}
        primitives.
      </P>

      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link to="/docs/installation">Install leastui</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/docs/components">Browse components</Link>
        </Button>
      </div>
    </DocPage>
  );
}
