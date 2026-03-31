import { TicketStatus, TicketCategory } from "shared";
import { RiSearchLine } from "@remixicon/react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

function capitalize(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

interface TicketFiltersProps {
  statusFilter: string;
  onStatusChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  searchInput: string;
  onSearchChange: (value: string) => void;
}

export { ALL };

export default function TicketFilters({
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  searchInput,
  onSearchChange,
}: TicketFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative">
        <RiSearchLine className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search subject or sender..."
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 w-64"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {Object.values(TicketStatus).map((s) => (
            <SelectItem key={s} value={s}>
              {capitalize(s)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={categoryFilter} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All categories</SelectItem>
          {Object.values(TicketCategory).map((c) => (
            <SelectItem key={c} value={c}>
              {capitalize(c)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
