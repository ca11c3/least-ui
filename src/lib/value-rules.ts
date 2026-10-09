/**
 * Validation rules for list-style inputs (MultiInput, ListValuesInput).
 *
 * A value must pass every rule in a list (AND). Wrap rules in
 * `valueRules.anyOf(...)` when passing any one of them is enough (OR).
 */
export type ValueRule = {
  /** A regex (anchored when given as a string), or a predicate. */
  test: RegExp | string | ((value: string) => boolean);
  /** Shown when the value fails the rule. */
  message: string;
};

function passes(rule: ValueRule, value: string) {
  if (typeof rule.test === "function") return rule.test(value);
  const regex = typeof rule.test === "string" ? new RegExp(`^(?:${rule.test})$`) : rule.test;
  // A shared /g regex keeps lastIndex between calls; reset so results don't alternate.
  regex.lastIndex = 0;
  return regex.test(value);
}

/** The message of the first rule `value` fails, or null when it passes all of them. */
export function validateValue(value: string, rules: readonly ValueRule[] | undefined) {
  for (const rule of rules ?? []) {
    if (!passes(rule, value)) return rule.message;
  }
  return null;
}

const IPV4_OCTET = "(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
const IPV4 = new RegExp(`^${IPV4_OCTET}(?:\\.${IPV4_OCTET}){3}$`);

function isIPv4(value: string) {
  return IPV4.test(value);
}

function isIPv6(value: string) {
  if (!/^[0-9a-f:.]+$/i.test(value)) return false;
  const halves = value.split("::");
  if (halves.length > 2) return false;
  const groups = halves.flatMap((half) => (half ? half.split(":") : []));
  let count = groups.length;
  // An IPv4 tail ("::ffff:192.0.2.1") stands in for the last two groups.
  if (groups.at(-1)?.includes(".")) {
    if (!isIPv4(groups.pop()!)) return false;
    count += 1;
  }
  if (!groups.every((g) => /^[0-9a-f]{1,4}$/i.test(g))) return false;
  return halves.length === 2 ? count < 8 : count === 8;
}

function isCidr(value: string, version?: 4 | 6) {
  const [ip, prefix, ...rest] = value.split("/");
  if (rest.length || prefix === undefined || !/^\d{1,3}$/.test(prefix)) return false;
  const bits = Number(prefix);
  if (version !== 6 && isIPv4(ip)) return bits <= 32;
  if (version !== 4 && isIPv6(ip)) return bits <= 128;
  return false;
}

/** Ready-made rules. Each takes an optional message to override the default. */
export const valueRules = {
  /** Any regex, e.g. `valueRules.pattern(/^[A-Z]{2}-\d{3}$/, "Use a SKU like TS-001.")`. */
  pattern: (test: RegExp | string, message = "Invalid format."): ValueRule => ({ test, message }),
  /** Any predicate. */
  custom: (test: (value: string) => boolean, message: string): ValueRule => ({ test, message }),

  email: (message = "Enter a valid email address."): ValueRule => ({
    test: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    message,
  }),
  /** Domain name such as example.com; `allowWildcard` also accepts *.example.com. */
  domain: ({ allowWildcard = false, message = "Enter a valid domain, e.g. example.com." } = {}): ValueRule => ({
    test: (value) =>
      value.length <= 253 &&
      new RegExp(
        `^${allowWildcard ? "(?:\\*\\.)?" : ""}(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,63}$`,
        "i",
      ).test(value),
    message,
  }),
  /** Absolute URL; http and https only by default. */
  url: ({ protocols = ["http:", "https:"], message = "Enter a valid URL, e.g. https://example.com." } = {}): ValueRule => ({
    test: (value) => {
      try {
        return protocols.includes(new URL(value).protocol);
      } catch {
        return false;
      }
    },
    message,
  }),
  ipv4: (message = "Enter a valid IPv4 address."): ValueRule => ({ test: isIPv4, message }),
  ipv6: (message = "Enter a valid IPv6 address."): ValueRule => ({ test: isIPv6, message }),
  ip: (message = "Enter a valid IP address."): ValueRule => ({
    test: (value) => isIPv4(value) || isIPv6(value),
    message,
  }),
  /** CIDR block such as 10.0.0.0/8; pass a version to allow only IPv4 or IPv6. */
  cidr: ({ version, message = "Enter a valid CIDR block, e.g. 10.0.0.0/8." }: { version?: 4 | 6; message?: string } = {}): ValueRule => ({
    test: (value) => isCidr(value, version),
    message,
  }),
  uuid: (message = "Enter a valid UUID."): ValueRule => ({
    test: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    message,
  }),
  /** E.164 phone number, e.g. +6591234567. */
  phone: (message = "Enter a phone number in international format, e.g. +6591234567."): ValueRule => ({
    test: /^\+[1-9]\d{6,14}$/,
    message,
  }),
  integer: (message = "Enter a whole number."): ValueRule => ({ test: /^-?\d+$/, message }),
  number: (message = "Enter a number."): ValueRule => ({
    test: (value) => value.trim() !== "" && Number.isFinite(Number(value)),
    message,
  }),
  /** Inclusive numeric range; also rejects non-numbers. */
  range: (min: number, max: number, message = `Enter a number from ${min} to ${max}.`): ValueRule => ({
    test: (value) => {
      const n = Number(value);
      return value.trim() !== "" && n >= min && n <= max;
    },
    message,
  }),
  alphanumeric: (message = "Use letters and numbers only."): ValueRule => ({ test: /^[a-z0-9]+$/i, message }),
  minLength: (min: number, message = `Use at least ${min} characters.`): ValueRule => ({
    test: (value) => value.length >= min,
    message,
  }),
  maxLength: (max: number, message = `Use at most ${max} characters.`): ValueRule => ({
    test: (value) => value.length <= max,
    message,
  }),
  /** Only values from a fixed list. */
  oneOf: (
    options: readonly string[],
    { caseSensitive = false, message = `Must be one of: ${options.join(", ")}.` } = {},
  ): ValueRule => {
    const allowed = new Set(caseSensitive ? options : options.map((o) => o.toLowerCase()));
    return { test: (value) => allowed.has(caseSensitive ? value : value.toLowerCase()), message };
  },
  /** Rejects values from a fixed list, e.g. reserved words. */
  noneOf: (
    options: readonly string[],
    { caseSensitive = false, message = "This value isn't allowed." } = {},
  ): ValueRule => {
    const blocked = new Set(caseSensitive ? options : options.map((o) => o.toLowerCase()));
    return { test: (value) => !blocked.has(caseSensitive ? value : value.toLowerCase()), message };
  },
  /** OR: passes when any one of `rules` passes, e.g. an IPv4 address or a CIDR block. */
  anyOf: (rules: readonly ValueRule[], message?: string): ValueRule => ({
    test: (value) => rules.some((rule) => passes(rule, value)),
    message: message ?? rules.map((r) => r.message.replace(/\.$/, "")).join(", or ") + ".",
  }),
  /** AND, as one rule with one message. */
  allOf: (rules: readonly ValueRule[], message?: string): ValueRule => ({
    test: (value) => rules.every((rule) => passes(rule, value)),
    message: message ?? rules.map((r) => r.message).join(" "),
  }),
};
