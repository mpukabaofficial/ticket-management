import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { createMessageSchema } from "shared";
import type { CreateMessageInput } from "shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

interface TicketReplyFormProps {
  ticketId: string;
}

export default function TicketReplyForm({ ticketId }: TicketReplyFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<CreateMessageInput>({
    resolver: zodResolver(createMessageSchema),
    defaultValues: { body: "" },
  });

  const replyMutation = useMutation({
    mutationFn: (data: CreateMessageInput) =>
      axios.post(
        `${import.meta.env.VITE_API_URL}/api/tickets/${ticketId}/messages`,
        data,
        { withCredentials: true },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
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
                <FieldLabel htmlFor={field.name}>Message</FieldLabel>
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
          <div className="flex justify-end">
            <Button type="submit" disabled={replyMutation.isPending}>
              {replyMutation.isPending ? "Sending..." : "Send Reply"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
