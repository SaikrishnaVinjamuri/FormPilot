import { auth } from "@/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Radio } from "lucide-react";

export default async function EndpointsPage() {
  const session = await auth();
  const endpoints = await db.formEndpoint.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { submissions: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Endpoints</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your form endpoints
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/endpoints/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New endpoint
          </Link>
        </Button>
      </div>

      {endpoints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Radio className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-medium">No endpoints yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Create your first endpoint to start accepting form submissions
            </p>
            <Button asChild>
              <Link href="/dashboard/endpoints/new">Create endpoint</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {endpoints.map((ep) => (
            <Card key={ep.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{ep.name}</p>
                    <Badge variant={ep.isActive ? "default" : "secondary"}>
                      {ep.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {process.env.NEXT_PUBLIC_APP_URL}/api/f/{ep.id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ep._count.submissions} submissions
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/endpoints/${ep.id}`}>Manage</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
