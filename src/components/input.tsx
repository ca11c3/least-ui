import * as React from "react";
import { ChevronDown, ChevronUp, Delete, XIcon } from "lucide-react";
import { Badge } from "./badge";
import { cn, pluralize } from "../lib/utils";
import { validateValue, type ValueRule } from "../lib/value-rules";
import { Button } from "./button";

const inputBaseClass =
  "dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent transition-[color,box-shadow] hover:shadow-md aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive";

const inputControlClass =
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground h-9 px-3 py-1 text-base outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

// Input renders an optional fixed `prefix` (e.g. "https://") inside the field.
// The prefix is not editable, but it stays part of the reported value so
// validation and submitted data see the complete string. An empty field
// reports "" rather than a bare prefix, so optional fields stay empty.
function Input({
  className,
  type,
  prefix,
  value,
  onChange,
  disabled,
  ...props
}: React.ComponentProps<"input">) {
  if (!prefix) {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(inputBaseClass, inputControlClass, className)}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
    );
  }

  const full = value == null ? "" : String(value);
  // A value stored with a different scheme (e.g. "http://") is left intact and
  // shown in full, so the affix never doubles up on what is already there.
  const hasPrefix = full === "" || full.startsWith(prefix);
  const display = hasPrefix ? full.slice(prefix.length) : full;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typed = e.target.value;
    const next = !hasPrefix || typed === "" ? typed : `${prefix}${typed}`;
    onChange?.({
      ...e,
      target: { ...e.target, name: e.target.name, value: next },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div
      data-slot="input"
      className={cn(
        inputBaseClass,
        "focus-within-ring flex h-9 items-center",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      onClick={(e) => e.currentTarget.querySelector("input")?.focus()}
    >
      {hasPrefix && (
        <span className="border-input bg-muted/50 text-muted-foreground flex h-full shrink-0 items-center rounded-l-md border-r px-3 text-sm font-medium select-none">
          {prefix}
        </span>
      )}
      <input
        type={type}
        className={cn(
          inputControlClass,
          "h-full w-full min-w-0 flex-1 rounded-r-md border-0 bg-transparent shadow-none",
        )}
        value={display}
        onChange={handleChange}
        disabled={disabled}
        {...props}
      />
    </div>
  );
}

export interface MultiInputProps {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  maxLength?: number;
  /** Regex (without anchors) every value must match. Shorthand for one rule. */
  pattern?: string;
  /** Every value must pass all of these; see `valueRules`. */
  rules?: readonly ValueRule[];
  /** Extra check run after `rules`; return a message to reject the value. */
  validate?: (value: string) => string | null | undefined;
  /** Applied before validation, e.g. `(v) => v.toLowerCase()`. Values are always trimmed. */
  normalize?: (value: string) => string;
  /** Most values the list may hold. */
  maxValues?: number;
  /**
   * Pasted text containing these separators is split into several values.
   * Defaults to new lines, tabs, commas and semicolons; null pastes as typed.
   */
  pasteSeparator?: RegExp | null;
}

const DEFAULT_PASTE_SEPARATOR = /[\r\n\t,;]+/;

/**
 * Checks candidates against the list and the rules. Returns the values to add
 * and a message describing anything that was rejected.
 */
function collectValues(
  candidates: string[],
  current: string[],
  check: (value: string) => string | null,
  maxValues: number | undefined,
) {
  const added: string[] = [];
  const seen = new Set(current);
  let duplicates = 0;
  let overLimit = 0;
  const invalid: { value: string; message: string }[] = [];

  for (const value of candidates) {
    if (!value) continue;
    if (seen.has(value)) {
      duplicates++;
      continue;
    }
    const message = check(value);
    if (message) {
      invalid.push({ value, message });
      continue;
    }
    if (maxValues !== undefined && current.length + added.length >= maxValues) {
      overLimit++;
      continue;
    }
    seen.add(value);
    added.push(value);
  }

  // One candidate: say exactly what was wrong with it.
  if (candidates.filter(Boolean).length === 1) {
    if (invalid.length) return { added, error: invalid[0].message };
    if (duplicates) return { added, error: "Already in the list." };
    if (overLimit) return { added, error: `You can add up to ${maxValues} ${pluralize("value", maxValues!)}.` };
    return { added, error: null };
  }

  const problems = [
    invalid.length &&
      `${invalid.length} invalid (${invalid[0].message.replace(/\.$/, "")}${invalid.length === 1 ? `: "${invalid[0].value}"` : `, e.g. "${invalid[0].value}"`})`,
    duplicates && `${duplicates} ${pluralize("duplicate", duplicates)}`,
    overLimit && `${overLimit} over the ${maxValues}-value limit`,
  ].filter(Boolean);
  return {
    added,
    error: problems.length
      ? `Added ${added.length} ${pluralize("value", added.length)}; skipped ${problems.join(", ")}.`
      : null,
  };
}

function MultiInput({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Type and press Enter...",
  disabled,
  readOnly,
  className,
  maxLength,
  pattern,
  rules,
  validate,
  normalize,
  maxValues,
  pasteSeparator = DEFAULT_PASTE_SEPARATOR,
}: MultiInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const errorId = React.useId();
  const [inputText, setInputText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [internalValues, setInternalValues] = React.useState<string[]>(
    defaultValue ?? [],
  );

  const values = value ?? internalValues;
  const allRules = React.useMemo(
    () => (pattern ? [{ test: pattern, message: "Invalid format." }, ...(rules ?? [])] : (rules ?? [])),
    [pattern, rules],
  );
  const check = (text: string) => validateValue(text, allRules) ?? validate?.(text) ?? null;
  const clean = (text: string) => {
    const trimmed = text.trim();
    return trimmed && normalize ? normalize(trimmed).trim() : trimmed;
  };

  function setValues(next: string[]) {
    if (value === undefined) setInternalValues(next);
    onValueChange?.(next);
  }

  /** Adds what passes; returns whether everything was accepted. */
  function addValues(texts: string[]) {
    const { added, error: message } = collectValues(texts.map(clean), values, check, maxValues);
    if (added.length) setValues([...values, ...added]);
    setError(message);
    return message === null;
  }

  function removeValue(val: string) {
    setValues(values.filter((v) => v !== val));
    setError(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputText.trim()) {
        // Keep a rejected value in the box so it can be fixed.
        if (addValues([inputText])) setInputText("");
        inputRef.current?.focus();
      }
    } else if (e.key === "Backspace" && inputText === "" && values.length > 0) {
      removeValue(values[values.length - 1]);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    if (!pasteSeparator) return;
    const text = e.clipboardData.getData("text");
    const parts = text.split(pasteSeparator);
    if (parts.filter((p) => p.trim()).length < 2) return;
    e.preventDefault();
    addValues([inputText, ...parts]);
    setInputText("");
  }

  return (
    <div data-slot="multi-input-root" className="flex w-full min-w-0 flex-col gap-1.5">
      <div
        data-slot="multi-input"
        aria-invalid={error ? true : undefined}
        className={cn(
          inputBaseClass,
          "flex max-h-10 items-center gap-1.5 overflow-x-auto px-3 py-1.5",
          "focus-within:ring-ring/50 focus-within:border-ring focus-within:ring-[3px]",
          disabled && "pointer-events-none cursor-not-allowed opacity-50",
          className,
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {values.map((val) => (
          <Badge
            key={val}
            variant="secondary"
            color="var(--primary)"
            className="rounded-sm px-1.5 py-1 leading-none font-normal"
          >
            {val}
            {!readOnly && !disabled && (
              <button
                type="button"
                aria-label={`Remove ${val}`}
                className="focus:ring-ring ml-1 flex items-center rounded-full outline-none focus:ring-1"
                onClick={(e) => {
                  e.stopPropagation();
                  removeValue(val);
                }}
              >
                <XIcon className="text-muted-foreground hover:text-foreground size-2.5" />
              </button>
            )}
          </Badge>
        ))}

        {values.length > 0 && !readOnly && (
          <Button
            type="button"
            variant="secondary"
            color="var(--destructive)"
            size="xs"
            className="rounded-sm text-xs leading-none font-normal"
            onClick={() => {
              setValues([]);
              setError(null);
            }}
          >
            <Delete /> All
          </Button>
        )}

        {!readOnly && (
          <input
            ref={inputRef}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "placeholder:text-muted-foreground shrink-0 bg-transparent text-sm outline-none disabled:cursor-not-allowed",
              values.length === 0 ? "min-w-full" : "min-w-1/2",
            )}
            autoComplete="off"
          />
        )}
      </div>
      {error && (
        <p id={errorId} aria-live="polite" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

export interface NumberInputProps extends Omit<
  React.ComponentProps<"input">,
  "type" | "onChange"
> {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

function NumberInput({
  className,
  value,
  onChange,
  onBlur,
  min,
  max,
  step = 1,
  disabled,
  ...props
}: NumberInputProps) {
  const [raw, setRaw] = React.useState(() =>
    value !== undefined ? String(value) : "",
  );

  React.useEffect(() => {
    setRaw(value !== undefined ? String(value) : "");
  }, [value]);

  const clamp = (v: number) => {
    if (min !== undefined && v < min) return min;
    if (max !== undefined && v > max) return max;
    return v;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const str = e.target.value;
    setRaw(str);
    const parsed = parseFloat(str);
    if (!isNaN(parsed)) onChange?.(clamp(parsed));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (raw === "" || isNaN(parseFloat(raw))) {
      const fallback = min !== undefined ? min : 0;
      setRaw(String(fallback));
      onChange?.(fallback);
    }
    onBlur?.(e);
  };

  const increment = () => {
    const next = clamp((value ?? 0) + step);
    setRaw(String(next));
    onChange?.(next);
  };
  const decrement = () => {
    const next = clamp((value ?? 0) - step);
    setRaw(String(next));
    onChange?.(next);
  };

  return (
    <div
      data-slot="input"
      className={cn(
        inputBaseClass,
        "focus-within-ring flex h-9",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input
        type="number"
        value={raw}
        onChange={handleChange}
        onBlur={handleBlur}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="placeholder:text-muted-foreground w-full flex-1 rounded-l-md bg-transparent px-3 py-1 text-sm outline-none disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        {...props}
      />
      <div className="border-input flex flex-col border-l">
        <Button
          type="button"
          variant="ghost"
          tabIndex={-1}
          disabled={disabled || (max !== undefined && (value ?? 0) >= max)}
          onClick={increment}
          className="text-muted-foreground hover:text-foreground hover:bg-muted focus:bg-transparent active:bg-transparent flex h-auto flex-1 items-center justify-center rounded-none rounded-tr-md px-1.5 py-0 disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronUp className="size-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          tabIndex={-1}
          disabled={disabled || (min !== undefined && (value ?? 0) <= min)}
          onClick={decrement}
          className="border-input text-muted-foreground hover:text-foreground hover:bg-muted focus:bg-transparent active:bg-transparent flex h-auto flex-1 items-center justify-center rounded-none rounded-br-md border-t px-1.5 py-0 disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronDown className="size-3" />
        </Button>
      </div>
    </div>
  );
}

// Cap the accumulated minor-unit value so value*10 stays a safe integer.
const CURRENCY_MAX_MINOR_UNITS = Math.floor(Number.MAX_SAFE_INTEGER / 10);

export interface CurrencyInputProps extends Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "onChange"
> {
  value: number;
  onChange: (minorUnits: number) => void;
  currency?: string;
}

// CurrencyInput is a bank-style amount entry. The stored value is in minor
// units (cents); it displays as major.dd and fills right-to-left as digits
// are typed: 0.00 → type 1 → 0.01 → type 1 → 0.11 → type 1 → 1.11.
// Backspace removes the least-significant digit (÷10), Delete clears it.
function CurrencyInput({
  className,
  value,
  onChange,
  currency,
  disabled,
  ...props
}: CurrencyInputProps) {
  const minor = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  const display = (minor / 100).toFixed(2);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      const next = minor * 10 + Number(e.key);
      onChange(Math.min(next, CURRENCY_MAX_MINOR_UNITS));
    } else if (e.key === "Backspace") {
      e.preventDefault();
      onChange(Math.floor(minor / 10));
    } else if (e.key === "Delete") {
      e.preventDefault();
      onChange(0);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    const next = digits === "" ? 0 : Number(digits);
    if (Number.isSafeInteger(next))
      onChange(Math.min(next, CURRENCY_MAX_MINOR_UNITS));
  };

  return (
    <div className="relative">
      {currency && (
        <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
          {currency}
        </span>
      )}
      <Input
        inputMode="numeric"
        disabled={disabled}
        className={cn("focus-ring text-right", currency && "pl-12", className)}
        value={display}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        {...props}
      />
    </div>
  );
}

export { Input, MultiInput, NumberInput, CurrencyInput };
