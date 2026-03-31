import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { TicketStatus } from "shared";
import type { TicketStatusType, TicketCategoryType } from "shared";
import { RiArrowLeftLine } from "@remixicon/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  body: string;
  sender: string;
  createdAt: string;
}

interface TicketDetail {
  id: number;
  subject: string;
  body: string;
  status: TicketStatusType;
  category: TicketCategoryType | null;
  senderEmail: string;
  senderName: string;
  createdAt: string;
  assignedTo: { id: string; name: string } | null;
  messages: Message[];
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
        .get<{ ticket: TicketDetail }>(
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

      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

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
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-xl">
                  <span className="text-muted-foreground mr-2">#{ticket.id}</span>
                  {ticket.subject}
                </CardTitle>
                <div className="flex items-center gap-2 shrink-0">
                  {ticket.category && (
                    <Badge variant="secondary">{ticket.category}</Badge>
                  )}
                  <Badge variant={statusVariant(ticket.status)}>
                    {ticket.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Sender</dt>
                  <dd>{ticket.senderName} ({ticket.senderEmail})</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Assigned to</dt>
                  <dd>{ticket.assignedTo?.name ?? "Unassigned"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{formatDate(ticket.createdAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Messages</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              ) : (
                <div className="space-y-4">
                  {ticket.messages.map((message, i) => (
                    <div key={message.id}>
                      {i > 0 && <Separator className="mb-4" />}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {message.sender}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {message.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
