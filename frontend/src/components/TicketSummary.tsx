import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { RiSparklingLine } from "@remixicon/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TicketSummaryProps {
  ticketId: number;
}

export default function TicketSummary({ ticketId }: TicketSummaryProps) {
  const summaryMutation = useMutation({
    mutationFn: () =>
      axios
        .post<{ summary: string }>(
          `${import.meta.env.VITE_API_URL}/api/tickets/${ticketId}/summarize`,
          {},
          { withCredentials: true },
        )
        .then((res) => res.data.summary),
    onError: (err) => {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : "Failed to generate summary";
      toast.error(message);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          disabled={summaryMutation.isPending}
          onClick={() => summaryMutation.mutate()}
        >
          <RiSparklingLine className="size-4" />
          {summaryMutation.isPending ? "Generating..." : "Summarize"}
        </Button>
        {summaryMutation.data && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {summaryMutation.data}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
