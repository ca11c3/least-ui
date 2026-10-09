import { useState } from "react";
import { DateTimeRangePicker, type DateRange } from "leastui";

export default function DateTimeRangePickerDemo() {
  const [range, setRange] = useState<DateRange>({ from: undefined });

  return (
    <div className="w-full max-w-md">
      <DateTimeRangePicker value={range} onValueChange={setRange} />
    </div>
  );
}
