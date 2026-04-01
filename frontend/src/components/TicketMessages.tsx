import { useState } from "react";
import { SenderType } from "shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    <Card className="rounded-2xl shadow-sm shadow-border/30">
      <CardHeader>
        <CardTitle className="font-heading text-xl" style={{ fontOpticalSizing: "auto" }}>
          Messages
          <span className="text-sm font-sans font-normal text-muted-foreground ml-2">
            ({messages.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          <div className="space-y-5">
            {hiddenCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-xl"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              >
                Show {Math.min(hiddenCount, PAGE_SIZE)} older messages
              </Button>
            )}
            {visibleMessages.map((message, i) => {
              const isAgent = message.senderType === SenderType.AGENT;
              return (
                <div key={message.id}>
                  {i > 0 && <Separator className="mb-5 opacity-40" />}
                  <div className={`rounded-2xl p-4 ${isAgent ? "bg-primary/5 border border-primary/10" : "bg-muted/60"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {message.sender}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-lg border ${
                          isAgent
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-stone-100 text-stone-600 border-stone-200"
                        }`}>
                          {capitalize(message.senderType)}
                        </span>
                        {message.isAiGenerated && (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-lg border bg-violet-50 text-violet-600 border-violet-200">
                            AI
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
