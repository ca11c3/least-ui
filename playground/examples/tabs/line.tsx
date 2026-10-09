import { Tabs, TabsContent, TabsList, TabsTrigger } from "leastui";

export default function TabsLine() {
  return (
    <Tabs defaultValue="overview" className="w-full max-w-md">
      <TabsList variant="line">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="text-muted-foreground pt-4 text-sm">
        A summary of this week's activity.
      </TabsContent>
      <TabsContent value="analytics" className="text-muted-foreground pt-4 text-sm">
        Traffic and conversion charts.
      </TabsContent>
      <TabsContent value="reports" className="text-muted-foreground pt-4 text-sm">
        Exported reports appear here.
      </TabsContent>
    </Tabs>
  );
}
