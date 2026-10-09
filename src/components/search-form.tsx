import { Search, X } from "lucide-react";

import { Label } from "./label";
import { Input } from "./input";
import { cn } from "../lib/utils";
import { useId, useState } from "react";

interface SearchFormProps extends Omit<
  React.ComponentProps<"form">,
  "onChange"
> {
  placeholder?: string;
  onChange?: (value: string) => void;
  value?: string;
  clearable?: boolean;
  onClear?: () => void;
  inputClassName?: string;
  containerClassName?: string;
}

export function SearchForm({
  placeholder = "Search...",
  onChange,
  value,
  clearable = true,
  onClear,
  inputClassName,
  containerClassName,
  className,
  onSubmit,
  ...props
}: SearchFormProps) {
  const inputId = useId();
  const [internalValue, setInternalValue] = useState("");
  const searchValue = value ?? internalValue;

  const handleClear = () => {
    if (value === undefined) setInternalValue("");
    onClear?.();
    onChange?.("");
  };

  const handleChange = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);
  };

  return (
    <form
      {...props}
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(event);
      }}
    >
      <div className={cn("relative", containerClassName)}>
        <Label htmlFor={inputId} className="sr-only">
          Search
        </Label>
        <Input
          id={inputId}
          type="text"
          placeholder={placeholder}
          className={cn("focus-ring pl-8 pr-8", inputClassName)}
          onChange={(event) => handleChange(event.target.value)}
          value={searchValue}
        />
        <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
        {clearable && searchValue && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={handleClear}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </form>
  );
}
