import { DataTable } from "./DataTable";
import type { TableGridDensity } from "../components/table-grid";
import { TableAction, type TableActionItem } from "./TableAction";
import { Badge } from "../components/badge";
import { Card, CardContent, CardHeader } from "../components/card";
import { Tabs, TabsList, TabsTrigger } from "../components/tabs";
import type { ColumnDef } from "@tanstack/react-table";
import { type ReactNode, useState } from "react";
import { FilterButton, type FilterField, FilterPanel } from "./TableFilters";
import { cn } from "../lib/utils";

export interface TabItem {
  value: string;
  label: string;
  count?: number;
  color?: string;
}

interface TableCardProps<T, U extends object> {
  isFilterable?: boolean;
  isLoading?: boolean;
  columns: ColumnDef<T>[];
  data: T[];
  actions?: TableActionItem[];
  onRowClick?: (row: T) => void;
  filterFields?: FilterField<Extract<keyof U, string>>[];
  appliedFilters?: U;
  showFilters?: boolean;
  onApplyFilters?: (values: U) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  error?: string | ReactNode;
  tabs?: TabItem[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  excludeFromFilterCount?: (keyof U & string)[];
  /** Row padding: "sm" for compact lists, "lg" for roomier tables. */
  density?: TableGridDensity;
}

const TableCard = <T, U extends object>({
  isFilterable = true,
  isLoading = false,
  columns,
  data,
  actions,
  filterFields = [],
  appliedFilters,
  hasMore = false,
  error,
  onApplyFilters,
  onLoadMore,
  onRowClick,
  tabs,
  activeTab,
  onTabChange,
  excludeFromFilterCount,
  density,
}: TableCardProps<T, U>) => {
  const canRenderFilters =
    isFilterable &&
    filterFields.length > 0 &&
    appliedFilters !== undefined &&
    onApplyFilters;

  const [showFilters, setShowFilters] = useState(false);

  const onToggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  const onCancelFilters = () => {
    setShowFilters(false);
  };

  const onClearFilters = () => {
    const clearedValues = Object.fromEntries(
      Object.entries(appliedFilters as Record<string, unknown>).map(
        ([key, value]) => [key, Array.isArray(value) ? [] : null],
      ),
    ) as U;
    onApplyFilters?.(clearedValues);
  };

  return (
    <Card className="relative w-full gap-0 pb-0 pt-3">
      <CardHeader className="border-border h-full border-b px-0 pb-3">
        <div
          className={cn(
            "flex flex-wrap gap-3 px-3",
            tabs && tabs.length > 0
              ? "flex-col sm:flex-row sm:items-center"
              : "items-center",
            canRenderFilters || (actions && actions.length > 0)
              ? "justify-start"
              : "justify-end",
          )}
        >
          {tabs && tabs.length > 0 && (
            <Tabs
              value={activeTab}
              onValueChange={onTabChange}
              className="w-full sm:w-auto"
            >
              <TabsList variant="default" size="lg">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    color={tab.color}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <Badge variant="secondary">{tab.count}</Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
          <div
            className={cn(
              "flex shrink-0 gap-3",
              tabs ? "justify-end" : "justify-between w-full",
            )}
          >
            {canRenderFilters ? (
              <FilterButton
                appliedFilters={appliedFilters}
                onClear={onClearFilters}
                onToggle={onToggleFilters}
                excludeFromCount={excludeFromFilterCount}
              />
            ) : null}

            {actions && actions.length > 0 ? (
              <div className="ml-auto">
                <TableAction actions={actions} />
              </div>
            ) : null}
          </div>
        </div>
        {canRenderFilters ? (
          <FilterPanel
            fields={filterFields}
            values={appliedFilters}
            isOpen={showFilters}
            onApply={onApplyFilters}
            onCancel={onCancelFilters}
          />
        ) : null}
      </CardHeader>
      <CardContent className="overflow-auto p-0">
        <DataTable
          columns={columns}
          data={data}
          pagination={{ enabled: true, mode: "infinite" }}
          isLoading={isLoading}
          onLoadMore={onLoadMore}
          hasMore={hasMore}
          onRowClick={onRowClick}
          error={error}
          density={density}
        />
      </CardContent>
    </Card>
  );
};

export { TableCard };
export default TableCard;
