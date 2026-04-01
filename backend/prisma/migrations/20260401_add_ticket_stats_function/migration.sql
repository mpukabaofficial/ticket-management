CREATE OR REPLACE FUNCTION get_ticket_stats(p_month_start TIMESTAMPTZ)
RETURNS TABLE (
  "totalTickets" BIGINT,
  "openTickets" BIGINT,
  "resolvedTickets" BIGINT,
  "aiResolvedTickets" BIGINT,
  "aiResolvedPercentage" INT,
  "avgResolutionTimeMs" BIGINT,
  "dailyDate" TIMESTAMPTZ,
  "dailyAi" BIGINT,
  "dailyAgent" BIGINT,
  "dailyUnresolved" BIGINT
)
LANGUAGE SQL STABLE
AS $$
  WITH summary AS (
    SELECT
      COUNT(*) FILTER (WHERE status NOT IN ('NEW', 'PROCESSING')) AS total_tickets,
      COUNT(*) FILTER (WHERE status = 'OPEN') AS open_tickets,
      COUNT(*) FILTER (WHERE status = 'RESOLVED') AS resolved_tickets,
      COUNT(*) FILTER (
        WHERE status = 'RESOLVED'
        AND EXISTS (SELECT 1 FROM "Message" m WHERE m."ticketId" = t.id AND m."isAiGenerated" = true)
      ) AS ai_resolved_tickets,
      COALESCE(
        ROUND(EXTRACT(EPOCH FROM AVG("updatedAt" - "createdAt") FILTER (WHERE status IN ('RESOLVED', 'CLOSED'))) * 1000),
        0
      ) AS avg_resolution_time_ms
    FROM "Ticket" t
  ),
  daily AS (
    SELECT
      DATE_TRUNC('day', t."createdAt") AS date,
      COUNT(*) FILTER (WHERE t.status IN ('RESOLVED', 'CLOSED') AND EXISTS (
        SELECT 1 FROM "Message" m WHERE m."ticketId" = t.id AND m."isAiGenerated" = true
      )) AS ai,
      COUNT(*) FILTER (WHERE t.status IN ('RESOLVED', 'CLOSED') AND NOT EXISTS (
        SELECT 1 FROM "Message" m WHERE m."ticketId" = t.id AND m."isAiGenerated" = true
      )) AS agent,
      COUNT(*) FILTER (WHERE t.status NOT IN ('RESOLVED', 'CLOSED', 'NEW', 'PROCESSING')) AS unresolved
    FROM "Ticket" t
    WHERE t.status NOT IN ('NEW', 'PROCESSING')
      AND t."createdAt" >= p_month_start
    GROUP BY DATE_TRUNC('day', t."createdAt")
    ORDER BY date
  )
  SELECT
    s.total_tickets,
    s.open_tickets,
    s.resolved_tickets,
    s.ai_resolved_tickets,
    CASE WHEN s.resolved_tickets > 0
      THEN ROUND(s.ai_resolved_tickets * 100.0 / s.resolved_tickets)::INT
      ELSE 0
    END,
    s.avg_resolution_time_ms,
    d.date,
    d.ai,
    d.agent,
    d.unresolved
  FROM summary s
  CROSS JOIN daily d;
$$;
