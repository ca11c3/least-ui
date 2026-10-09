import { useState } from "react";
import { Autocomplete } from "leastui";

const countries = [
  "Australia", "Brazil", "Canada", "Denmark", "France", "Germany",
  "Japan", "Malaysia", "Singapore", "Spain", "Thailand", "United Kingdom",
].map((name) => ({ value: name.toLowerCase(), label: name }));

export default function AutocompleteMultiple() {
  const [value, setValue] = useState<string | string[]>(["malaysia", "singapore"]);

  return (
    <div className="w-72">
      <Autocomplete
        multiple
        maxVisible={2}
        options={countries}
        value={value}
        onValueChange={setValue}
        placeholder="Select countries..."
      />
    </div>
  );
}
