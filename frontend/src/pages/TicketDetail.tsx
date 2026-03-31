import { useState } from "react";
import { useParams, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { TicketStatus, TicketCategory } from "shared";
import type { TicketStatusType, TicketCategoryType } from "shared";
import { RiArrowLeftLine } from "@remixicon/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface Agent {
  id: string;
  name: string;
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

const UNASSIGNED = "__unassigned__";
const UNCHANGED = "__unchanged__";

function capitalize(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [selectedAgent, setSelectedAgent] = useState<string>(UNASSIGNED);
  const [selectedStatus, setSelectedStatus] = useState<string>(UNCHANGED);
  const [selectedCategory, setSelectedCategory] = useState<string>(UNCHANGED);

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

  const { data: agents } = useQuery({
    queryKey: ["agents"],
    queryFn: () =>
      axios
        .get<{ agents: Agent[] }>(
          `${import.meta.env.VITE_API_URL}/api/users/agents`,
          { withCredentials: true },
        )
        .then((res) => res.data.agents),
  });

  const assignMutation = useMutation({
    mutationFn: (userId: string) =>
      axios.patch(
        `${import.meta.env.VITE_API_URL}/api/tickets/${id}/assign`,
        { userId },
        { withCredentials: true },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket assigned");
    },
    onError: (err) => {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : "Failed to assign ticket";
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { status?: string; category?: string }) =>
      axios.patch(
        `${import.meta.env.VITE_API_URL}/api/tickets/${id}`,
        data,
        { withCredentials: true },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket updated");
    },
    onError: (err) => {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : "Failed to update ticket";
      toast.error(message);
    },
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
        <div className="grid grid-cols-[1fr_250px] gap-6">
          {/* Left column — ticket info + messages */}
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

          {/* Right column — actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Status</label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedStatus !== UNCHANGED ? selectedStatus : ticket.status}
                      onValueChange={setSelectedStatus}
                      disabled={updateMutation.isPending}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(TicketStatus).map((s) => (
                          <SelectItem key={s} value={s}>
                            {capitalize(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedStatus !== UNCHANGED && selectedStatus !== ticket.status && (
                      <Button
                        size="sm"
                        className="shrink-0 w-18"
                        disabled={updateMutation.isPending}
                        onClick={() => {
                          updateMutation.mutate({ status: selectedStatus }, {
                            onSuccess: () => setSelectedStatus(UNCHANGED),
                          });
                        }}
                      >
                        {updateMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Category</label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedCategory !== UNCHANGED ? selectedCategory : (ticket.category ?? UNCHANGED)}
                      onValueChange={setSelectedCategory}
                      disabled={updateMutation.isPending}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(TicketCategory).map((c) => (
                          <SelectItem key={c} value={c}>
                            {capitalize(c)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCategory !== UNCHANGED && selectedCategory !== (ticket.category ?? UNCHANGED) && (
                      <Button
                        size="sm"
                        className="shrink-0 w-18"
                        disabled={updateMutation.isPending}
                        onClick={() => {
                          updateMutation.mutate({ category: selectedCategory }, {
                            onSuccess: () => setSelectedCategory(UNCHANGED),
                          });
                        }}
                      >
                        {updateMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Assigned to</label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedAgent !== UNASSIGNED ? selectedAgent : (ticket.assignedTo?.id ?? UNASSIGNED)}
                      onValueChange={setSelectedAgent}
                      disabled={assignMutation.isPending}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED} disabled>
                          Unassigned
                        </SelectItem>
                        {agents?.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedAgent !== UNASSIGNED && selectedAgent !== ticket.assignedTo?.id && (
                      <Button
                        size="sm"
                        className="shrink-0 w-18"
                        disabled={assignMutation.isPending}
                        onClick={() => {
                          assignMutation.mutate(selectedAgent, {
                            onSuccess: () => setSelectedAgent(UNASSIGNED),
                          });
                        }}
                      >
                        {assignMutation.isPending ? "Assigning..." : "Assign"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
