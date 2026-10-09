import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/*.tsx", "src/datetime/*-picker.tsx", "src/datetime/*-rangepicker.tsx"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  // Optional peer: only the node editor and the sequence editor's flow view need it.
  external: ["react", "react-dom", "@xyflow/react"],
  // Every module is interactive UI; keep it usable from React Server Components.
  banner: { js: '"use client";' },
});
