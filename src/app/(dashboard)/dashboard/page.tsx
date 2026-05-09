import { auth } from "@/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Radio, Inbox, Activity, ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [endpointCount, submissionCount, activeCount, recentSubmissions] =
    await Promise.all([
      db.formEndpoint.count({ where: { userId } }),
      db.submission.count({ where: { endpoint: { userId } } }),
      db.formEndpoint.count({ where: { userId, isActive: true } }),
      db.submission.findMany({
        where: { endpoint: { userId } },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { endpoint: { select: { name: true, id: true } } },
      }),
    ]);

  const stats = [
    {
      label: "Total endpoints",
      value: endpointCount,
      icon: Radio,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950",
    },
    {
      label: "Total submissions",
      value: submissionCount,
      icon: Inbox,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Active endpoints",
      value: activeCount,
      icon: Activity,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your form endpoints at a glance
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent submissions */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Recent submissions
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/endpoints">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentSubmissions.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <Inbox className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                No submissions yet.{" "}
                <Link
                  href="/dashboard/endpoints/new"
                  className="text-primary hover:underline underline-offset-4"
                >
                  Create an endpoint
                </Link>{" "}
                to get started.
              </p>
            </div>
          ) : (
            <ul className="divide-y -mx-6">
              {recentSubmissions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/dashboard/endpoints/${s.endpoint.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{s.endpoint.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(s.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    {s.isSpam ? (
                      <Badge variant="destructive" className="text-xs">
                        Spam
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        New
                      </Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
