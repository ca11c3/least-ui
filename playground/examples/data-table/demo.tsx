import type { ColumnDef } from "@tanstack/react-table";
import { Badge, DataTable } from "leastui";

type Invoice = {
  id: string;
  customer: string;
  status: "Paid" | "Pending" | "Overdue";
  amount: number;
  issued: string;
};

const statusColor = {
  Paid: "var(--success)",
  Pending: "var(--warning)",
  Overdue: "var(--destructive)",
};

const customers = ["Olivia Martin", "Ava Johnson", "Liam Wilson", "Noah Brown", "Emma Davis", "Lucas Lee"];
const statuses: Invoice["status"][] = ["Paid", "Pending", "Paid", "Overdue", "Paid"];

const invoices: Invoice[] = Array.from({ length: 32 }, (_, i) => ({
  id: `INV-${String(1040 - i).padStart(4, "0")}`,
  customer: customers[i % customers.length],
  status: statuses[i % statuses.length],
  amount: 1250 + ((i * 7919) % 48000),
  issued: `2026-09-${String(30 - (i % 28)).padStart(2, "0")}`,
}));

const columns: ColumnDef<Invoice>[] = [
  { accessorKey: "id", header: "Invoice", size: 140, meta: { copyable: true } },
  { accessorKey: "customer", header: "Customer", size: 220 },
  {
    accessorKey: "status",
    header: "Status",
    size: 140,
    cell: ({ row }) => (
      <Badge variant="secondary" color={statusColor[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    size: 140,
    cell: ({ row }) => `$${(row.original.amount / 100).toFixed(2)}`,
  },
  { accessorKey: "issued", header: "Issued", size: 140 },
];

export default function DataTableDemo() {
  return (
    <div className="w-full rounded-lg border">
      <DataTable
        columns={columns}
        data={invoices}
        pagination={{ enabled: true, mode: "paginated", rowsPerPage: 10 }}
      />
    </div>
  );
}
