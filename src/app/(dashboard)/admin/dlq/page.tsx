import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminNav } from "@/components/admin/admin-nav";
import { DlqRetryButton } from "@/components/admin/dlq-retry-button";

export const metadata = { title: "Dead Letter Queue · Admin" };

export default async function AdminDlqPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const jobs = await db.deadLetterJob.findMany({
    orderBy: { failedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform-wide overview</p>
      </div>

      <AdminNav current="dlq" />

      {jobs.length === 0 ? (
        <div className="rounded-md border p-12 text-center">
          <p className="text-sm text-muted-foreground">No dead letter jobs. All good!</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job type</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Submission</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Failed at</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {job.jobType}
                    </code>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[8rem]">
                    {job.endpointId}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[8rem]">
                    {job.submissionId}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {job.errorMessage ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(job.failedAt).toLocaleString(undefined, {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell>
                    {job.resolvedAt ? (
                      <Badge variant="default" className="text-xs">Resolved</Badge>
                    ) : job.retriedAt ? (
                      <Badge variant="outline" className="text-xs">Retried</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">Failed</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!job.resolvedAt && (
                      <DlqRetryButton jobId={job.id} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
