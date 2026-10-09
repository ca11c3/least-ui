export function applyDateFormatMask(digits: string, format: string) {
  // Find chunk sizes (e.g., "YYYY-MM-DD" -> [4, 2, 2])
  const segmentLengths = format
    .split(/[^YMDymd]/)
    .filter(Boolean)
    .map((seg) => seg.length);

  // Find the separator dynamically (e.g., "-")
  const separator = format.replace(/[YMDymd\s]/g, "")[0] || "/";

  let formatted = "";
  let digitIndex = 0;

  for (let i = 0; i < segmentLengths.length; i++) {
    const chunkLength = segmentLengths[i];
    const chunk = digits.slice(digitIndex, digitIndex + chunkLength);
    formatted += chunk;
    digitIndex += chunkLength;

    // Add the dynamic separator if we have more digits for the next segment
    if (digitIndex < digits.length && i < segmentLengths.length - 1) {
      formatted += separator;
    }
  }

  return formatted;
}

export function applyDateTimeFormatMask(rawValue: string, format: string) {
  // Strip everything except letters and numbers
  const cleanInput = rawValue.replace(/[^a-zA-Z0-9]/g, "");
  let formatted = "";
  let inputIndex = 0;

  for (let i = 0; i < format.length; i++) {
    if (inputIndex >= cleanInput.length) break;

    const formatChar = format[i];

    // Handles Date (Y, M, D) and Time (H, h, m, s, S)
    if (/[YMDdHhmsS]/.test(formatChar)) {
      formatted += cleanInput[inputIndex++];
    }
    // Handle AM/PM (a, A)
    else if (formatChar === "a" || formatChar === "A") {
      const chunk = cleanInput.slice(inputIndex, inputIndex + 2);
      formatted +=
        formatChar === "A" ? chunk.toUpperCase() : chunk.toLowerCase();
      inputIndex += chunk.length;
    }
    // Auto-fill separators (dash, colon, space, dot)
    else {
      formatted += formatChar;
    }
  }

  return formatted;
}

