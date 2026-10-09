import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DownloadIcon, PlusIcon } from "lucide-react";
import { Badge, TableCard, toast, type FilterField } from "leastui";

type Order = {
  id: string;
  customer: string;
  status: "Paid" | "Pending" | "Refunded";
  channel: "Web" | "Store" | "Phone";
  amount: number;
};

type Filters = {
  status: string | null;
  customer: string | null;
  channel: string | null;
};

const statusColor = {
  Paid: "var(--success)",
  Pending: "var(--warning)",
  Refunded: "var(--pending)",
};

const customers = ["Olivia Martin", "Ava Johnson", "Liam Wilson", "Noah Brown", "Emma Davis"];
const statuses: Order["status"][] = ["Paid", "Pending", "Paid", "Refunded", "Paid", "Pending"];
const channels: Order["channel"][] = ["Web", "Store", "Phone"];

const orders: Order[] = Array.from({ length: 24 }, (_, i) => ({
  id: `#${3210 - i}`,
  customer: customers[i % customers.length],
  status: statuses[i % statuses.length],
  channel: channels[i % channels.length],
  amount: 1500 + ((i * 6151) % 20000),
}));

const columns: ColumnDef<Order>[] = [
  { accessorKey: "id", header: "Order", size: 110 },
  { accessorKey: "customer", header: "Customer", size: 200 },
  {
    accessorKey: "status",
    header: "Status",
    size: 130,
    cell: ({ row }) => (
      <Badge variant="secondary" color={statusColor[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
  },
  { accessorKey: "channel", header: "Channel", size: 110 },
  {
    accessorKey: "amount",
    header: "Amount",
    size: 120,
    cell: ({ row }) => `$${(row.original.amount / 100).toFixed(2)}`,
  },
];

const filterFields: FilterField<keyof Filters>[] = [
  {
    key: "customer",
    label: "Customer",
    type: "autocomplete",
    multiple: false,
    options: customers.map((name) => ({ label: name, value: name })),
  },
  {
    key: "channel",
    label: "Channel",
    type: "select",
    options: channels.map((channel) => ({ label: channel, value: channel })),
  },
];

const tabs = [
  { value: "All", label: "All" },
  { value: "Paid", label: "Paid", color: "var(--success)" },
  { value: "Pending", label: "Pending", color: "var(--warning)" },
  { value: "Refunded", label: "Refunded", color: "var(--pending)" },
];

export default function TableCardDemo() {
  const [filters, setFilters] = useState<Filters>({ status: "All", customer: null, channel: null });

  const rows = useMemo(
    () =>
      orders.filter(
        (order) =>
          (!filters.status || filters.status === "All" || order.status === filters.status) &&
          (!filters.customer || order.customer === filters.customer) &&
          (!filters.channel || order.channel === filters.channel),
      ),
    [filters],
  );

  return (
    <TableCard<Order, Filters>
      columns={columns}
      data={rows}
      density="sm"
      tabs={tabs.map((tab) => ({
        ...tab,
        count: orders.filter((order) => tab.value === "All" || order.status === tab.value).length,
      }))}
      activeTab={filters.status ?? "All"}
      onTabChange={(status) => setFilters((current) => ({ ...current, status }))}
      filterFields={filterFields}
      appliedFilters={filters}
      // Tabs keep "status" in the filter state too; it shouldn't count as a filter.
      excludeFromFilterCount={["status"]}
      onApplyFilters={(values) => setFilters({ ...values, status: filters.status })}
      actions={[
        { label: "New order", icon: <PlusIcon />, onSelect: () => void toast("New order") },
        { label: "Export CSV", icon: <DownloadIcon />, onSelect: () => void toast.success("Exported") },
      ]}
      onRowClick={(order) => toast(`Opened ${order.id}`)}
    />
  );
}
