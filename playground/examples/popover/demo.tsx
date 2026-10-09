import { Button, Input, Label, Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "leastui";

export default function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>Set the dimensions for the layer.</PopoverDescription>
        </PopoverHeader>
        <div className="mt-4 grid gap-3">
          {[
            ["width", "100%"],
            ["height", "25px"],
          ].map(([name, value]) => (
            <div key={name} className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor={`popover-${name}`} className="capitalize">
                {name}
              </Label>
              <Input id={`popover-${name}`} defaultValue={value} className="col-span-2 h-8" />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
