import { CreateEndpointForm } from "@/components/dashboard/create-endpoint-form";

export default function NewEndpointPage() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New endpoint</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your form endpoint. You can change these settings anytime.
        </p>
      </div>
      <CreateEndpointForm />
    </div>
  );
}
