import { TerminalIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "leastui";

export default function AlertDemo() {
  return (
    <Alert className="max-w-md">
      <TerminalIcon />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>You can add components to your app with one import.</AlertDescription>
    </Alert>
  );
}
