/**
 * MultiSelect — 可多選的下拉框組件
 * 基於 Popover + Command + Checkbox 實現
 */
import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  maxDisplay?: number;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "請選擇...",
  searchPlaceholder = "搜尋...",
  emptyText = "無匹配選項",
  className,
  maxDisplay = 3,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectedLabels = selected.map((v) => {
    const opt = options.find((o) => o.value === v);
    return opt ? opt.label : v;
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal h-auto min-h-9",
            !selected.length && "text-muted-foreground",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1 items-center">
            {selected.length === 0 ? (
              <span>{placeholder}</span>
            ) : selected.length <= maxDisplay ? (
              selected.map((v, i) => (
                <Badge
                  key={v}
                  className="text-xs px-2 py-0.5 h-5 gap-1 bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300 rounded-md"
                >
                  {selectedLabels[i]}
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-0.5 hover:text-red-500 cursor-pointer"
                    onClick={(e) => handleRemove(v, e)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRemove(v, e as any);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))
            ) : (
              <Badge className="text-xs px-2 py-0.5 h-5 bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300 rounded-md">
                已選 {selected.length} 項
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {selected.length > 0 && (
              <span
                role="button"
                tabIndex={0}
                className="hover:text-destructive cursor-pointer p-0.5"
                onClick={handleClearAll}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleClearAll(e as any);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = selected.includes(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => handleToggle(opt.value)}
                    className="cursor-pointer"
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <span>{opt.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
