import { useState } from "react";
import { Calendar } from "leastui";

export default function CalendarDemo() {
  const [date, setDate] = useState<Date>(new Date());

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={(day?: Date) => day && setDate(day)}
      className="rounded-lg border shadow-sm"
    />
  );
}
