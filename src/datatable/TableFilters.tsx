"use client";

import { cn } from "../lib/utils";
import { useForm, type DeepValue } from "@tanstack/react-form";
import { Filter, Info, X } from "lucide-react";
import React, { ReactNode } from "react";
import { DateRange } from "react-day-picker";
import { Autocomplete } from "../components/autocomplete";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { DatePicker } from "../datetime/date-picker";
import { DateRangePicker } from "../datetime/date-rangepicker";
import { DateTimePicker } from "../datetime/datetime-picker";
import { DateTimeRangePicker } from "../datetime/datetime-rangepicker";
import { Input, MultiInput } from "../components/input";
import { ListValuesInput } from "../components/list-values-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/select";
import { Separator } from "../components/separator";
import { FieldError } from "../components/field";
import { Popover, PopoverContent, PopoverTrigger } from "../components/popover";

export type FilterField<TFieldKey extends string = string> = {
  key: TFieldKey;
  label: string;
  placeholder?: string;
  regexPattern?: string;
  validate?: (value: unknown) => string | undefined;
  extraInfo?: boolean;
  renderExtraInfo?: () => ReactNode;
} & (
  | { type: "text" | "datePicker" | "dateTimePicker" }
  | { type: "multiInput"; maxLength?: number }
  | {
      // Typed values or a CSV upload; takes the full width of the panel.
      type: "listValues";
      maxLength?: number;
      csvHasHeader?: boolean;
      csvColumn?: number;
    }
  | { type: "select"; options: Array<{ label: string; value: string }> }
  | {
      type: "autocomplete";
      multiple?: boolean;
      options?: Array<{ label: string; value: string }>;
      render?: (
        value: string[],
        onChange: (ids: string[]) => void,
      ) => ReactNode;
    }
  | { type: "dateRangePicker"; format?: { from: string; to: string } }
  | { type: "dateTimeRangePicker"; format?: { from: string; to: string } }
);

export type FilterFieldType = FilterField["type"];

export interface FilterPanelProps<T extends object> {
  /** Filter configuration */
  fields: FilterField<Extract<keyof T, string>>[];
  /** Applied filters used as form defaults */
  values: T;
  /** Whether filters panel is visible */
  isOpen: boolean;
  /** Called when apply button is clicked */
  onApply: (values: T) => void;
  /** Called when cancel button is clicked */
  onCancel: () => void;
}

export interface FilterButtonProps<T extends object> {
  /** Currently applied filters */
  appliedFilters: T;
  /** Called when clear button is clicked */
  onClear: () => void;
  /** Called when filters toggle is clicked */
  onToggle: () => void;
  /** Keys to exclude from the active filter count (e.g. keys controlled by tabs) */
  excludeFromCount?: (keyof T & string)[];
}

function getActiveFilterCount<T extends object>(
  filters: T,
  excludeKeys?: string[],
) {
  const activeEntries = Object.entries(
    filters as Record<string, unknown>,
  ).filter(([key, value]) => {
    if (excludeKeys?.includes(key)) return false;
    if (value === null || value === undefined) return false;
    if (typeof value === "string")
      return value.trim() !== "" && value !== "All";
    if (Array.isArray(value))
      return value.length > 0 && !(value.length === 1 && value[0] === "");
    if (typeof value === "object" && "from" in value && "to" in value) {
      const range = value as { from?: unknown; to?: unknown };
      return !!range.from && !!range.to;
    }
    return true;
  });
  return activeEntries.length;
}

export function FilterButton<T extends object>({
  appliedFilters,
  onClear,
  onToggle,
  excludeFromCount,
}: FilterButtonProps<T>) {
  const activeFilterCount = getActiveFilterCount(
    appliedFilters,
    excludeFromCount,
  );
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="flex h-full w-full items-center justify-between">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full">
          <Button variant="outline" onClick={onToggle} className="gap-2">
            <Filter className="size-4" />
            Filters
          </Button>
          {hasActiveFilters && (
            <div className="absolute -top-2 -right-2">
              <Badge
                variant="default"
                className="h-5 min-w-5 px-1 text-xs tabular-nums"
              >
                {activeFilterCount}
              </Badge>
            </div>
          )}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            color="var(--destructive)"
            size="sm"
            onClick={onClear}
          >
            <X className="mr-1 size-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

export function FilterPanel<T extends object>({
  fields,
  values,
  isOpen,
  onApply,
  onCancel,
}: FilterPanelProps<T>) {
  const form = useForm({
    defaultValues: values,
    onSubmit: ({ value }) => {
      onApply(value);
    },
  });

  React.useEffect(() => {
    form.reset(values);
  }, [form, values]);

  function fieldValidators(field: FilterField<Extract<keyof T, string>>) {
    if (!field.validate) return undefined;
    return {
      onChange: ({ value }: { value: unknown }) => field.validate!(value),
    };
  }

  function renderErrors(errors: unknown[]) {
    if (!errors.length) return null;
    return (
      <FieldError
        errors={errors.map((e) => ({
          message: typeof e === "string" ? e : (e as Error)?.message,
        }))}
      />
    );
  }

  const renderField = (field: FilterField<Extract<keyof T, string>>) => {
    const fieldName = field.key as Extract<keyof T, string>;
    const validators = fieldValidators(field);

    if (field.type === "autocomplete") {
      return (
        <form.Field key={field.key} name={fieldName} validators={validators}>
          {(fieldApi) => {
            const isMultiple =
              field.multiple ?? Array.isArray(fieldApi.state.value);
            return (
              <>
                {field.render ? (
                  field.render(
                    (fieldApi.state.value as string[]) || [],
                    (newValue) =>
                      fieldApi.handleChange(
                        newValue as DeepValue<T, Extract<keyof T, string>>,
                      ),
                  )
                ) : (
                  <Autocomplete
                    {...(isMultiple
                      ? {
                          multiple: true,
                          value: (fieldApi.state.value as string[]) || [],
                          onValueChange: (newValue) => {
                            fieldApi.handleChange(
                              newValue as DeepValue<
                                T,
                                Extract<keyof T, string>
                              >,
                            );
                          },
                        }
                      : {
                          multiple: false,
                          value: (fieldApi.state.value as string) || "",
                          onValueChange: (newValue) => {
                            fieldApi.handleChange(
                              newValue as DeepValue<
                                T,
                                Extract<keyof T, string>
                              >,
                            );
                          },
                        })}
                    options={[...(field.options || [])]}
                    placeholder={field.placeholder || "Type to search..."}
                    buttonClassName="h-10"
                  />
                )}
                {renderErrors(fieldApi.state.meta.errors)}
              </>
            );
          }}
        </form.Field>
      );
    }

    if (field.type === "multiInput") {
      return (
        <form.Field key={field.key} name={fieldName} validators={validators}>
          {(fieldApi) => (
            <>
              <MultiInput
                value={(fieldApi.state.value as string[]) || []}
                onValueChange={(newValue) => {
                  fieldApi.handleChange(
                    newValue as DeepValue<T, Extract<keyof T, string>>,
                  );
                }}
                placeholder={field.placeholder || "Type to search..."}
                className="h-10"
                maxLength={field.maxLength}
                pattern={field.regexPattern}
              />
              {renderErrors(fieldApi.state.meta.errors)}
            </>
          )}
        </form.Field>
      );
    }

    if (field.type === "listValues") {
      return (
        <form.Field key={field.key} name={fieldName} validators={validators}>
          {(fieldApi) => (
            <>
              <ListValuesInput
                value={(fieldApi.state.value as string[]) || []}
                onValueChange={(newValue) => {
                  fieldApi.handleChange(
                    newValue as DeepValue<T, Extract<keyof T, string>>,
                  );
                }}
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                pattern={field.regexPattern}
                csvHasHeader={field.csvHasHeader}
                csvColumn={field.csvColumn}
              />
              {renderErrors(fieldApi.state.meta.errors)}
            </>
          )}
        </form.Field>
      );
    }

    if (field.type === "datePicker") {
      return (
        <form.Field key={field.key} name={fieldName} validators={validators}>
          {(fieldApi) => (
            <>
              <DatePicker
                value={fieldApi.state.value as string}
                onValueChange={(newValue) => {
                  fieldApi.handleChange(
                    newValue as DeepValue<T, Extract<keyof T, string>>,
                  );
                }}
                format="YYYY-MM-DD"
              />
              {renderErrors(fieldApi.state.meta.errors)}
            </>
          )}
        </form.Field>
      );
    }

    if (field.type === "dateTimePicker") {
      return (
        <form.Field key={field.key} name={fieldName} validators={validators}>
          {(fieldApi) => (
            <>
              <DateTimePicker
                value={fieldApi.state.value as string}
                onValueChange={(newValue) => {
                  fieldApi.handleChange(
                    newValue as DeepValue<T, Extract<keyof T, string>>,
                  );
                }}
                format="YYYY-MM-DD hh:mm A"
              />
              {renderErrors(fieldApi.state.meta.errors)}
            </>
          )}
        </form.Field>
      );
    }

    if (field.type === "dateRangePicker") {
      return (
        <form.Field key={field.key} name={fieldName} validators={validators}>
          {(fieldApi) => (
            <>
              <DateRangePicker
                value={fieldApi.state.value as DateRange | undefined}
                onValueChange={(newValue) => {
                  fieldApi.handleChange(
                    newValue as DeepValue<T, Extract<keyof T, string>>,
                  );
                }}
                format={
                  field.format ?? { from: "YYYY/MM/DD", to: "YYYY/MM/DD" }
                }
              />
              {renderErrors(fieldApi.state.meta.errors)}
            </>
          )}
        </form.Field>
      );
    }

    if (field.type === "dateTimeRangePicker") {
      return (
        <form.Field key={field.key} name={fieldName} validators={validators}>
          {(fieldApi) => (
            <>
              <DateTimeRangePicker
                value={fieldApi.state.value as DateRange | undefined}
                onValueChange={(newValue) => {
                  fieldApi.handleChange(
                    newValue as DeepValue<T, Extract<keyof T, string>>,
                  );
                }}
                format={
                  field.format ?? {
                    from: "YYYY/MM/DD hh:mm A",
                    to: "YYYY/MM/DD hh:mm A",
                  }
                }
              />
              {renderErrors(fieldApi.state.meta.errors)}
            </>
          )}
        </form.Field>
      );
    }

    if (field.type === "select") {
      return (
        <form.Field key={field.key} name={fieldName} validators={validators}>
          {(fieldApi) => (
            <>
              <Select
                value={(fieldApi.state.value as string) || ""}
                onValueChange={(value) => {
                  fieldApi.handleChange(
                    value as DeepValue<T, Extract<keyof T, string>>,
                  );
                }}
              >
                <SelectTrigger className="w-full data-[size=default]:h-10">
                  <SelectValue placeholder={field.placeholder || "Select..."} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {renderErrors(fieldApi.state.meta.errors)}
            </>
          )}
        </form.Field>
      );
    }

    return (
      <form.Field key={field.key} name={fieldName} validators={validators}>
        {(fieldApi) => (
          <>
            <Input
              className="focus-ring h-10 w-full"
              value={
                typeof fieldApi.state.value === "string"
                  ? fieldApi.state.value
                  : fieldApi.state.value == null
                    ? ""
                    : String(fieldApi.state.value)
              }
              onChange={(event) =>
                fieldApi.handleChange(event.target.value as never)
              }
              placeholder={field.placeholder || "Search..."}
            />
            {renderErrors(fieldApi.state.meta.errors)}
          </>
        )}
      </form.Field>
    );
  };

  return (
    <div>
      {isOpen ? <Separator className="border-border mt-4" /> : null}

      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              form.handleSubmit();
            }}
            className="border-input space-y-4 px-6 pt-6"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fields.map((field) => (
                <div
                  key={field.key}
                  className={cn(
                    "min-w-0",
                    field.type === "listValues" && "col-span-full",
                  )}
                >
                  <div className="mb-2 flex items-center gap-1">
                    <label className="text-sm font-medium">{field.label}</label>
                    {field.extraInfo && field.renderExtraInfo && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Info className="size-3.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 text-sm whitespace-pre-line">
                          {field.renderExtraInfo()}
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  {renderField(field)}
                </div>
              ))}
            </div>

            <div className="flex justify-start gap-2 pb-2">
              <Button type="submit">Apply</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset(values);
                  onCancel();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
