import { useState } from "react";
import { NumberInput } from "leastui";

export default function InputNumber() {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="w-40">
      <NumberInput value={quantity} onChange={setQuantity} min={1} max={10} aria-label="Quantity" />
    </div>
  );
}
