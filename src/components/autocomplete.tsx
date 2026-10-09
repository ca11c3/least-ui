"use client";

import { useId, useState } from "react";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { Badge } from "./badge";
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "./command";
import { Input } from "./input";
import { Label } from "./label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import { cn } from "../lib/utils";

export interface AutocompleteOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface AutocompleteProps {
  options: AutocompleteOption[];
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  maxVisible?: number;
  className?: string;
  buttonClassName?: string;
  popoverClassName?: string;
  onSearch?: (value: string) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

export function Autocomplete(props: AutocompleteProps) {
  const {
    options,
    label,
    placeholder = "Select an option...",
    searchPlaceholder = "Search...",
    emptyText = "No results found.",
    value,
    defaultValue,
    onValueChange,
    disabled,
    multiple = false,
    maxVisible = 3,
    className,
    buttonClassName,
    popoverClassName,
    onSearch,
    hasMore,
    onLoadMore,
    isLoading,
    readOnly,
  } = props;

  const id = useId();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [internalValue, setInternalValue] = useState<string | string[]>(
    defaultValue ?? (multiple ? [] : ""),
  );

  const selectedValue = value ?? internalValue;

  const selectedValues = Array.isArray(selectedValue)
    ? selectedValue
    : selectedValue
      ? [selectedValue]
      : [];

  const visibleItems = expanded
    ? selectedValues
    : selectedValues.slice(0, maxVisible);
  const hiddenCount = Math.max(0, selectedValues.length - maxVisible);

  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    onLoadMore: onLoadMore ?? (() => {}),
    enabled: !!onLoadMore && !!hasMore,
    isLoading,
  });

  const filteredOptions = onSearch
    ? options
    : options.filter((option) =>
        option.label.toLowerCase().includes(searchValue.toLowerCase()),
      );

  const filteredValues = filteredOptions
    .filter((o) => !o.disabled)
    .map((o) => o.value);
  const isSelectAll =
    filteredValues.length > 0 &&
    filteredValues.every((v) => selectedValues.includes(v));

  const handleSelectAll = () => {
    if (isSelectAll) {
      const nextValues = selectedValues.filter(
        (v) => !filteredValues.includes(v),
      );
      if (value === undefined) setInternalValue(nextValues);
      onValueChange?.(nextValues);
    } else {
      const nextValues = [...new Set([...selectedValues, ...filteredValues])];
      if (value === undefined) setInternalValue(nextValues);
      onValueChange?.(nextValues);
      setSearchValue("");
    }
  };

  const handleSelect = (currentValue: string) => {
    if (multiple) {
      const nextValues = selectedValues.includes(currentValue)
        ? selectedValues.filter((v) => v !== currentValue)
        : [...selectedValues, currentValue];

      if (value === undefined) {
        setInternalValue(nextValues);
      }
      onValueChange?.(nextValues);
    } else {
      const nextValue = currentValue === selectedValue ? "" : currentValue;
      if (value === undefined) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
      setOpen(false);
    }
  };

  const removeSelection = (val: string) => {
    const nextValues = selectedValues.filter((v) => v !== val);
    if (value === undefined) {
      setInternalValue(nextValues);
    }
    onValueChange?.(nextValues);
  };

  return (
    <div data-slot="autocomplete" className={cn("w-full space-y-2", className)}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Popover open={open} onOpenChange={(o) => !readOnly && setOpen(o)}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              "border-input dark:bg-input/30 focus-within-ring relative flex w-full items-center justify-between rounded-md border py-1 text-sm hover:shadow-sm",
              "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
              disabled && "pointer-events-none opacity-50",
              readOnly && "pointer-events-none",
              buttonClassName,
            )}
            onClick={() => !readOnly && setOpen(true)}
          >
            <div className="flex flex-1 scrollbar-none items-center gap-1.5 overflow-x-auto pl-2">
              {multiple && selectedValues.length > 0 ? (
                <>
                  {visibleItems.map((val) => {
                    // Fall the raw value if the option is not found
                    const option = options.find((o) => o.value === val);
                    return (
                      <Badge
                        key={val}
                        variant="secondary"
                        color="var(--pending)"
                        className="shrink-0 px-2 font-normal text-foreground"
                      >
                        {option?.label ?? val}
                        {!readOnly && (
                          <button
                            type="button"
                            className="bg-pending/50 hover:bg-pending ml-1 grid size-3 shrink-0 place-items-center rounded-full outline-none transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSelection(val);
                            }}
                          >
                            <XIcon
                              className="text-background size-2"
                              strokeWidth={3}
                            />
                          </button>
                        )}
                      </Badge>
                    );
                  })}
                  {hiddenCount > 0 && !expanded && (
                    <Badge
                      variant="outline"
                      color="var(--primary)"
                      className="shrink-0 cursor-pointer rounded-sm px-1 font-normal"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(true);
                      }}
                    >
                      +{hiddenCount} more
                    </Badge>
                  )}
                  {hiddenCount > 0 && expanded && (
                    <Badge
                      variant="outline"
                      color="var(--primary)"
                      className="shrink-0 cursor-pointer rounded-sm px-1 font-normal"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(false);
                      }}
                    >
                      Show less
                    </Badge>
                  )}
                </>
              ) : null}

              {expanded && (
                <Input
                  id={id}
                  placeholder={placeholder}
                  value={
                    open
                      ? searchValue
                      : !multiple && selectedValues.length > 0
                        ? (options.find((o) => o.value === selectedValues[0])
                            ?.label ?? "")
                        : ""
                  }
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    onSearch?.(e.target.value);
                  }}
                  onClick={(e) => {
                    if (open) {
                      e.stopPropagation();
                    }
                  }}
                  onFocus={() => {
                    setSearchValue("");
                  }}
                  disabled={disabled}
                  readOnly={readOnly}
                  className="h-7 shrink-0 border-none p-0 text-sm shadow-none hover:shadow-none focus:shadow-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-transparent"
                  autoComplete="off"
                />
              )}
            </div>

            {!multiple && !expanded && (
              <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "w-(--radix-popover-trigger-width) p-0",
            popoverClassName,
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command shouldFilter={false}>
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              {filteredOptions.length > 0 && (
                <CommandGroup>
                  <CommandItem onSelect={() => handleSelectAll()}>
                    {isSelectAll ? "Deselect All" : "Select All"}
                  </CommandItem>
                </CommandGroup>
              )}
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    onSelect={handleSelect}
                  >
                    {option.label}
                    <CheckIcon
                      className={cn(
                        "ml-auto",
                        selectedValues.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
                {hasMore && !isLoading && (
                  <div ref={sentinelRef} className="h-1" />
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default Autocomplete;
