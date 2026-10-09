import { useState } from "react";
import { DatePicker } from "leastui";

export default function DatePickerDemo() {
  const [date, setDate] = useState("");

  return (
    <div className="flex w-64 flex-col gap-2">
      <DatePicker value={date} onValueChange={setDate} />
      <p className="text-muted-foreground text-sm">Value: {date || "none"}</p>
    </div>
  );
}
