import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { RiSparklingLine } from "@remixicon/react";
import { createMessageSchema } from "shared";
import type { CreateMessageInput } from "shared";
import type { Ticket } from "@/types/ticket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

interface TicketReplyFormProps {
  ticket: Ticket;
}

export default function TicketReplyForm({ ticket }: TicketReplyFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<CreateMessageInput>({
    resolver: zodResolver(createMessageSchema),
    defaultValues: { body: "" },
  });

  const polishMutation = useMutation({
    mutationFn: (body: string) =>
      axios
        .post<{ polished: string }>(
          `${import.meta.env.VITE_API_URL}/api/tickets/polish`,
          { body, customerName: ticket.senderName },
          { withCredentials: true },
        )
        .then((res) => res.data.polished),
    onSuccess: (polished) => {
      form.setValue("body", polished, { shouldValidate: true });
      toast.success("Reply polished");
    },
    onError: (err) => {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : "Failed to polish reply";
      toast.error(message);
    },
  });

  const replyMutation = useMutation({
    mutationFn: (data: CreateMessageInput) =>
      axios.post(
        `${import.meta.env.VITE_API_URL}/api/tickets/${ticket.id}/messages`,
        data,
        { withCredentials: true },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", String(ticket.id)] });
      form.reset();
      toast.success("Reply sent");
    },
    onError: (err) => {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : "Failed to send reply";
      toast.error(message);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Reply</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit((data) => replyMutation.mutate(data))} className="space-y-4">
          <Controller
            control={form.control}
            name="body"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <Textarea
                  {...field}
                  id={field.name}
                  placeholder="Type your reply..."
                  rows={4}
                  disabled={replyMutation.isPending}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={polishMutation.isPending || replyMutation.isPending || !form.watch("body").trim()}
              onClick={() => polishMutation.mutate(form.getValues("body"))}
            >
              <RiSparklingLine className="size-4" />
              {polishMutation.isPending ? "Polishing..." : "Polish"}
            </Button>
            <Button type="submit" disabled={replyMutation.isPending || polishMutation.isPending || !form.watch("body").trim()}>
              {replyMutation.isPending ? "Sending..." : "Send Reply"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
