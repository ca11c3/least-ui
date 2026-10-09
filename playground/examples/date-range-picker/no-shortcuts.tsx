import { useState } from "react";
import { DateRangePicker, type DateRange } from "leastui";

export default function DateRangePickerNoShortcuts() {
  const [range, setRange] = useState<DateRange>({ from: undefined });

  return (
    <div className="w-80">
      <DateRangePicker
        shortcuts={false}
        format={{ from: "DD/MM/YYYY", to: "DD/MM/YYYY" }}
        value={range}
        onValueChange={setRange}
      />
    </div>
  );
}
