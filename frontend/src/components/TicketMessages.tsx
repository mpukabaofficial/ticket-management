import { useState } from "react";
import { SenderType } from "shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TicketWithMessages } from "@/types/ticket";

const PAGE_SIZE = 5;

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function capitalize(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

interface TicketMessagesProps {
  messages: TicketWithMessages["messages"];
}

export default function TicketMessages({ messages }: TicketMessagesProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const hiddenCount = Math.max(messages.length - visibleCount, 0);
  const visibleMessages = messages.slice(hiddenCount);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Messages
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({messages.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          <div className="space-y-4">
            {hiddenCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              >
                Show {Math.min(hiddenCount, PAGE_SIZE)} older messages
              </Button>
            )}
            {visibleMessages.map((message, i) => (
              <div key={message.id}>
                {i > 0 && <Separator className="mb-4" />}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {message.sender}
                    </span>
                    <Badge
                      variant={
                        message.senderType === SenderType.AGENT
                          ? "default"
                          : "secondary"
                      }
                    >
                      {capitalize(message.senderType)}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(message.createdAt)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.body}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
