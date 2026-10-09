import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "leastui";

export default function AlertVariants() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Alert variant="info">
        <InfoIcon />
        <AlertTitle>New version available</AlertTitle>
        <AlertDescription>Refresh to get the latest features.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <CircleCheckIcon />
        <AlertTitle>Payment received</AlertTitle>
        <AlertDescription>Your invoice has been paid.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <TriangleAlertIcon />
        <AlertTitle>Storage almost full</AlertTitle>
        <AlertDescription>You have used 92% of your quota.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <CircleAlertIcon />
        <AlertTitle>Upload failed</AlertTitle>
        <AlertDescription>The file is larger than 10 MB.</AlertDescription>
      </Alert>
    </div>
  );
}
