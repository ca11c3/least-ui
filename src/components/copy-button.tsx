import * as React from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "./button";

// Copies `value` to the clipboard and shows a check for two seconds.
function CopyButton({
  value,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "value" | "children"> & {
  value: string;
}) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={copied ? "Copied" : "Copy"}
      className={cn("text-muted-foreground size-6 [&_svg]:size-3.5", className)}
      onClick={(event) => {
        // Usually sits inside a clickable row; copying should not open it.
        event.stopPropagation();
        navigator.clipboard.writeText(value).then(() => setCopied(true));
      }}
      {...props}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  );
}

export { CopyButton };
