import { useState } from "react";
import { SearchForm } from "leastui";

export default function SearchFormDemo() {
  const [query, setQuery] = useState("");

  return (
    <div className="flex w-80 flex-col gap-2">
      <SearchForm placeholder="Search orders..." value={query} onChange={setQuery} />
      <p className="text-muted-foreground text-sm">Query: {query || "none"}</p>
    </div>
  );
}
