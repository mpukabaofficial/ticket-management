import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  RiTicketLine,
  RiErrorWarningLine,
  RiRobotLine,
  RiTimeLine,
} from "@remixicon/react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ErrorAlert";
import type { TicketStats } from "@/types/ticket";

function formatDuration(ms: number) {
  if (ms <= 0) return "N/A";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

function formatChartDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const chartConfig = {
  ai: {
    label: "AI",
    color: "var(--chart-1)",
  },
  agent: {
    label: "Agent",
    color: "var(--chart-2)",
  },
  unresolved: {
    label: "Unresolved",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const statCards = [
  {
    key: "totalTickets" as const,
    label: "Total Tickets",
    icon: RiTicketLine,
  },
  {
    key: "openTickets" as const,
    label: "Open Tickets",
    icon: RiErrorWarningLine,
  },
  {
    key: "aiResolvedTickets" as const,
    label: "Resolved by AI",
    icon: RiRobotLine,
    format: (stats: TicketStats) =>
      `${stats.aiResolvedTickets} (${stats.aiResolvedPercentage}%)`,
  },
  {
    key: "avgResolutionTimeMs" as const,
    label: "Avg Resolution Time",
    icon: RiTimeLine,
    format: (stats: TicketStats) => formatDuration(stats.avgResolutionTimeMs),
  },
];

export default function Dashboard() {
  const { data, isPending, error } = useQuery({
    queryKey: ["ticket-stats"],
    queryFn: () =>
      axios
        .get<TicketStats>(
          `${import.meta.env.VITE_API_URL}/api/tickets/stats`,
          { withCredentials: true },
        )
        .then((res) => res.data),
  });

  const errorMessage = error
    ? axios.isAxiosError(error)
      ? error.response?.data?.error || error.message
      : "Failed to fetch stats"
    : null;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">Dashboard</h1>

      <ErrorAlert message={errorMessage} className="mb-6" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ key, label, icon: Icon, format }) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isPending ? (
                <Skeleton className="h-8 w-20" />
              ) : data ? (
                <p className="text-2xl font-bold">
                  {format ? format(data) : data[key]}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Tickets by Day</CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <Skeleton className="h-64 w-full" />
          ) : data?.dailyResolutions.length ? (
            <ChartContainer config={chartConfig}>
              <BarChart accessibilityLayer data={data.dailyResolutions}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={formatChartDate}
                />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="ai"
                  stackId="a"
                  fill="var(--color-ai)"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="agent"
                  stackId="a"
                  fill="var(--color-agent)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="unresolved"
                  stackId="a"
                  fill="var(--color-unresolved)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No tickets yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
