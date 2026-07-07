"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Loader2, Route } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  return (
    <Suspense>
      <AuthInner />
    </Suspense>
  );
}

function AuthInner() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultTab = params.get("mode") === "signup" ? "signup" : "signin";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="mb-6 flex justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
              <Route className="h-6 w-6 text-emerald-400" />
            </span>
          </div>
          <Tabs defaultValue={defaultTab}>
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <AuthCard
                mode="signin"
                title="Welcome back"
                description="Sign in to see your resilience plan."
                cta="Sign in"
                onSuccess={() => router.push("/dashboard")}
              />
            </TabsContent>
            <TabsContent value="signup">
              <AuthCard
                mode="signup"
                title="Get your funded plan"
                description="Free assessment. No site visit, no spam."
                cta="Create account"
                onSuccess={() => router.push("/onboarding")}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}

function AuthCard({
  mode,
  title,
  description,
  cta,
  onSuccess,
}: {
  mode: "signin" | "signup";
  title: string;
  description: string;
  cta: string;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(mode === "signup" ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "signup" ? { email, password, displayName } : { email, password }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor={`${mode}-name`}>Name</Label>
              <Input
                id={`${mode}-name`}
                placeholder="Ben"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor={`${mode}-email`}>Email</Label>
            <Input
              id={`${mode}-email`}
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${mode}-password`}>Password</Label>
            <Input
              id={`${mode}-password`}
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {cta}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
