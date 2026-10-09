import { useEffect, useState } from "react";
import { LinearProgress } from "leastui";

export default function LinearProgressDeterminate() {
  const [value, setValue] = useState(10);

  useEffect(() => {
    const id = setInterval(() => setValue((v) => (v >= 100 ? 10 : v + 15)), 800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <LinearProgress value={value} aria-label="Upload progress" />
      <p className="text-muted-foreground text-sm">{Math.min(value, 100)}%</p>
    </div>
  );
}
