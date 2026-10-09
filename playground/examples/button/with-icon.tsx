import { DownloadIcon, SendIcon } from "lucide-react";
import { Button } from "leastui";

export default function ButtonWithIcon() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button>
        <SendIcon />
        Send email
      </Button>
      <Button variant="outline">
        <DownloadIcon />
        Download
      </Button>
    </div>
  );
}
