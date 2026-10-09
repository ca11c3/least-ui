import { Tabs, TabsContent, TabsList, TabsTrigger, cn } from "leastui";
import type { Example } from "../registry";
import { CodeBlock } from "./code-block";

export function ComponentPreview({
  example,
  className,
}: {
  example: Example;
  className?: string;
}) {
  const { Component, code } = example;

  return (
    <Tabs defaultValue="preview" className={cn("gap-3", className)}>
      <TabsList variant="line">
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
      </TabsList>
      <TabsContent value="preview">
        <div className="bg-background flex min-h-[340px] w-full items-center justify-center rounded-lg border p-6 sm:p-10">
          <Component />
        </div>
      </TabsContent>
      <TabsContent value="code">
        <CodeBlock code={code} />
      </TabsContent>
    </Tabs>
  );
}
