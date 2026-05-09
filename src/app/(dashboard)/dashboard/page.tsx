import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radio, Inbox, CheckCircle } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [endpointCount, submissionCount] = await Promise.all([
    db.formEndpoint.count({ where: { userId } }),
    db.submission.count({
      where: { endpoint: { userId } },
    }),
  ]);

  const recentSubmissions = await db.submission.findMany({
    where: { endpoint: { userId } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { endpoint: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your form endpoints and submission activity
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Endpoints
            </CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{endpointCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Submissions
            </CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{submissionCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Endpoints
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {await db.formEndpoint.count({ where: { userId, isActive: true } })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSubmissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No submissions yet. Create an endpoint and start collecting data.
            </p>
          ) : (
            <ul className="divide-y">
              {recentSubmissions.map((s) => (
                <li key={s.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{s.endpoint.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {s.isSpam && (
                    <span className="text-xs text-destructive">Spam</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
