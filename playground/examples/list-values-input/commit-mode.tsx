import { useState } from "react";
import { ListValuesInput, pluralize, toast, valueRules } from "leastui";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Values are saved the moment they're added (no form Save), and files go to
// the server as-is for it to import.
export default function ListValuesInputCommitMode() {
  const [saved, setSaved] = useState<string[]>(["blocked@example.com"]);
  const [busy, setBusy] = useState(false);

  const addValues = async (values: string[]) => {
    setBusy(true);
    await wait(600); // e.g. await mutateAsync(values)
    setSaved((current) => [...current, ...values]);
    setBusy(false);
    toast.success(`Added ${values.length} ${pluralize("value", values.length)}.`);
  };

  const uploadFile = async (file: File) => {
    setBusy(true);
    await wait(900); // e.g. await uploadCSV(file)
    setBusy(false);
    toast.success(`Uploaded ${file.name} for import.`);
  };

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <ListValuesInput
        rules={[valueRules.email()]}
        normalize={(v) => v.toLowerCase()}
        existing={saved}
        busy={busy}
        onCommit={addValues}
        onUploadFile={uploadFile}
        accept=".csv,.txt"
        placeholder="name@example.com"
        pasteLabel="Add emails"
      />
      <p className="text-muted-foreground text-sm">
        {saved.length} saved: {saved.join(", ")}
      </p>
    </div>
  );
}
