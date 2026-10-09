import { useState } from "react";
import { ArrowRightIcon, BellIcon, CreditCardIcon, UserIcon } from "lucide-react";
import {
  Badge,
  Button,
  Calendar,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  CurrencyInput,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  LinearProgress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  TableGrid,
  TableGridBody,
  TableGridCell,
  TableGridHead,
  TableGridHeader,
  TableGridRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from "leastui";
import { CodeBlock } from "../components/code-block";
import { GITHUB_URL } from "../components/site-header";
import { componentDocs } from "../registry";
import { Link } from "../router";

function CreateAccountCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Enter your email below to create your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="home-email">Email</FieldLabel>
            <Input id="home-email" type="email" placeholder="m@example.com" />
          </Field>
          <Field>
            <FieldLabel htmlFor="home-password">Password</FieldLabel>
            <Input id="home-password" type="password" />
            <FieldDescription>Must be at least 8 characters.</FieldDescription>
          </Field>
          <Field orientation="horizontal">
            <Checkbox id="home-terms" defaultChecked />
            <FieldLabel htmlFor="home-terms" className="font-normal">
              I agree to the terms of service
            </FieldLabel>
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => toast.success("Account created")}>
          Create account
        </Button>
      </CardFooter>
    </Card>
  );
}

function CalendarCard() {
  const [date, setDate] = useState<Date>(new Date());
  return (
    <Card className="gap-2 py-3">
      <CardContent className="flex justify-center px-2">
        <Calendar mode="single" selected={date} onSelect={(day?: Date) => day && setDate(day)} />
      </CardContent>
    </Card>
  );
}

function PaymentCard() {
  const [amount, setAmount] = useState(12500);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Send payment</CardTitle>
        <CardDescription>Digits fill from the right, like a banking app.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="home-amount">Amount</FieldLabel>
            <CurrencyInput id="home-amount" currency="USD" value={amount} onChange={setAmount} />
          </Field>
          <Field>
            <FieldLabel>Method</FieldLabel>
            <Select defaultValue="card">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Card ending 4242</SelectItem>
                <SelectItem value="bank">Bank transfer</SelectItem>
                <SelectItem value="wallet">Wallet</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <Button className="w-full">
          <CreditCardIcon />
          Pay ${(amount / 100).toFixed(2)}
        </Button>
      </CardFooter>
    </Card>
  );
}

function NotificationsCard() {
  const items = [
    { icon: BellIcon, title: "Push notifications", text: "Send alerts to this device.", on: true },
    { icon: UserIcon, title: "Mentions", text: "Only when someone mentions you.", on: false },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose what you want to hear about.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {items.map(({ icon: Icon, title, text, on }) => (
          <div key={title} className="flex items-center gap-3 rounded-lg border p-3">
            <Icon className="text-muted-foreground size-4" />
            <div className="flex-1">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-muted-foreground text-sm">{text}</p>
            </div>
            <Switch defaultChecked={on} aria-label={title} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const orders = [
  { id: "#3210", customer: "Olivia Martin", status: "Paid", amount: "$42.25" },
  { id: "#3209", customer: "Ava Johnson", status: "Pending", amount: "$74.99" },
  { id: "#3208", customer: "Liam Wilson", status: "Paid", amount: "$64.75" },
  { id: "#3207", customer: "Noah Brown", status: "Refunded", amount: "$34.50" },
];

const statusColor: Record<string, string> = {
  Paid: "var(--success)",
  Pending: "var(--warning)",
  Refunded: "var(--pending)",
};

function OrdersCard() {
  const cols = "grid-cols-[60px_1fr_116px_68px]";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent orders</CardTitle>
        <CardDescription>A sticky-header grid table with status badges.</CardDescription>
      </CardHeader>
      <CardContent>
        <TableGrid density="sm">
          <TableGridHeader>
            <TableGridRow className={cols}>
              <TableGridHead>Order</TableGridHead>
              <TableGridHead>Customer</TableGridHead>
              <TableGridHead>Status</TableGridHead>
              <TableGridHead className="justify-end">Amount</TableGridHead>
            </TableGridRow>
          </TableGridHeader>
          <TableGridBody>
            {orders.map((order) => (
              <TableGridRow key={order.id} className={cols}>
                <TableGridCell className="font-medium">{order.id}</TableGridCell>
                <TableGridCell className="truncate">{order.customer}</TableGridCell>
                <TableGridCell>
                  <Badge variant="secondary" color={statusColor[order.status]}>
                    {order.status}
                  </Badge>
                </TableGridCell>
                <TableGridCell className="justify-end">{order.amount}</TableGridCell>
              </TableGridRow>
            ))}
          </TableGridBody>
        </TableGrid>
      </CardContent>
    </Card>
  );
}

function UploadProgressCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage</CardTitle>
        <CardDescription>7.2 GB of 10 GB used.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="usage">
          <TabsList>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="syncing">Syncing</TabsTrigger>
          </TabsList>
          <TabsContent value="usage" className="pt-4">
            <LinearProgress value={72} aria-label="Storage used" />
          </TabsContent>
          <TabsContent value="syncing" className="pt-4">
            <LinearProgress aria-label="Syncing" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function Home() {
  return (
    <div className="mx-auto max-w-screen-2xl px-4 md:px-8">
      <section className="flex flex-col items-center gap-5 py-16 text-center md:py-24">
        <Link
          to="/docs/components/date-range-picker"
          className="bg-muted/60 hover:bg-muted inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors"
        >
          <Badge>New</Badge>
          Date and time range pickers
          <ArrowRightIcon className="size-3.5" />
        </Link>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance md:text-6xl">
          The least you need to build a great interface
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg text-balance">
          {componentDocs.length} accessible components built on Radix UI and Tailwind CSS
          v4. Themeable with CSS variables, dark mode included, one npm install away.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/docs/installation">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/docs/components">Browse components</Link>
          </Button>
        </div>
        <CodeBlock lang="bash" code="npm install leastui" className="mt-2 w-full max-w-xs text-left" />
      </section>

      <section className="columns-1 gap-6 pb-16 md:columns-2 xl:columns-3 [&>*]:mb-6 [&>*]:break-inside-avoid">
        <CreateAccountCard />
        <CalendarCard />
        <OrdersCard />
        <NotificationsCard />
        <PaymentCard />
        <UploadProgressCard />
      </section>

      <footer className="text-muted-foreground border-t py-8 text-center text-sm">
        Built on{" "}
        <a className="underline underline-offset-4" href="https://ui.shadcn.com" target="_blank" rel="noreferrer">
          shadcn/ui
        </a>{" "}
        and Radix UI. Source on{" "}
        <a className="underline underline-offset-4" href={GITHUB_URL} target="_blank" rel="noreferrer">
          GitHub
        </a>
        .
      </footer>
    </div>
  );
}
