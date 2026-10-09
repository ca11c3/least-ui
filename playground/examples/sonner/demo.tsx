import { Button, toast } from "leastui";

// Render <Toaster /> once near the root of your app.
export default function SonnerDemo() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button
        variant="outline"
        onClick={() =>
          toast("Event has been created", {
            description: "Sunday, December 3 at 9:00 AM",
            action: { label: "Undo", onClick: () => {} },
          })
        }
      >
        Default
      </Button>
      <Button variant="outline" onClick={() => toast.success("Changes saved")}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.info("A new version is available")}>
        Info
      </Button>
      <Button variant="outline" onClick={() => toast.warning("Your session expires soon")}>
        Warning
      </Button>
      <Button variant="outline" onClick={() => toast.error("Something went wrong")}>
        Error
      </Button>
    </div>
  );
}
