import { useState } from "react";
import { Input } from "leastui";

export default function InputPrefix() {
  const [url, setUrl] = useState("");

  return (
    <div className="flex w-80 flex-col gap-2">
      <Input prefix="https://" placeholder="example.com" value={url} onChange={(e) => setUrl(e.target.value)} />
      <p className="text-muted-foreground text-sm">Value: {url || "empty"}</p>
    </div>
  );
}
