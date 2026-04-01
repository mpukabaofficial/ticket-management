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
import TicketSummary from "@/components/TicketSummary";
import type { TicketWithMessages } from "@/types/ticket";

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
        .get<{ ticket: TicketWithMessages }>(
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
        <Button variant="ghost" size="sm" className="mb-6 gap-1 text-muted-foreground hover:text-foreground rounded-xl">
          <RiArrowLeftLine className="size-4" />
          Back to tickets
        </Button>
      </Link>

      <ErrorAlert message={errorMessage} className="mb-6" />

      {isPending ? (
        <Card className="rounded-2xl shadow-sm shadow-border/30">
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
        <div className="grid grid-cols-[1fr_260px] gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <Card className="rounded-2xl shadow-sm shadow-border/30">
              <CardHeader>
                <CardTitle className="font-heading text-2xl" style={{ fontOpticalSizing: "auto" }}>
                  <span className="text-muted-foreground mr-2">#{ticket.id}</span>
                  {ticket.subject}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground mb-0.5">Sender</dt>
                    <dd className="font-medium">{ticket.senderName} ({ticket.senderEmail})</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-0.5">Created</dt>
                    <dd className="font-medium">{formatDate(ticket.createdAt)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <TicketMessages messages={ticket.messages} />
            <TicketReplyForm ticket={ticket} />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <TicketDetailsSidebar
              ticketId={id!}
              status={ticket.status}
              category={ticket.category}
              assignedTo={ticket.assignedTo}
            />
            <TicketSummary ticketId={ticket.id} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
