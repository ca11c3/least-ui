import { useState } from "react";
import { ChevronsUpDownIcon } from "lucide-react";
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from "leastui";

export default function CollapsibleDemo() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="flex w-72 flex-col gap-2">
      <div className="flex items-center justify-between gap-4 px-2">
        <h4 className="text-sm font-semibold">@leastui starred 3 repositories</h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Toggle">
            <ChevronsUpDownIcon />
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="rounded-md border px-4 py-2 font-mono text-sm">radix-ui/primitives</div>
      <CollapsibleContent className="flex flex-col gap-2">
        <div className="rounded-md border px-4 py-2 font-mono text-sm">shadcn-ui/ui</div>
        <div className="rounded-md border px-4 py-2 font-mono text-sm">tailwindlabs/tailwindcss</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
