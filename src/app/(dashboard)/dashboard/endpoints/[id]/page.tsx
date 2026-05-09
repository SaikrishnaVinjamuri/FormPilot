import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CopyUrl } from "@/components/dashboard/copy-url";
import { SubmissionsTable } from "@/components/dashboard/submissions-table";
import { DeliveryLogsTable } from "@/components/dashboard/delivery-logs-table";
import { EndpointSettingsForm } from "@/components/dashboard/endpoint-settings-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EndpointDetailPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const endpoint = await db.formEndpoint.findFirst({
    where: { id, userId: session.user.id },
    include: {
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 200,
      },
      deliveryLogs: {
        orderBy: { createdAt: "desc" },
        take: 200,
      },
    },
  });

  if (!endpoint) notFound();

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const endpointUrl = `${appUrl}/api/f/${endpoint.id}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{endpoint.name}</h1>
            <Badge variant={endpoint.isActive ? "default" : "secondary"}>
              {endpoint.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {endpoint.submissions.length} submission
            {endpoint.submissions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CopyUrl url={endpointUrl} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="submissions">
        <TabsList variant="line" className="w-full justify-start border-b rounded-none h-auto pb-0 gap-0">
          <TabsTrigger value="submissions" className="rounded-none px-4 py-2.5 text-sm font-medium">
            Submissions
            <span className="ml-2 text-xs tabular-nums text-muted-foreground">
              {endpoint.submissions.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="delivery" className="rounded-none px-4 py-2.5 text-sm font-medium">
            Delivery logs
            <span className="ml-2 text-xs tabular-nums text-muted-foreground">
              {endpoint.deliveryLogs.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-none px-4 py-2.5 text-sm font-medium">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="mt-4">
          <SubmissionsTable submissions={endpoint.submissions} />
        </TabsContent>

        <TabsContent value="delivery" className="mt-4">
          <DeliveryLogsTable logs={endpoint.deliveryLogs} />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <EndpointSettingsForm endpoint={endpoint} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
