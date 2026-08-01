"use client";

import { CalendarBlank, X } from "@phosphor-icons/react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import { Popover } from "radix-ui";
import { Button } from "./button";

type DatePickerProps = {
  date?: Date;
  onChange: (date?: Date) => void;
};

export function DatePicker({ date, onChange }: DatePickerProps) {
  return (
    <Popover.Root>
      <div className="date-filter">
        <Popover.Trigger asChild>
          <Button variant="outline" className="date-filter-trigger" aria-label="Filter surveys by creation date">
            <CalendarBlank data-icon="inline-start" size={17} />
            {date ? format(date, "dd MMM yyyy") : "Created date"}
          </Button>
        </Popover.Trigger>
        {date && <Button variant="ghost" size="icon-xs" className="date-filter-clear" aria-label="Clear creation date filter" onClick={() => onChange(undefined)}><X size={14} /></Button>}
      </div>
      <Popover.Portal>
        <Popover.Content className="date-picker-popover" align="start" sideOffset={8}>
          <DayPicker mode="single" selected={date} onSelect={onChange} captionLayout="dropdown" />
          <Popover.Arrow className="date-picker-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
