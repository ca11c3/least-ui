import { useState } from "react";
import { DateRangePicker, type DateRange } from "leastui";

export default function DateRangePickerDemo() {
  const [range, setRange] = useState<DateRange>({ from: undefined });

  return (
    <div className="w-80">
      <DateRangePicker value={range} onValueChange={setRange} />
    </div>
  );
}
