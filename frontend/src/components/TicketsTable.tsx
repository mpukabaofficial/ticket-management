import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
} from "@tanstack/react-table";
import { TicketStatus } from "shared";
import type { TicketStatusType } from "shared";
import { Link } from "react-router";
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
import { Skeleton } from "@/components/ui/skeleton";
import type { Ticket } from "@/types/ticket";

function StatusBadge({ status }: { status: TicketStatusType }) {
  const styles: Record<string, string> = {
    [TicketStatus.OPEN]: "bg-primary/10 text-primary border-primary/20",
    [TicketStatus.RESOLVED]: "bg-emerald-50 text-emerald-700 border-emerald-200",
    [TicketStatus.CLOSED]: "bg-muted text-muted-foreground border-border",
  };
  const cls = styles[status] ?? "bg-muted text-muted-foreground border-border";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-xl border ${cls}`}>
      {status}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    TECHNICAL: "bg-sky-50 text-sky-700 border-sky-200",
    REFUND: "bg-amber-50 text-amber-700 border-amber-200",
    GENERAL: "bg-stone-100 text-stone-600 border-stone-200",
  };
  const cls = styles[category] ?? "bg-stone-100 text-stone-600 border-stone-200";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-xl border ${cls}`}>
      {category}
    </span>
  );
}

const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "id",
    header: "#",
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">{row.getValue("id")}</span>
    ),
  },
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => (
      <Link
        to={`/tickets/${row.original.id}`}
        className="font-medium text-foreground hover:text-primary transition-colors"
      >
        {row.getValue("subject")}
      </Link>
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
        <CategoryBadge category={category} />
      ) : (
        <span className="text-muted-foreground/40">—</span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge status={row.getValue("status")} />
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">
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
      <p className="text-sm text-muted-foreground text-center py-10">
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
                    <RiArrowUpSLine className="size-4 text-primary" />
                  )}
                  {header.column.getIsSorted() === "desc" && (
                    <RiArrowDownSLine className="size-4 text-primary" />
                  )}
                  {header.column.getCanSort() &&
                    !header.column.getIsSorted() && (
                      <RiArrowUpDownLine className="size-4 text-muted-foreground/30" />
                    )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} className="hover:bg-accent/50 transition-colors">
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
