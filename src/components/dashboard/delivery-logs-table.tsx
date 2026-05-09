"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RetryDeliveryButton } from "@/components/dashboard/retry-delivery-button";
import type { DeliveryLog } from "@prisma/client";

interface Props {
  logs: DeliveryLog[];
}

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  DELIVERED: "default",
  FAILED: "destructive",
  RETRYING: "outline",
  DEAD_LETTERED: "destructive",
};

const retryable = new Set(["FAILED", "DEAD_LETTERED"]);

function formatDate(d: Date) {
  return new Date(d).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function DeliveryLogsTable({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No delivery logs yet.
      </p>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-36">Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead className="w-28">Status</TableHead>
            <TableHead>Error</TableHead>
            <TableHead className="w-16">Attempts</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(log.createdAt)}
              </TableCell>
              <TableCell className="text-xs">
                {log.type.replace(/_/g, " ")}
              </TableCell>
              <TableCell className="text-xs truncate max-w-xs">
                {log.destination}
              </TableCell>
              <TableCell>
                <Badge
                  variant={statusVariant[log.status] ?? "secondary"}
                  className="text-xs"
                >
                  {log.status}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground truncate max-w-xs">
                {log.errorMessage ?? "—"}
              </TableCell>
              <TableCell className="text-xs text-center">
                {log.attemptCount}
              </TableCell>
              <TableCell>
                {retryable.has(log.status) && (
                  <RetryDeliveryButton logId={log.id} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
