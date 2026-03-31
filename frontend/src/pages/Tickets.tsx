import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { SortingState } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import TicketFilters, { ALL } from "@/components/TicketFilters";
import TicketsTable from "@/components/TicketsTable";
import type { Ticket } from "@/components/TicketsTable";
import { useDebounce } from "@/hooks/useDebounce";

const PAGE_SIZE = 10;

interface TicketsResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  pageSize: number;
}

export default function Tickets() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchInput, 300);

  const sortBy = sorting[0]?.id ?? "createdAt";
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";
  const status = statusFilter !== ALL ? statusFilter : undefined;
  const category = categoryFilter !== ALL ? categoryFilter : undefined;
  const search = debouncedSearch || undefined;

  const { data, isPending, error } = useQuery({
    queryKey: ["tickets", sortBy, sortOrder, status, category, search, page],
    queryFn: () =>
      axios
        .get<TicketsResponse>(
          `${import.meta.env.VITE_API_URL}/api/tickets`,
          {
            withCredentials: true,
            params: {
              sortBy,
              sortOrder,
              status,
              category,
              search,
              page,
              pageSize: PAGE_SIZE,
            },
          },
        )
        .then((res) => res.data),
  });

  const tickets = data?.tickets;
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Reset to page 1 when filters change
  function handleStatusChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }
  function handleCategoryChange(value: string) {
    setCategoryFilter(value);
    setPage(1);
  }
  function handleSearchChange(value: string) {
    setSearchInput(value);
    setPage(1);
  }

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

      <TicketFilters
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        categoryFilter={categoryFilter}
        onCategoryChange={handleCategoryChange}
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
      />

      <Card>
        <CardContent className="p-0">
          <TicketsTable
            tickets={tickets}
            isPending={isPending}
            sorting={sorting}
            onSortingChange={setSorting}
          />
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
