import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
} from "@tanstack/react-table";
import { TicketStatus } from "shared";
import type { TicketStatusType, TicketCategoryType } from "shared";
import {
  RiArrowUpSLine,
  RiArrowDownSLine,
  RiArrowUpDownLine,
} from "@remixicon/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export interface Ticket {
  id: number;
  subject: string;
  body: string;
  status: TicketStatusType;
  category: TicketCategoryType | null;
  senderEmail: string;
  senderName: string;
  createdAt: string;
  assignedTo: { id: string; name: string } | null;
}

function statusVariant(status: TicketStatusType) {
  switch (status) {
    case TicketStatus.OPEN:
      return "default";
    case TicketStatus.RESOLVED:
      return "secondary";
    case TicketStatus.CLOSED:
      return "outline";
  }
}

const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "id",
    header: "#",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue("id")}</span>
    ),
  },
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("subject")}</span>
    ),
  },
  {
    accessorKey: "senderName",
    header: "Sender",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.getValue("senderName")}
      </span>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.getValue("category") as string | null;
      return category ? (
        <Badge variant="secondary">{category}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={statusVariant(row.getValue("status"))}>
        {row.getValue("status") as string}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {new Date(row.getValue("createdAt") as string).toLocaleDateString(
          undefined,
          { year: "numeric", month: "short", day: "numeric" },
        )}
      </span>
    ),
  },
];

interface TicketsTableProps {
  tickets: Ticket[] | undefined;
  isPending: boolean;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
}

export default function TicketsTable({
  tickets,
  isPending,
  sorting,
  onSortingChange,
}: TicketsTableProps) {
  const table = useReactTable({
    data: tickets ?? [],
    columns,
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    enableMultiSort: false,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isPending) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Sender</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-48" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (tickets?.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No tickets found.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                className={
                  header.column.getCanSort()
                    ? "cursor-pointer select-none"
                    : ""
                }
                onClick={header.column.getToggleSortingHandler()}
              >
                <div className="flex items-center gap-1">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                  {header.column.getIsSorted() === "asc" && (
                    <RiArrowUpSLine className="size-4" />
                  )}
                  {header.column.getIsSorted() === "desc" && (
                    <RiArrowDownSLine className="size-4" />
                  )}
                  {header.column.getCanSort() &&
                    !header.column.getIsSorted() && (
                      <RiArrowUpDownLine className="size-4 text-muted-foreground/50" />
                    )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(
                  cell.column.columnDef.cell,
                  cell.getContext(),
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
