import { useState } from "react";
import { ListValuesInput } from "leastui";

export default function ListValuesInputDemo() {
  const [emails, setEmails] = useState<string[]>([]);

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <ListValuesInput
        value={emails}
        onValueChange={setEmails}
        placeholder="name@example.com"
        pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
      />
      <p className="text-muted-foreground text-sm">
        {emails.length === 0
          ? "No emails yet. Type one and press Enter, or upload a CSV."
          : `${emails.length} email${emails.length === 1 ? "" : "s"} in the list.`}
      </p>
    </div>
  );
}
