import { useState } from "react";
import { Autocomplete } from "leastui";

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
  { value: "vite", label: "Vite" },
  { value: "gatsby", label: "Gatsby", disabled: true },
];

export default function AutocompleteDemo() {
  const [value, setValue] = useState<string | string[]>("");

  return (
    <div className="w-64">
      <Autocomplete
        options={frameworks}
        value={value}
        onValueChange={setValue}
        placeholder="Select framework..."
        searchPlaceholder="Search framework..."
      />
    </div>
  );
}
