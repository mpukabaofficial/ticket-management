import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { SortingState } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import TicketFilters, { ALL } from "@/components/TicketFilters";
import TicketsTable from "@/components/TicketsTable";
import type { Ticket } from "@/components/TicketsTable";
import { useDebounce } from "@/hooks/useDebounce";

export default function Tickets() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  const sortBy = sorting[0]?.id ?? "createdAt";
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";
  const status = statusFilter !== ALL ? statusFilter : undefined;
  const category = categoryFilter !== ALL ? categoryFilter : undefined;
  const search = debouncedSearch || undefined;

  const {
    data: tickets,
    isPending,
    error,
  } = useQuery({
    queryKey: ["tickets", sortBy, sortOrder, status, category, search],
    queryFn: () =>
      axios
        .get<{ tickets: Ticket[] }>(
          `${import.meta.env.VITE_API_URL}/api/tickets`,
          {
            withCredentials: true,
            params: { sortBy, sortOrder, status, category, search },
          },
        )
        .then((res) => res.data.tickets),
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

      <TicketFilters
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
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
    </div>
  );
}
