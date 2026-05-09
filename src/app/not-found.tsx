import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <p className="text-8xl font-bold text-muted-foreground/20 select-none">404</p>
      <h1 className="text-2xl font-bold mt-4">Page not found</h1>
      <p className="text-muted-foreground mt-2 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or was moved.
      </p>
      <div className="flex gap-3 mt-8">
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
