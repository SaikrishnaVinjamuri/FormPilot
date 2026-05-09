import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Shield, Webhook, Mail, BarChart3, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Drop-in endpoint",
    description:
      "Point your HTML form's action at your endpoint URL. No backend changes needed.",
  },
  {
    icon: Shield,
    title: "Spam protection",
    description:
      "Honeypot fields and heuristic scoring stop bots before they hit your inbox.",
  },
  {
    icon: Mail,
    title: "Email notifications",
    description:
      "Get an email every time someone submits. Send auto-replies to your users too.",
  },
  {
    icon: Webhook,
    title: "Webhooks",
    description:
      "Forward submissions to Slack, Zapier, or any HTTP endpoint automatically.",
  },
  {
    icon: BarChart3,
    title: "Submission dashboard",
    description:
      "Browse all submissions in one place, with auto-detected columns from your form fields.",
  },
  {
    icon: Shield,
    title: "CORS & rate limiting",
    description:
      "Lock endpoints to your domain and cap request rates to prevent abuse.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b sticky top-0 bg-background/80 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight text-primary">
            FormPilot
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Get started free</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 bg-gradient-to-b from-accent/30 to-background">
        <Badge variant="outline" className="mb-6 text-primary border-primary/30">
          Open beta
        </Badge>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight max-w-3xl leading-[1.1]">
          Form submissions,{" "}
          <span className="text-primary">without the backend</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl">
          Create an endpoint, point your HTML form at it, and start receiving
          submissions instantly — with spam protection, email alerts, and
          webhook forwarding built in.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
          <Button size="lg" asChild>
            <Link href="/register">
              Start for free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>

        {/* Code snippet teaser */}
        <div className="mt-14 w-full max-w-lg rounded-xl border bg-card shadow-lg overflow-hidden text-left">
          <div className="flex items-center gap-1.5 px-4 py-3 border-b bg-muted/50">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-2 text-xs text-muted-foreground font-mono">
              contact.html
            </span>
          </div>
          <pre className="p-4 text-sm font-mono leading-relaxed overflow-x-auto">
            <code>
              <span className="text-muted-foreground">{"<"}</span>
              <span className="text-primary">form</span>{" "}
              <span className="text-muted-foreground">action=</span>
              <span className="text-green-600 dark:text-green-400">
                &quot;https://formpilot.dev/api/f/YOUR_ID&quot;
              </span>
              {"\n      "}
              <span className="text-muted-foreground">method=</span>
              <span className="text-green-600 dark:text-green-400">
                &quot;POST&quot;
              </span>
              <span className="text-muted-foreground">{">"}</span>
              {"\n  "}
              <span className="text-muted-foreground">{"<"}</span>
              <span className="text-primary">input</span>{" "}
              <span className="text-muted-foreground">name=</span>
              <span className="text-green-600 dark:text-green-400">
                &quot;email&quot;
              </span>{" "}
              <span className="text-muted-foreground">type=</span>
              <span className="text-green-600 dark:text-green-400">
                &quot;email&quot;
              </span>{" "}
              <span className="text-muted-foreground">/{">"}</span>
              {"\n  "}
              <span className="text-muted-foreground">{"<"}</span>
              <span className="text-primary">button</span>
              <span className="text-muted-foreground">{">"}</span>
              Send
              <span className="text-muted-foreground">
                {"</"}
              </span>
              <span className="text-primary">button</span>
              <span className="text-muted-foreground">{">"}</span>
              {"\n"}
              <span className="text-muted-foreground">{"</"}</span>
              <span className="text-primary">form</span>
              <span className="text-muted-foreground">{">"}</span>
            </code>
          </pre>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need, nothing you don&apos;t
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-card rounded-xl border p-6 space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to simplify your forms?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Create your first endpoint in under a minute. No credit card required.
        </p>
        <Button size="lg" asChild>
          <Link href="/register">
            Get started free <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} FormPilot. Built with Next.js.
      </footer>
    </div>
  );
}
