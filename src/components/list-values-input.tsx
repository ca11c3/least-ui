"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { pluralize } from "../lib/utils";
import { validateValue, type ValueRule } from "../lib/value-rules";
import { Button } from "./button";
import { FileUpload } from "./file-upload";
import { MultiInput } from "./input";
import Spinner from "./spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

type ListValuesTab = "paste" | "csv";

export interface ListValuesInputProps {
  /** The list, in form mode (no `onCommit`). */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (values: string[]) => void;

  /**
   * Commit mode: values are staged, then sent here by an "Add" button and
   * cleared once it resolves. Throw (or reject) to keep them for a retry.
   * Uploaded files are parsed and sent here too, unless `onUploadFile` is set.
   */
  onCommit?: (values: string[]) => void | Promise<void>;
  /**
   * Sends the raw file instead of client-parsed values, e.g. to a server-side
   * importer. With `filePreview`, the file is still parsed locally first so the
   * user can check it.
   */
  onUploadFile?: (file: File) => void | Promise<void>;
  /** Disables the commit buttons and shows a spinner, e.g. while a mutation runs. */
  busy?: boolean;

  /** Every value must pass all of these; see `valueRules`. Applies to typed, pasted and uploaded values. */
  rules?: readonly ValueRule[];
  /** Regex (without anchors) every value must match. Shorthand for one rule. */
  pattern?: string;
  /** Applied before validation, e.g. `(v) => v.toLowerCase()`. Values are always trimmed. */
  normalize?: (value: string) => string;
  /** Values that already exist elsewhere (e.g. saved on the server); they're rejected as duplicates. */
  existing?: readonly string[];
  /** Most values the list may hold (in commit mode, per batch). */
  maxValues?: number;
  maxLength?: number;

  /** Which tab opens first. */
  defaultTab?: ListValuesTab;
  placeholder?: string;
  disabled?: boolean;

  /**
   * File types to accept, as for `<input accept>`. Built-in parsing reads
   * .csv, .tsv and .txt (one value per line); other types need `parseFile` or
   * `onUploadFile`.
   */
  accept?: string;
  /** Whether a CSV/TSV's first row is a header and should be skipped. */
  csvHasHeader?: boolean;
  /** Zero-based CSV/TSV column to read values from. */
  csvColumn?: number;
  /** Replaces the built-in file parser. Its values still go through `rules`. */
  parseFile?: (file: File) => Promise<{ values: string[]; error?: string }>;
  /** Show parsed values for review before uploading. Defaults to true. */
  filePreview?: boolean;
  /** Form mode: "merge" adds uploaded values to the list; "replace" swaps the list for them. */
  csvMode?: "merge" | "replace";
  maxBytes?: number;

  pasteLabel?: React.ReactNode;
  csvLabel?: React.ReactNode;
  csvHint?: React.ReactNode;
  /** Label of the commit button; receives the number of staged values. */
  commitLabel?: (count: number) => React.ReactNode;
  /** Replace a tab's built-in content entirely. */
  pasteContent?: React.ReactNode;
  csvContent?: React.ReactNode;
  className?: string;
}

const PARSEABLE = ["csv", "tsv", "txt"];

function extensionOf(name: string) {
  return name.toLowerCase().split(".").pop() ?? "";
}

/** Extensions in an accept string, e.g. ".csv,text/csv" → ["csv"]. */
function acceptedExtensions(accept: string) {
  return accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.startsWith("."))
    .map((s) => s.slice(1));
}

// Splits one delimited line, honouring double-quoted fields ("a, b" and "" escapes).
function splitDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells;
}

/** Raw cells from a .csv, .tsv or .txt file, or null for a type it can't read. */
async function readFileCells(file: File, hasHeader: boolean, column: number) {
  const ext = extensionOf(file.name);
  if (!PARSEABLE.includes(ext)) return null;
  const rows = (await file.text()).replace(/^﻿/, "").split(/\r?\n/);
  if (ext === "txt") return rows;
  const delimiter = ext === "tsv" ? "\t" : ",";
  return (hasHeader ? rows.slice(1) : rows).map((row) => splitDelimitedLine(row, delimiter)[column] ?? "");
}

function ListValuesInput({
  value,
  defaultValue,
  onValueChange,
  onCommit,
  onUploadFile,
  busy = false,
  rules,
  pattern,
  normalize,
  existing,
  maxValues,
  maxLength,
  defaultTab = "paste",
  placeholder = "Type a value and press Enter",
  disabled,
  accept = ".csv,text/csv",
  csvHasHeader = true,
  csvColumn = 0,
  parseFile,
  filePreview = true,
  csvMode = "merge",
  maxBytes,
  pasteLabel = "Multiple Input",
  csvLabel,
  csvHint,
  commitLabel = (count) => (count ? `Add ${count} ${pluralize("value", count)}` : "Add values"),
  pasteContent,
  csvContent,
  className,
}: ListValuesInputProps) {
  const isCommitMode = onCommit !== undefined;
  const [tab, setTab] = React.useState<string>(defaultTab);
  const [internalValues, setInternalValues] = React.useState<string[]>(defaultValue ?? []);
  const [committing, setCommitting] = React.useState(false);
  // In commit mode the input holds a staged batch, never the caller's list.
  const values = isCommitMode ? internalValues : (value ?? internalValues);
  const isBusy = busy || committing;

  const setValues = (next: string[]) => {
    if (isCommitMode || value === undefined) setInternalValues(next);
    if (!isCommitMode) onValueChange?.(next);
  };

  const allRules = React.useMemo(
    () => (pattern ? [{ test: pattern, message: "Invalid format." }, ...(rules ?? [])] : (rules ?? [])),
    [pattern, rules],
  );
  const existingSet = React.useMemo(() => new Set(existing), [existing]);
  const checkExisting = (v: string) => (existingSet.has(v) ? "Already exists." : null);

  const extensions = acceptedExtensions(accept);
  const fileKind = extensions.length === 1 ? extensions[0].toUpperCase() : "file";
  const canParseLocally = !!parseFile || extensions.length === 0 || extensions.some((e) => PARSEABLE.includes(e));

  /** Parses a file and keeps only values that pass the rules, reporting the rest. */
  const parseUpload = async (file: File) => {
    let cells: string[];
    if (parseFile) {
      const result = await parseFile(file);
      if (result.error) return result;
      cells = result.values;
    } else {
      const read = await readFileCells(file, csvHasHeader, csvColumn);
      if (read === null) {
        return { values: [], error: `.${extensionOf(file.name)} files can't be read here.` };
      }
      cells = read;
    }

    const cleaned = cells
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => (normalize ? normalize(c).trim() : c));
    if (cleaned.length === 0) return { values: [], error: "The file has no values." };

    const accepted: string[] = [];
    const seen = new Set(isCommitMode || csvMode === "merge" ? values : []);
    const invalid: { value: string; message: string }[] = [];
    let duplicates = 0;
    for (const cell of cleaned) {
      if (seen.has(cell) || existingSet.has(cell)) {
        duplicates++;
        continue;
      }
      const message = validateValue(cell, allRules);
      if (message) {
        invalid.push({ value: cell, message });
        continue;
      }
      seen.add(cell);
      accepted.push(cell);
    }

    const limit = maxValues === undefined ? undefined : maxValues - (csvMode === "replace" && !isCommitMode ? 0 : values.length);
    const overLimit = limit !== undefined && accepted.length > limit ? accepted.length - Math.max(limit, 0) : 0;
    const kept = overLimit ? accepted.slice(0, Math.max(limit!, 0)) : accepted;

    if (kept.length === 0) {
      return {
        values: [],
        error: invalid.length
          ? `No valid values in the file. ${invalid[0].message} (e.g. "${invalid[0].value}")`
          : "Every value in the file is already in the list.",
      };
    }
    const skipped = [
      invalid.length && `${invalid.length} invalid (${invalid[0].message.replace(/\.$/, "")}, e.g. "${invalid[0].value}")`,
      duplicates && `${duplicates} ${pluralize("duplicate", duplicates)}`,
      overLimit && `${overLimit} over the ${maxValues}-value limit`,
    ].filter(Boolean);
    if (skipped.length) toast.warning(`Skipped ${skipped.join(", ")}.`);
    return { values: kept };
  };

  const commit = async (batch: string[]) => {
    setCommitting(true);
    try {
      await onCommit!(batch);
      return true;
    } catch {
      // The caller reports the error; keep the batch so it can be retried.
      return false;
    } finally {
      setCommitting(false);
    }
  };

  const handleFile = async (file: File, parsed: string[]) => {
    if (onUploadFile) {
      // Rethrow so FileUpload keeps the file for a retry.
      await onUploadFile(file);
      return;
    }
    if (isCommitMode) {
      if (!(await commit(parsed))) throw new Error("commit failed");
      return;
    }
    setValues(csvMode === "replace" ? parsed : Array.from(new Set([...values, ...parsed])));
    // Show the result where it can be reviewed and edited.
    setTab("paste");
  };

  // Without a preview, values still need parsing before they can be committed or merged.
  const uploadWithoutPreview = async (file: File) => {
    const { values: parsed, error } = await parseUpload(file);
    if (error) {
      toast.error(error);
      throw new Error(error);
    }
    await handleFile(file, parsed);
  };

  const showPreview = filePreview && canParseLocally;

  return (
    <Tabs value={tab} onValueChange={setTab} className={className}>
      <TabsList>
        <TabsTrigger value="paste" disabled={disabled}>
          {pasteLabel}
        </TabsTrigger>
        <TabsTrigger value="csv" disabled={disabled}>
          {csvLabel ?? `Upload ${fileKind}`}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="paste" className="flex flex-col gap-3 pt-3">
        {pasteContent ?? (
          <>
            <MultiInput
              value={values}
              onValueChange={setValues}
              placeholder={placeholder}
              rules={allRules}
              validate={checkExisting}
              normalize={normalize}
              maxValues={maxValues}
              maxLength={maxLength}
              disabled={disabled || isBusy}
            />
            {isCommitMode && (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  size="sm"
                  disabled={disabled || isBusy || values.length === 0}
                  onClick={async () => {
                    if (await commit(values)) setInternalValues([]);
                  }}
                >
                  {isBusy ? <Spinner className="size-3.5" /> : <PlusIcon />}
                  {commitLabel(values.length)}
                </Button>
                <p className="text-muted-foreground text-xs">
                  Press Enter after each value, or paste a list.
                </p>
              </div>
            )}
          </>
        )}
      </TabsContent>
      <TabsContent value="csv" className="pt-3">
        {csvContent ?? (
          <FileUpload
            accept={accept}
            maxBytes={maxBytes}
            isBusy={isBusy}
            parseFile={showPreview ? parseUpload : undefined}
            hint={
              csvHint ??
              (extensions.length === 0
                ? "Drop a file, or click to browse."
                : `Drop a ${extensions.map((e) => `.${e}`).join(" / ")} file with one value per row${
                    csvHasHeader && extensions.some((e) => e === "csv" || e === "tsv")
                      ? " (the first row is a header)"
                      : ""
                  }, or click to browse.`)
            }
            onUploadFile={(file, parsed) =>
              showPreview ? handleFile(file, parsed) : onUploadFile ? onUploadFile(file) : uploadWithoutPreview(file)
            }
          />
        )}
      </TabsContent>
    </Tabs>
  );
}

export { ListValuesInput };
