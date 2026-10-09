import { useState } from "react";
import {
  TableGrid,
  TableGridBody,
  TableGridCell,
  TableGridHead,
  TableGridHeader,
  TableGridRow,
  Tabs,
  TabsList,
  TabsTrigger,
  type TableGridDensity,
} from "leastui";

const rows = ["Design review", "Sprint planning", "Customer call"];
const columns = "grid-cols-[1fr_120px]";

export default function TableGridDensityDemo() {
  const [density, setDensity] = useState<TableGridDensity>("default");

  return (
    <div className="flex w-full flex-col gap-4">
      <Tabs value={density} onValueChange={(v) => setDensity(v as TableGridDensity)}>
        <TabsList>
          <TabsTrigger value="sm">Compact</TabsTrigger>
          <TabsTrigger value="default">Default</TabsTrigger>
          <TabsTrigger value="lg">Comfortable</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="rounded-lg border">
        <TableGrid density={density}>
          <TableGridHeader>
            <TableGridRow className={columns}>
              <TableGridHead>Meeting</TableGridHead>
              <TableGridHead>Time</TableGridHead>
            </TableGridRow>
          </TableGridHeader>
          <TableGridBody>
            {rows.map((row, i) => (
              <TableGridRow key={row} className={columns}>
                <TableGridCell>{row}</TableGridCell>
                <TableGridCell>{9 + i * 2}:00</TableGridCell>
              </TableGridRow>
            ))}
          </TableGridBody>
        </TableGrid>
      </div>
    </div>
  );
}
