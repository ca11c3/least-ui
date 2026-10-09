import { useState } from "react";
import { MultiInput } from "leastui";

export default function InputMulti() {
  const [tags, setTags] = useState(["react", "tailwind"]);

  return (
    <div className="w-80">
      <MultiInput value={tags} onValueChange={setTags} placeholder="Add a tag and press Enter" />
    </div>
  );
}
