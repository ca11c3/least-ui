# leastui

React UI components for Tailwind CSS v4, built on Radix UI.

## Install

```bash
npm install leastui
```

Requires `react` 18 or 19 and `tailwindcss` v4.

## Setup

Import the theme in your global CSS, after Tailwind:

```css
@import "tailwindcss";
@import "leastui/styles.css";
```

The stylesheet defines the theme tokens (`--primary`, `--background`, …),
light/dark colours and animations, and tells Tailwind to scan the package for
the classes the components use. Override any token in your own `:root` /
`.dark` rules.

Dark mode follows a `.dark` class on an ancestor (usually `<html>`).

## Usage

```tsx
import { Button, Card, DatePicker } from "leastui";

// or import a single component
import { Button } from "leastui/button";
```

Every module ships with `"use client"`, so components can be used directly
from Next.js App Router server components.

### Sidebar and theme state

`Sidebar` and `Toaster` read shared state from `useSidebarStore` (zustand).
It also handles the light/dark theme: it persists the choice to
`localStorage` and a `theme` cookie, and toggles `.dark` on `<html>`.

```tsx
import { useSidebarStore } from "leastui";

const toggleTheme = useSidebarStore((s) => s.toggleTheme);
```

## Development

```bash
npm install
npm run dev          # docs site at http://localhost:5173, hot-reloads src/
npm run typecheck
npm run build        # library to dist/
npm run build:site   # static docs site to site/
npm publish          # runs the build first
```

The docs live in `playground/`. Each component page lists its examples in
`playground/docs/registry.ts`, and each example is a file in
`playground/examples/<component>/`. The Code tab shows that file's source.

## Credits

Many components start from [shadcn/ui](https://ui.shadcn.com) and are built on
[Radix UI](https://www.radix-ui.com) primitives. leastui extends them with
date/time pickers, file upload, autocomplete, a grid table and its own theme.

## License

MIT. See [LICENSE](./LICENSE), which also carries the shadcn/ui notice.
