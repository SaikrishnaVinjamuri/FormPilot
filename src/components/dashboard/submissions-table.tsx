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
import type { Submission } from "@prisma/client";

interface Props {
  submissions: Submission[];
}

function getColumns(submissions: Submission[]): string[] {
  const keys = new Set<string>();
  for (const s of submissions) {
    if (s.fields && typeof s.fields === "object" && !Array.isArray(s.fields)) {
      for (const k of Object.keys(s.fields as Record<string, unknown>)) {
        keys.add(k);
      }
    }
  }
  return Array.from(keys);
}

function formatDate(d: Date) {
  return new Date(d).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function SubmissionsTable({ submissions }: Props) {
  if (submissions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No submissions yet.
      </p>
    );
  }

  const columns = getColumns(submissions);

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-36">Date</TableHead>
            {columns.map((col) => (
              <TableHead key={col}>{col}</TableHead>
            ))}
            <TableHead className="w-20">Spam</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((sub) => {
            const fields = (sub.fields ?? {}) as Record<string, unknown>;
            return (
              <TableRow key={sub.id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(sub.createdAt)}
                </TableCell>
                {columns.map((col) => (
                  <TableCell key={col} className="text-sm max-w-xs truncate">
                    {fields[col] != null ? String(fields[col]) : "—"}
                  </TableCell>
                ))}
                <TableCell>
                  {sub.isSpam && (
                    <Badge variant="destructive" className="text-xs">
                      Spam
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
