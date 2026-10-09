import { useState } from "react";
import { TimePicker } from "leastui";

export default function TimePickerDemo() {
  const [time, setTime] = useState("");

  return (
    <div className="w-48">
      <TimePicker format="hh:mm A" placeholder="Pick a time" value={time} onValueChange={setTime} />
    </div>
  );
}
