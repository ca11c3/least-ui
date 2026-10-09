import { Spinner } from "leastui";

export default function SpinnerDemo() {
  return (
    <div className="flex items-center gap-6">
      <Spinner />
      <Spinner className="size-6" />
      <Spinner className="text-primary size-8" />
    </div>
  );
}
