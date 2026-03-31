import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { RiArrowLeftLine } from "@remixicon/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Button } from "@/components/ui/button";
import TicketMessages from "@/components/TicketMessages";
import TicketReplyForm from "@/components/TicketReplyForm";
import TicketDetailsSidebar from "@/components/TicketDetailsSidebar";
import type { Ticket } from "@/types/ticket";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TicketDetailPage() {
  const { id } = useParams();

  const { data: ticket, isPending, error } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () =>
      axios
        .get<{ ticket: Ticket }>(
          `${import.meta.env.VITE_API_URL}/api/tickets/${id}`,
          { withCredentials: true },
        )
        .then((res) => res.data.ticket),
  });

  const errorMessage = error
    ? axios.isAxiosError(error)
      ? error.response?.data?.error || error.message
      : "Failed to fetch ticket"
    : null;

  return (
    <div>
      <Link to="/tickets">
        <Button variant="ghost" size="sm" className="mb-4 gap-1">
          <RiArrowLeftLine className="size-4" />
          Back to tickets
        </Button>
      </Link>

      <ErrorAlert message={errorMessage} className="mb-6" />

      {isPending ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ) : ticket ? (
        <div className="grid grid-cols-[1fr_250px] gap-6">
          {/* Left column — ticket info + messages + reply */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  <span className="text-muted-foreground mr-2">#{ticket.id}</span>
                  {ticket.subject}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Sender</dt>
                    <dd>{ticket.senderName} ({ticket.senderEmail})</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Created</dt>
                    <dd>{formatDate(ticket.createdAt)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <TicketMessages messages={ticket.messages} />
            <TicketReplyForm ticketId={id!} />
          </div>

          {/* Right column — actions */}
          <div className="space-y-6">
            <TicketDetailsSidebar
              ticketId={id!}
              status={ticket.status}
              category={ticket.category}
              assignedTo={ticket.assignedTo}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
