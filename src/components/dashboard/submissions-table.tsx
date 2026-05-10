"use client";

import { useState, Fragment } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (submissions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No submissions yet.
      </p>
    );
  }

  const columns = getColumns(submissions);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
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
            const isOpen = expanded.has(sub.id);

            return (
              <Fragment key={sub.id}>
                <TableRow
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggle(sub.id)}
                >
                  <TableCell className="text-muted-foreground">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </TableCell>
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

                {isOpen && (
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={columns.length + 3} className="py-4 px-6">
                      <div className="space-y-2">
                        {Object.entries(fields).map(([k, v]) => (
                          <div key={k} className="grid grid-cols-[160px_1fr] gap-2 text-sm">
                            <span className="font-medium text-muted-foreground shrink-0">{k}</span>
                            <span className="break-words whitespace-pre-wrap">{String(v)}</span>
                          </div>
                        ))}
                        <p className="text-xs text-muted-foreground pt-1 border-t mt-2">
                          IP: {sub.ipAddress ?? "—"} · UA: {sub.userAgent ?? "—"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
