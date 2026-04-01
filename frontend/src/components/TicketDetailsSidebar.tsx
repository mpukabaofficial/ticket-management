import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { AgentVisibleStatuses, TicketCategory } from "shared";
import type { TicketStatusType, TicketCategoryType } from "shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Agent {
  id: string;
  name: string;
}

interface TicketDetailsSidebarProps {
  ticketId: string;
  status: TicketStatusType;
  category: TicketCategoryType | null;
  assignedTo: { id: string; name: string } | null;
}

const UNASSIGNED = "__unassigned__";
const UNCHANGED = "__unchanged__";

function capitalize(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export default function TicketDetailsSidebar({
  ticketId,
  status,
  category,
  assignedTo,
}: TicketDetailsSidebarProps) {
  const queryClient = useQueryClient();

  const [selectedAgent, setSelectedAgent] = useState<string>(UNASSIGNED);
  const [selectedStatus, setSelectedStatus] = useState<string>(UNCHANGED);
  const [selectedCategory, setSelectedCategory] = useState<string>(UNCHANGED);

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
        `${import.meta.env.VITE_API_URL}/api/tickets/${ticketId}/assign`,
        { userId },
        { withCredentials: true },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
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
        `${import.meta.env.VITE_API_URL}/api/tickets/${ticketId}`,
        data,
        { withCredentials: true },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">Status</label>
          <div className="flex items-center gap-2">
            <Select
              value={selectedStatus !== UNCHANGED ? selectedStatus : status}
              onValueChange={setSelectedStatus}
              disabled={updateMutation.isPending}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AgentVisibleStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {capitalize(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStatus !== UNCHANGED && selectedStatus !== status && (
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
              value={selectedCategory !== UNCHANGED ? selectedCategory : (category ?? UNCHANGED)}
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
            {selectedCategory !== UNCHANGED && selectedCategory !== (category ?? UNCHANGED) && (
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
              value={selectedAgent !== UNASSIGNED ? selectedAgent : (assignedTo?.id ?? UNASSIGNED)}
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
            {selectedAgent !== UNASSIGNED && selectedAgent !== assignedTo?.id && (
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
  );
}
