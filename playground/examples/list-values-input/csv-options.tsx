import { ListValuesInput } from "leastui";

// For a CSV like:
//   name,sku,qty
//   Classic tee,TS-001,4
// read SKUs from the second column and replace the list on each upload.
export default function ListValuesInputCsvOptions() {
  return (
    <ListValuesInput
      className="w-full max-w-lg"
      defaultTab="csv"
      csvColumn={1}
      csvMode="replace"
      pattern="[A-Z]{2}-\d{3}"
      placeholder="SKU, e.g. TS-001"
      pasteLabel="SKUs"
      csvLabel="From inventory CSV"
      csvHint="Drop an inventory export. SKUs are read from the second column."
    />
  );
}
