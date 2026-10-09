import type { ComponentType } from "react";

type ExampleMeta = { name: string; title?: string; description?: string };

// Editions, modelled on MUI (free core) and MUI X (advanced, paid). Each
// edition lists its groups in nav order.
export const tiers = [
  {
    id: "basic",
    title: "Basic",
    description: "The building blocks every app needs: inputs, overlays, navigation, feedback and layout.",
    groups: ["Inputs", "Date & Time", "Data Display", "Feedback", "Overlays", "Navigation", "Layout"],
  },
  {
    id: "pro",
    title: "Pro",
    description: "Advanced components for data-heavy apps: data grids, charts, range pickers, scheduling and node-based editors.",
    groups: ["Data Grid", "Charts", "Date & Time Pro", "Scheduling", "Diagrams", "Advanced Inputs"],
  },
] as const;

export type Tier = (typeof tiers)[number]["id"];
type TierDef = (typeof tiers)[number];
export type ComponentGroup = TierDef["groups"][number];

// A group must belong to its tier, so a Basic component can't be filed under a Pro group.
type Placement = { [T in TierDef as T["id"]]: { tier: T["id"]; group: T["groups"][number] } }[Tier];

export type ComponentDoc = Placement & {
  slug: string;
  title: string;
  description: string;
  // The first example is the page's hero preview; the rest are listed under "Examples".
  examples: ExampleMeta[];
};

export type Example = Required<Pick<ExampleMeta, "name" | "title">> & {
  description?: string;
  Component: ComponentType;
  code: string;
};

const modules = import.meta.glob<ComponentType>("../examples/*/*.tsx", {
  eager: true,
  import: "default",
});
const sources = import.meta.glob<string>("../examples/*/*.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
});

export const componentDocs: ComponentDoc[] = [
  {
    slug: "alert",
    title: "Alert",
    description: "Displays a callout for user attention, in five tones.",
    tier: "basic",
    group: "Feedback",
    examples: [{ name: "demo" }, { name: "variants" }],
  },
  {
    slug: "alert-dialog",
    title: "Alert Dialog",
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
    tier: "basic",
    group: "Overlays",
    examples: [{ name: "demo" }, { name: "small", title: "Small with media" }],
  },
  {
    slug: "autocomplete",
    title: "Autocomplete",
    description:
      "A searchable select with single or multiple selection and infinite loading.",
    tier: "basic",
    group: "Inputs",
    examples: [{ name: "demo" }, { name: "multiple" }],
  },
  {
    slug: "badge",
    title: "Badge",
    description: "Displays a badge or a component that looks like a badge.",
    tier: "basic",
    group: "Data Display",
    examples: [
      { name: "demo" },
      {
        name: "custom-color",
        title: "Custom color",
        description: "Pass any CSS colour to `color` to tint a badge.",
      },
    ],
  },
  {
    slug: "breadcrumb",
    title: "Breadcrumb",
    description: "Displays the path to the current resource using a hierarchy of links.",
    tier: "basic",
    group: "Navigation",
    examples: [{ name: "demo" }],
  },
  {
    slug: "button",
    title: "Button",
    description: "Displays a button with a ripple, in seven variants and five sizes.",
    tier: "basic",
    group: "Inputs",
    examples: [
      { name: "demo" },
      { name: "variants" },
      { name: "sizes" },
      { name: "with-icon", title: "With icon" },
      { name: "loading" },
      {
        name: "custom-color",
        title: "Custom color",
        description: "Pass any CSS colour to `color` to recolour a variant.",
      },
    ],
  },
  {
    slug: "calendar",
    title: "Calendar",
    description:
      "A date field component with month and year views and optional time selection.",
    tier: "basic",
    group: "Date & Time",
    examples: [{ name: "demo" }],
  },
  {
    slug: "card",
    title: "Card",
    description: "Displays a card with header, content, and footer.",
    tier: "basic",
    group: "Layout",
    examples: [{ name: "demo" }],
  },
  {
    slug: "chart",
    title: "Chart",
    description:
      "Line, area, bar, pie, radar and radial charts, plus stat tiles, meters and sparklines, drawn in SVG with no chart library. Every chart has a table view, a legend you can toggle, and keyboard-readable values.",
    tier: "pro",
    group: "Charts",
    examples: [
      {
        name: "demo",
        description:
          "Stat tiles above a stacked area chart. Hover or focus the plot and use the arrow keys to read every series at a date; switch to the table view for the same numbers without hovering.",
      },
      {
        name: "line",
        title: "Line chart",
        description:
          "Lines are labelled at their ends when the labels have room, and fall back to the legend when they'd collide. Click a legend entry to hide it; double-click to isolate it.",
      },
      { name: "bar", title: "Grouped bars", description: "Bars stay thin, with a 2px gap between neighbours. The whole column is the hover target." },
      { name: "stacked", title: "Stacked bars", description: "`stacked` with `showValues` prints the total at each bar's tip." },
      {
        name: "horizontal",
        title: "Horizontal, highlighted",
        description: "`highlight` greys every bar but the ones the story is about.",
      },
      {
        name: "pie",
        title: "Pie / donut",
        description:
          "The list beside the ring is the legend and the direct labels at once. Hover a slice or a row and the centre shows it; past `maxSlices` (6) the smallest fold into \"Other\". Set `donut={false}` for a full pie.",
      },
      {
        name: "radar",
        title: "Radar",
        description: "Hover anywhere near a spoke to read every series on it. Keep it to three series or fewer.",
      },
      {
        name: "radial",
        title: "Radial and gauge",
        description: "Rings are labelled at their start; each track is a lighter step of its ring's colour. `sweep={180}` makes a gauge.",
      },
      {
        name: "figures",
        title: "Stat tile, meter, sparkline",
        description:
          "Deltas carry an arrow and know which direction is good. Meters change fill at thresholds and name the state, so colour never carries it alone.",
      },
    ],
  },
  {
    slug: "checkbox",
    title: "Checkbox",
    description: "A control that allows the user to toggle between checked and not checked.",
    tier: "basic",
    group: "Inputs",
    examples: [{ name: "demo" }],
  },
  {
    slug: "collapsible",
    title: "Collapsible",
    description: "An interactive component which expands and collapses a panel.",
    tier: "basic",
    group: "Layout",
    examples: [{ name: "demo" }],
  },
  {
    slug: "command",
    title: "Command",
    description: "Fast, composable command menu for search and actions.",
    tier: "basic",
    group: "Navigation",
    examples: [{ name: "demo" }],
  },
  {
    slug: "context-menu",
    title: "Context Menu",
    description: "Displays a menu at the pointer, triggered by a right click.",
    tier: "basic",
    group: "Overlays",
    examples: [{ name: "demo" }],
  },
  {
    slug: "data-table",
    title: "Data Table",
    description:
      "A TanStack Table grid with sorting, resizable columns, selection, and paged or infinite loading.",
    tier: "pro",
    group: "Data Grid",
    examples: [
      {
        name: "demo",
        description:
          "Click a header arrow to sort, drag a column edge to resize, and hover an invoice number to copy it.",
      },
      {
        name: "selection",
        title: "Row selection",
        description: "Selected rows get a toolbar with Clear and Delete. Rows can opt out of selection.",
      },
    ],
  },
  {
    slug: "date-picker",
    title: "Date Picker",
    description: "A typed date input with a calendar popover (a sheet on mobile).",
    tier: "basic",
    group: "Date & Time",
    examples: [{ name: "demo" }, { name: "formats", title: "Custom format" }],
  },
  {
    slug: "date-range-picker",
    title: "Date Range Picker",
    description: "Pick a start and end date, with quick-select shortcuts.",
    tier: "pro",
    group: "Date & Time Pro",
    examples: [{ name: "demo" }, { name: "no-shortcuts", title: "Without shortcuts" }],
  },
  {
    slug: "datetime-picker",
    title: "Date Time Picker",
    description: "Pick a date and a time in a single field.",
    tier: "basic",
    group: "Date & Time",
    examples: [{ name: "demo" }],
  },
  {
    slug: "datetime-range-picker",
    title: "Date Time Range Picker",
    description: "Pick a start and end date with times.",
    tier: "pro",
    group: "Date & Time Pro",
    examples: [{ name: "demo" }],
  },
  {
    slug: "dialog",
    title: "Dialog",
    description: "A window overlaid on the primary window, rendering the content underneath inert.",
    tier: "basic",
    group: "Overlays",
    examples: [{ name: "demo" }],
  },
  {
    slug: "dropdown-menu",
    title: "Dropdown Menu",
    description: "Displays a menu of actions or options, triggered by a button.",
    tier: "basic",
    group: "Overlays",
    examples: [{ name: "demo" }],
  },
  {
    slug: "event-calendar",
    title: "Event Calendar",
    description:
      "A month calendar of events, with multi-day bars, start times, and a \"+N more\" overflow.",
    tier: "pro",
    group: "Scheduling",
    examples: [
      {
        name: "demo",
        description:
          "Colour events by category and filter them yourself; the calendar draws whatever you pass in `events`.",
      },
    ],
  },
  {
    slug: "extra-info-hint",
    title: "Extra Info Hint",
    description: "A small help icon that reveals extra information on hover.",
    tier: "basic",
    group: "Data Display",
    examples: [{ name: "demo" }],
  },
  {
    slug: "field",
    title: "Field",
    description: "Combine labels, controls, and help text into accessible form fields.",
    tier: "basic",
    group: "Inputs",
    examples: [{ name: "demo" }, { name: "horizontal" }],
  },
  {
    slug: "file-upload",
    title: "File Upload",
    description: "A drop zone with type and size validation and an optional preview step.",
    tier: "basic",
    group: "Inputs",
    examples: [{ name: "demo" }, { name: "csv-preview", title: "CSV with preview" }],
  },
  {
    slug: "input",
    title: "Input",
    description: "Text, number, currency, and multi-value inputs.",
    tier: "basic",
    group: "Inputs",
    examples: [
      { name: "demo" },
      {
        name: "prefix",
        title: "With prefix",
        description: "The prefix is fixed but stays part of the reported value.",
      },
      { name: "number", title: "Number input" },
      {
        name: "currency",
        title: "Currency input",
        description: "Bank-style entry: digits fill from the right and the value is in minor units.",
      },
      {
        name: "multi",
        title: "Multi input",
        description: "Type and press Enter to add values as badges.",
      },
    ],
  },
  {
    slug: "input-group",
    title: "Input Group",
    description: "Add icons, text, or buttons to the start or end of an input.",
    tier: "basic",
    group: "Inputs",
    examples: [{ name: "demo" }],
  },
  {
    slug: "label",
    title: "Label",
    description: "Renders an accessible label associated with controls.",
    tier: "basic",
    group: "Inputs",
    examples: [{ name: "demo" }],
  },
  {
    slug: "linear-progress",
    title: "Linear Progress",
    description: "An indeterminate or determinate progress bar.",
    tier: "basic",
    group: "Feedback",
    examples: [{ name: "demo" }, { name: "determinate" }],
  },
  {
    slug: "list-values-input",
    title: "List Values Input",
    description:
      "Collect a list of values by typing, pasting, or uploading a file, checked against validation rules.",
    tier: "pro",
    group: "Advanced Inputs",
    examples: [
      {
        name: "demo",
        description:
          "Uploaded values are checked against `pattern`, de-duplicated, and merged into the list, then the Multiple Input tab opens so they can be reviewed.",
      },
      {
        name: "csv-options",
        title: "CSV options",
        description:
          "Read a different column with `csvColumn`, replace the list instead of merging with `csvMode`, and relabel the tabs.",
      },
      {
        name: "rules",
        title: "Validation rules",
        description:
          "Combine `valueRules` presets: every rule must pass (AND), and `anyOf` passes when one does (OR). Rejected values stay in the box with the reason; pasted lists are split and checked one by one.",
      },
      {
        name: "commit-mode",
        title: "Commit mode",
        description:
          "With `onCommit`, values are staged and saved by an Add button, then cleared once it resolves. `onUploadFile` sends the raw file after a local preview, `existing` blocks duplicates of saved values, and `accept` sets the file types (CSV by default).",
      },
    ],
  },
  {
    slug: "menubar",
    title: "Menubar",
    description: "A persistent menu, common in desktop applications.",
    tier: "basic",
    group: "Navigation",
    examples: [{ name: "demo" }],
  },
  {
    slug: "navigation-menu",
    title: "Navigation Menu",
    description: "A collection of links for navigating websites.",
    tier: "basic",
    group: "Navigation",
    examples: [{ name: "demo" }],
  },
  {
    slug: "node-editor",
    title: "Node Editor",
    description:
      "A node-based editor built on xyflow, where you decide what each node shows. Connect, drag, delete, undo and tidy up; the content is yours. To test a flow with sample input, see Simulator.",
    tier: "pro",
    group: "Diagrams",
    examples: [
      {
        name: "demo",
        title: "Basic",
        description:
          "No setup: every node is a card titled by `data.label`. Drag nodes, connect handles, press Delete to remove a selection, ⌘Z / ⇧⌘Z to undo and redo.",
      },
      {
        name: "custom-content",
        title: "Your own content",
        description:
          "Give each type a `render` function: it gets the node's `data` and `update`, and returns whatever the node should show, here fields that edit the node. `outputs: [\"Yes\", \"No\"]` adds named branches, and `frame: \"none\"` drops the card entirely, as for the sticky note. Controls inside a card don't drag it; drag by the title.",
      },
      {
        name: "read-only",
        title: "Read-only, left to right",
        description: "`readOnly` hides the palette and locks the canvas. `layeredLayout` positions a graph you build in code.",
      },
    ],
  },
  {
    slug: "pagination",
    title: "Pagination",
    description: "Pagination with page navigation, next and previous links.",
    tier: "basic",
    group: "Navigation",
    examples: [{ name: "demo" }],
  },
  {
    slug: "popover",
    title: "Popover",
    description: "Displays rich content in a portal, triggered by a button.",
    tier: "basic",
    group: "Overlays",
    examples: [{ name: "demo" }],
  },
  {
    slug: "scheduler",
    title: "Scheduler",
    description:
      "A full event scheduler with day, week, month and agenda views, drag-and-drop, resizing, recurring events, resources and an event editor.",
    tier: "pro",
    group: "Scheduling",
    examples: [
      {
        name: "demo",
        description:
          "Double-click an empty slot to create an event, click one to edit it, and drag or pull its edges to move or resize it.",
      },
      {
        name: "resources",
        description:
          "Assign events to resources. Each resource has a colour and a toggle in the side panel.",
      },
      {
        name: "recurring",
        title: "Recurring events",
        description:
          "Repeat an event with an RFC 5545 `rrule`: FREQ, INTERVAL, COUNT, UNTIL, BYDAY (including `-1FR`) and BYMONTHDAY.",
      },
      {
        name: "read-only",
        title: "Edit permissions",
        description:
          "Per-event `readOnly`, `draggable` and `resizable`, with single-click creation, 24-hour times and only the day and week views.",
      },
    ],
  },
  {
    slug: "search-form",
    title: "Search Form",
    description: "A search input with an icon and a clear button.",
    tier: "basic",
    group: "Inputs",
    examples: [{ name: "demo" }],
  },
  {
    slug: "select",
    title: "Select",
    description: "Displays a list of options for the user to pick from, triggered by a button.",
    tier: "basic",
    group: "Inputs",
    examples: [{ name: "demo" }],
  },
  {
    slug: "separator",
    title: "Separator",
    description: "Visually or semantically separates content.",
    tier: "basic",
    group: "Layout",
    examples: [{ name: "demo" }],
  },
  {
    slug: "sequence-editor",
    title: "Sequence Editor",
    description:
      "Pick items from a searchable panel and arrange them into an ordered sequence, by drag-and-drop or buttons. To test a sequence with a sample input, see Simulator.",
    tier: "pro",
    group: "Advanced Inputs",
    examples: [
      {
        name: "demo",
        description:
          "Drag a card into the sequence or press +, then drag rows or use the arrows to reorder. `renderItem` customises the panel cards; the panel resizes and collapses, and the editor can go full screen.",
      },
      {
        name: "flow",
        title: "Flow view",
        description:
          "The same order as a diagram, drawn with the Node Editor's canvas; `renderStep` content shows in both views. Draw an edge to re-rank (Start → step makes it first), drag a step up or down, or drop a card between two steps. Needs the optional `@xyflow/react` peer; it loads only when the view opens.",
      },
      {
        name: "read-only",
        title: "Read-only",
        description:
          "A collapsible view of the sequence. With `getItemHref`, each step links to its item; pass `linkComponent` to use your router's link.",
      },
    ],
  },
  {
    slug: "sheet",
    title: "Sheet",
    description: "A panel that slides in from any edge of the screen.",
    tier: "basic",
    group: "Overlays",
    examples: [{ name: "demo" }, { name: "sides" }],
  },
  {
    slug: "sidebar",
    title: "Sidebar",
    description: "A composable, collapsible application sidebar.",
    tier: "basic",
    group: "Navigation",
    examples: [{ name: "demo" }],
  },
  {
    slug: "simulator",
    title: "Simulator",
    description:
      "Run a test input through a rule sequence or node flow and watch the path it takes: each step's result on the canvas, step-through playback, and the final decision.",
    tier: "pro",
    group: "Diagrams",
    examples: [
      {
        name: "sequence",
        title: "Risk rules",
        description:
          "`simulateSequence` runs each rule in order until one stops it; pass the trace to the editor's `simulation` and the node flow lights up the path from Start to the deciding rule (the List view shows the same results). Change the test transaction and run again, or step through with ⟲ and ▶. Editing the sequence clears the stale run.",
      },
      {
        name: "graph",
        title: "Node flow",
        description:
          "Give node types an `evaluate(data, input)` and run `simulateGraph`: visited nodes show why they branched, the path taken glows, the rest fades.",
      },
      {
        name: "backend",
        title: "From your API (recommended)",
        description:
          "For production, let the real rule engine decide: call your dry-run endpoint and map its response to a trace with a few lines (`toTrace` here). The UI then shows exactly what production would do. Open \"API response\" to see the raw JSON next to the drawing.",
      },
    ],
  },
  {
    slug: "skeleton",
    title: "Skeleton",
    description: "Use to show a placeholder while content is loading.",
    tier: "basic",
    group: "Feedback",
    examples: [{ name: "demo" }],
  },
  {
    slug: "sonner",
    title: "Toast",
    description: "Opinionated toast notifications, powered by Sonner.",
    tier: "basic",
    group: "Feedback",
    examples: [{ name: "demo" }],
  },
  {
    slug: "spinner",
    title: "Spinner",
    description: "An animated loading indicator.",
    tier: "basic",
    group: "Feedback",
    examples: [{ name: "demo" }],
  },
  {
    slug: "switch",
    title: "Switch",
    description: "A control that allows the user to toggle between on and off.",
    tier: "basic",
    group: "Inputs",
    examples: [{ name: "demo" }],
  },
  {
    slug: "table",
    title: "Table",
    description: "A responsive table that casts shadows as its content scrolls.",
    tier: "basic",
    group: "Data Display",
    examples: [{ name: "demo" }],
  },
  {
    slug: "table-card",
    title: "Table Card",
    description:
      "A data table in a card, with status tabs, a filter panel, and an actions menu.",
    tier: "pro",
    group: "Data Grid",
    examples: [
      {
        name: "demo",
        description:
          "Filters fold open under the toolbar and apply on submit; the badge counts active filters.",
      },
      {
        name: "actions",
        title: "Actions menu",
        description:
          "Pass `actions` to add the ⋮ menu to the toolbar. Items take an icon, can be disabled, and can be marked `variant: \"destructive\"`.",
      },
    ],
  },
  {
    slug: "table-filters",
    title: "Table Filters",
    description:
      "A filter button with an active-count badge, and a fold-out panel of typed filter fields.",
    tier: "pro",
    group: "Data Grid",
    examples: [
      {
        name: "demo",
        description:
          "Each field type in one panel, including a full-width list of values. Values apply on submit; Cancel restores the last applied values.",
      },
    ],
  },
  {
    slug: "table-grid",
    title: "Table Grid",
    description: "A CSS-grid table with a sticky header and adjustable row density.",
    tier: "basic",
    group: "Data Display",
    examples: [{ name: "demo" }, { name: "density" }],
  },
  {
    slug: "tabs",
    title: "Tabs",
    description: "Layered sections of content, displayed one at a time.",
    tier: "basic",
    group: "Navigation",
    examples: [{ name: "demo" }, { name: "line", title: "Line variant" }],
  },
  {
    slug: "textarea",
    title: "Textarea",
    description: "Displays a multi-line text input.",
    tier: "basic",
    group: "Inputs",
    examples: [{ name: "demo" }],
  },
  {
    slug: "time-picker",
    title: "Time Picker",
    description: "A typed time input with a scrollable time grid.",
    tier: "basic",
    group: "Date & Time",
    examples: [{ name: "demo" }],
  },
  {
    slug: "timeline",
    title: "Timeline",
    description: "A vertical list of events with markers, times, and connecting lines.",
    tier: "basic",
    group: "Data Display",
    examples: [
      { name: "demo" },
      {
        name: "with-icons",
        title: "With icons",
        description: "Pass an icon to `TimelineIndicator` and any CSS colour to `color` on the item.",
      },
    ],
  },
  {
    slug: "tooltip",
    title: "Tooltip",
    description: "A popup that displays information related to an element on hover or focus.",
    tier: "basic",
    group: "Data Display",
    examples: [{ name: "demo" }],
  },
];

function titleFromName(name: string) {
  const words = name.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function getExamples(doc: ComponentDoc): Example[] {
  return doc.examples.map((meta) => {
    const path = `../examples/${doc.slug}/${meta.name}.tsx`;
    const Component = modules[path];
    if (!Component) throw new Error(`Missing example file: ${path}`);
    return {
      name: meta.name,
      title: meta.title ?? titleFromName(meta.name),
      description: meta.description,
      Component,
      code: sources[path],
    };
  });
}

export function getDoc(slug: string) {
  return componentDocs.find((doc) => doc.slug === slug);
}

// Sidebar and search order: guides first, then components alphabetically.
export const guidePages = [
  { path: "/docs", title: "Introduction" },
  { path: "/docs/installation", title: "Installation" },
  { path: "/docs/theming", title: "Theming" },
  { path: "/docs/components", title: "All components" },
];

/** Components of one tier, grouped in nav order and sorted by title. */
export function docsByGroup(tier: Tier) {
  const { groups } = tiers.find((t) => t.id === tier)!;
  return groups.map((group) => ({
    group,
    docs: componentDocs
      .filter((doc) => doc.tier === tier && doc.group === group)
      .sort((a, b) => a.title.localeCompare(b.title)),
  }));
}

// Pager order follows the sidebar: guides, then Basic, then Pro.
export const allPages = [
  ...guidePages,
  ...tiers.flatMap((tier) =>
    docsByGroup(tier.id).flatMap(({ docs }) =>
      docs.map((doc) => ({ path: `/docs/components/${doc.slug}`, title: doc.title })),
    ),
  ),
];
