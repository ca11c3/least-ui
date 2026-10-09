import { Input } from "leastui";

export default function InputDemo() {
  return (
    <div className="flex w-72 flex-col gap-3">
      <Input type="email" placeholder="Email" />
      <Input placeholder="Disabled" disabled />
    </div>
  );
}
