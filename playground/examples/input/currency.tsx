import { useState } from "react";
import { CurrencyInput } from "leastui";

export default function InputCurrency() {
  const [cents, setCents] = useState(0);

  return (
    <div className="flex w-60 flex-col gap-2">
      <CurrencyInput currency="MYR" value={cents} onChange={setCents} aria-label="Amount" />
      <p className="text-muted-foreground text-sm">Stored value: {cents} (minor units)</p>
    </div>
  );
}
