import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "leastui";

const invoices = [
  { invoice: "INV001", status: "Paid", method: "Credit card", amount: 250 },
  { invoice: "INV002", status: "Pending", method: "PayPal", amount: 150 },
  { invoice: "INV003", status: "Unpaid", method: "Bank transfer", amount: 350 },
  { invoice: "INV004", status: "Paid", method: "Credit card", amount: 450 },
];

export default function TableDemo() {
  const total = invoices.reduce((sum, row) => sum + row.amount, 0);

  return (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((row) => (
          <TableRow key={row.invoice}>
            <TableCell className="font-medium">{row.invoice}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell>{row.method}</TableCell>
            <TableCell className="text-right">${row.amount.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">${total.toFixed(2)}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
