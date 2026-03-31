import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { TicketStatus } from "shared";
import type { TicketStatusType, TicketCategoryType } from "shared";
import {
  RiArrowUpSLine,
  RiArrowDownSLine,
  RiArrowUpDownLine,
} from "@remixicon/react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Ticket {
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

export default function Tickets() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const sortBy = sorting[0]?.id ?? "createdAt";
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  const {
    data: tickets,
    isPending,
    error,
  } = useQuery({
    queryKey: ["tickets", sortBy, sortOrder],
    queryFn: () =>
      axios
        .get<{ tickets: Ticket[] }>(
          `${import.meta.env.VITE_API_URL}/api/tickets`,
          {
            withCredentials: true,
            params: { sortBy, sortOrder },
          },
        )
        .then((res) => res.data.tickets),
  });

  const table = useReactTable({
    data: tickets ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true,
    enableMultiSort: false,
    getCoreRowModel: getCoreRowModel(),
  });

  const errorMessage = error
    ? axios.isAxiosError(error)
      ? error.response?.data?.error || error.message
      : "Failed to fetch tickets"
    : null;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">Tickets</h1>

      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-0">
          {isPending ? (
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
          ) : tickets?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No tickets found.
            </p>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
