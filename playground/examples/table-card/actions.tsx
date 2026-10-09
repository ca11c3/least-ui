import type { ColumnDef } from "@tanstack/react-table";
import { DownloadIcon, PlusIcon, PrinterIcon, TrashIcon, UploadIcon } from "lucide-react";
import { TableCard, toast } from "leastui";

type Product = { sku: string; name: string; stock: number; price: number };

const products: Product[] = [
  { sku: "TS-001", name: "Classic tee", stock: 124, price: 1800 },
  { sku: "HD-014", name: "Zip hoodie", stock: 38, price: 5400 },
  { sku: "CP-207", name: "Canvas cap", stock: 0, price: 2200 },
  { sku: "SK-330", name: "Crew socks (3-pack)", stock: 260, price: 1200 },
  { sku: "TB-112", name: "Tote bag", stock: 71, price: 1500 },
];

const columns: ColumnDef<Product>[] = [
  { accessorKey: "sku", header: "SKU", size: 110 },
  { accessorKey: "name", header: "Product", size: 220 },
  { accessorKey: "stock", header: "Stock", size: 100 },
  {
    accessorKey: "price",
    header: "Price",
    size: 100,
    cell: ({ row }) => `$${(row.original.price / 100).toFixed(2)}`,
  },
];

export default function TableCardActions() {
  return (
    <TableCard<Product, object>
      columns={columns}
      data={products}
      density="sm"
      actions={[
        { label: "Add product", icon: <PlusIcon />, onSelect: () => void toast("Add product") },
        { label: "Import CSV", icon: <UploadIcon />, onSelect: () => void toast("Import CSV") },
        { label: "Export CSV", icon: <DownloadIcon />, onSelect: () => void toast.success("Exported") },
        { label: "Print", icon: <PrinterIcon />, disabled: true },
        {
          label: "Delete out of stock",
          icon: <TrashIcon />,
          variant: "destructive",
          onSelect: () => void toast.error("Deleted 1 product"),
        },
      ]}
    />
  );
}
