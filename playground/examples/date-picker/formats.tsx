import { useState } from "react";
import { DatePicker } from "leastui";

export default function DatePickerFormats() {
  const [date, setDate] = useState("");

  return (
    <div className="w-64">
      <DatePicker format="DD/MM/YYYY" value={date} onValueChange={setDate} />
    </div>
  );
}
