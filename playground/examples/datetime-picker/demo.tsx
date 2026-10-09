import { useState } from "react";
import { DateTimePicker } from "leastui";

export default function DateTimePickerDemo() {
  const [value, setValue] = useState("");

  return (
    <div className="w-72">
      <DateTimePicker format="YYYY-MM-DD hh:mm A" value={value} onValueChange={setValue} />
    </div>
  );
}
