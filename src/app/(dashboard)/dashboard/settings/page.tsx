import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";
import { ApiKeysPanel } from "@/components/settings/api-keys-panel";
import { DeleteAccountButton } from "@/components/settings/delete-account-button";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const apiKeys = await db.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, lastUsed: true, createdAt: true },
  });

  return (
    <div className="space-y-10 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-base font-semibold">Profile</h2>
        <ProfileForm name={session.user.name ?? ""} />
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-base font-semibold">Password</h2>
        <PasswordForm hasPassword={!!session.user.email} />
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-base font-semibold">API keys</h2>
        <p className="text-sm text-muted-foreground">
          Use these keys to authenticate programmatic requests to your endpoints.
        </p>
        <ApiKeysPanel initialKeys={apiKeys} />
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-destructive">Danger zone</h2>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <DeleteAccountButton />
      </section>
    </div>
  );
}
