import {
  Badge,
  TableGrid,
  TableGridBody,
  TableGridCell,
  TableGridHead,
  TableGridHeader,
  TableGridRow,
} from "leastui";

const users = [
  { name: "Olivia Martin", email: "olivia@example.com", role: "Owner" },
  { name: "Jackson Lee", email: "jackson@example.com", role: "Admin" },
  { name: "Isabella Nguyen", email: "isabella@example.com", role: "Member" },
  { name: "William Kim", email: "will@example.com", role: "Member" },
];

// Rows are CSS grids, so one template string sets every column width.
const columns = "grid-cols-[1.2fr_1.5fr_100px]";

export default function TableGridDemo() {
  return (
    <div className="w-full rounded-lg border">
      <TableGrid>
        <TableGridHeader>
          <TableGridRow className={columns}>
            <TableGridHead>Name</TableGridHead>
            <TableGridHead>Email</TableGridHead>
            <TableGridHead>Role</TableGridHead>
          </TableGridRow>
        </TableGridHeader>
        <TableGridBody>
          {users.map((user) => (
            <TableGridRow key={user.email} className={columns}>
              <TableGridCell className="font-medium">{user.name}</TableGridCell>
              <TableGridCell className="text-muted-foreground truncate">{user.email}</TableGridCell>
              <TableGridCell>
                <Badge variant={user.role === "Member" ? "outline" : "secondary"}>{user.role}</Badge>
              </TableGridCell>
            </TableGridRow>
          ))}
        </TableGridBody>
      </TableGrid>
    </div>
  );
}
