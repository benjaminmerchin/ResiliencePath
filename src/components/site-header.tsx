"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Route, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Me {
  email: string;
  display_name: string | null;
}

export function SiteHeader() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => setMe(d.user))
      .catch(() => setMe(null))
      .finally(() => setLoaded(true));
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-400/30">
            <Route className="h-4.5 w-4.5 text-emerald-400 transition-transform group-hover:rotate-6" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            Resilience<span className="text-emerald-400">Path</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          {loaded && me ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {me.display_name ?? me.email}
              </span>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : loaded ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth">Sign in</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
              >
                <Link href="/auth?mode=signup">Get your plan</Link>
              </Button>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
