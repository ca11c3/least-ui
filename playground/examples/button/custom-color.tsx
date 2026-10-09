import { Button } from "leastui";

export default function ButtonCustomColor() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button color="rgb(234 88 12)">Orange</Button>
      <Button variant="secondary" color="rgb(13 148 136)">Teal</Button>
      <Button variant="outline" color="rgb(219 39 119)">Pink</Button>
      <Button variant="ghost" color="var(--success)">Success</Button>
    </div>
  );
}
