import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable, toast } from "leastui";

type Member = { id: string; name: string; email: string; role: string };

const initialMembers: Member[] = [
  { id: "1", name: "Olivia Martin", email: "olivia@example.com", role: "Owner" },
  { id: "2", name: "Ava Johnson", email: "ava@example.com", role: "Admin" },
  { id: "3", name: "Liam Wilson", email: "liam@example.com", role: "Member" },
  { id: "4", name: "Noah Brown", email: "noah@example.com", role: "Member" },
  { id: "5", name: "Emma Davis", email: "emma@example.com", role: "Viewer" },
];

const columns: ColumnDef<Member>[] = [
  { accessorKey: "name", header: "Name", size: 200 },
  { accessorKey: "email", header: "Email", size: 240 },
  { accessorKey: "role", header: "Role", size: 120 },
];

export default function DataTableSelection() {
  const [members, setMembers] = useState(initialMembers);

  return (
    <div className="w-full rounded-lg border">
      <DataTable
        columns={columns}
        data={members}
        getRowId={(member) => member.id}
        enableRowSelection
        // The owner can't be removed, so their row can't be selected.
        isRowSelectable={(member) => member.role !== "Owner"}
        onDeleteSelected={(rows) => {
          const ids = new Set(rows.map((row) => row.id));
          setMembers((current) => current.filter((member) => !ids.has(member.id)));
          toast.success(`Removed ${rows.length} member${rows.length === 1 ? "" : "s"}`);
        }}
        isScrollTop={false}
      />
    </div>
  );
}
