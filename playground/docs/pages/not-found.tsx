import { Button } from "leastui";
import { Link } from "../router";

export function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-32 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">This page doesn't exist.</p>
      <Button asChild>
        <Link to="/docs">Back to the docs</Link>
      </Button>
    </div>
  );
}
