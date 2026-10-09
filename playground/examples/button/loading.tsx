import { useState } from "react";
import { Button, Spinner } from "leastui";

export default function ButtonLoading() {
  const [loading, setLoading] = useState(false);

  const save = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <Button onClick={save} disabled={loading}>
      {loading && <Spinner />}
      {loading ? "Saving..." : "Save changes"}
    </Button>
  );
}
