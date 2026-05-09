import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminNav } from "@/components/admin/admin-nav";
import { RoleToggle } from "@/components/admin/role-toggle";

export const metadata = { title: "Users · Admin" };

export default async function AdminUsersPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          endpoints: true,
        },
      },
    },
  });

  const submissionCounts = await db.submission.groupBy({
    by: ["endpointId"],
    _count: true,
  });

  const endpointUserMap = await db.formEndpoint.findMany({
    select: { id: true, userId: true },
  });

  const submissionsByUser: Record<string, number> = {};
  for (const { id, userId } of endpointUserMap) {
    const count = submissionCounts.find((s) => s.endpointId === id)?._count ?? 0;
    submissionsByUser[userId] = (submissionsByUser[userId] ?? 0) + count;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform-wide overview</p>
      </div>

      <AdminNav current="users" />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Endpoints</TableHead>
              <TableHead className="text-right">Submissions</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">{user.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <RoleToggle userId={user.id} currentRole={user.role} selfId={session.user.id} />
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {user._count.endpoints}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {submissionsByUser[user.id] ?? 0}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    dateStyle: "medium",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
