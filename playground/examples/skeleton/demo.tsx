import { Skeleton } from "leastui";

export default function SkeletonDemo() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="size-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-44" />
      </div>
    </div>
  );
}
