import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { FilterButton, FilterPanel, type FilterField } from "leastui";

type Filters = {
  keyword: string | null;
  status: string | null;
  owner: string | null;
  tags: string[];
  orderIds: string[];
  createdOn: string | null;
  createdBetween: DateRange | null;
};

const empty: Filters = {
  keyword: null,
  status: null,
  owner: null,
  tags: [],
  orderIds: [],
  createdOn: null,
  createdBetween: null,
};

const people = ["Olivia Martin", "Ava Johnson", "Liam Wilson", "Noah Brown"].map((name) => ({
  label: name,
  value: name,
}));

const fields: FilterField<keyof Filters>[] = [
  {
    key: "keyword",
    label: "Keyword",
    type: "text",
    placeholder: "Search titles...",
    validate: (value) =>
      typeof value === "string" && value.length > 0 && value.length < 3
        ? "Type at least 3 characters."
        : undefined,
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: ["Open", "In review", "Closed"].map((s) => ({ label: s, value: s })),
  },
  { key: "owner", label: "Owner", type: "autocomplete", multiple: false, options: people },
  {
    key: "tags",
    label: "Tags",
    type: "autocomplete",
    multiple: true,
    options: ["Bug", "Feature", "Docs", "Urgent"].map((t) => ({ label: t, value: t })),
  },
  { key: "createdOn", label: "Created on", type: "datePicker" },
  {
    key: "createdBetween",
    label: "Created between",
    type: "dateRangePicker",
    format: { from: "DD/MM/YYYY", to: "DD/MM/YYYY" },
  },
  {
    key: "orderIds",
    label: "Order IDs",
    type: "listValues",
    placeholder: "Type an ID and press Enter",
    regexPattern: "\\d{4}",
    extraInfo: true,
    renderExtraInfo: () => "Four-digit order numbers.\nType them one at a time, or upload a CSV with one per row.",
  },
];

export default function TableFiltersDemo() {
  const [filters, setFilters] = useState<Filters>(empty);
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-card w-full rounded-lg border py-3">
      <div className="px-3">
        <FilterButton
          appliedFilters={filters}
          onToggle={() => setOpen((value) => !value)}
          onClear={() => setFilters(empty)}
        />
      </div>
      <FilterPanel
        fields={fields}
        values={filters}
        isOpen={open}
        onApply={(values) => {
          setFilters(values);
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
      <pre className="bg-muted/50 text-muted-foreground mx-3 mt-4 overflow-auto rounded-md p-3 font-mono text-xs">
        {JSON.stringify(filters, null, 2)}
      </pre>
    </div>
  );
}
