"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import {
  AlertTriangle,
  BatteryCharging,
  Brain,
  CheckCircle2,
  Flame,
  FlaskConical,
  Landmark,
  Loader2,
  Lock,
  MapPin,
  Network,
  Phone,
  PiggyBank,
  Sparkles,
  Thermometer,
  Timer,
  Waves,
  Wrench,
  Zap,
  ZapOff,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { CommunityImpact } from "@/components/community-impact";
import { RiskGraph, type GraphData } from "@/components/risk-graph";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { NumberTicker } from "@/components/ui/number-ticker";
import { BorderBeam } from "@/components/ui/border-beam";
import type { HazardRisk, UpgradeRecommendation } from "@/lib/queries";
import type { BackupSimResult } from "@/lib/daytona";

const PRO_PLAN_ID = "75948bed-c595-4dd4-ae25-049c83a4fd2e";

interface Household {
  id: string;
  address: string;
  property_id: string | null;
}

interface AssessmentResult {
  risks: HazardRisk[];
  upgrades: UpgradeRecommendation[];
  graph: GraphData;
  simulation: BackupSimResult | null;
  memories: string[];
  narrative: string;
  narrativeSource: string;
}

interface AssessmentRow {
  id: string;
  status: string;
  result: AssessmentResult;
  created_at: string;
}

const AGENT_STEPS = [
  { icon: Network, label: "Traversing risk graph in Neo4j…" },
  { icon: Brain, label: "Recalling household memory (Cognee)…" },
  { icon: FlaskConical, label: "Running backup simulation in Daytona sandbox…" },
  { icon: Sparkles, label: "Agent reasoning on RocketRide Cloud…" },
  { icon: Wrench, label: "Writing your plan…" },
];

const HAZARD_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  flame: Flame,
  "zap-off": ZapOff,
  thermometer: Thermometer,
  waves: Waves,
};

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [household, setHousehold] = useState<Household | null>(null);
  const [assessment, setAssessment] = useState<AssessmentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (params.get("upgraded") === "1") {
      toast.success("Welcome to Pro — your full roadmap is unlocked.");
    }
    if (params.get("canceled") === "1") {
      toast.info("Checkout canceled — your free assessment is untouched.");
    }
  }, [params]);

  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        if (meRes.status === 401) return router.push("/auth");
        const hhRes = await fetch("/api/households");
        if (hhRes.status === 401) return router.push("/auth");
        const { households } = await hhRes.json();
        if (!households?.length) return router.push("/onboarding");
        const hh = households[0];
        setHousehold(hh);
        const asRes = await fetch(`/api/assessments?householdId=${hh.id}`);
        if (asRes.ok) {
          const { assessments } = await asRes.json();
          if (assessments?.length) setAssessment(assessments[0]);
        }
        const bRes = await fetch("/api/billing/status");
        if (bRes.ok) {
          const { subscription } = await bRes.json();
          const status =
            subscription?.status ?? subscription?.subscription?.status ?? null;
          setIsPro(status === "active" || status === "trialing");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // fake staged progress while the (single long) assess request is in flight
  useEffect(() => {
    if (!running) return;
    setStepIdx(0);
    const t = setInterval(
      () => setStepIdx((i) => Math.min(i + 1, AGENT_STEPS.length - 1)),
      9000
    );
    return () => clearInterval(t);
  }, [running]);

  const runAssessment = useCallback(async () => {
    if (!household) return;
    setRunning(true);
    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ householdId: household.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "assessment failed");
      setAssessment(data.assessment);
      toast.success("Assessment complete.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assessment failed");
    } finally {
      setRunning(false);
    }
  }, [household]);

  async function upgradeToPro() {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: PRO_PLAN_ID }),
    });
    const data = await res.json();
    if (res.ok && data.url) {
      window.location.href = data.url;
    } else {
      toast.error(data.error ?? "Could not start checkout");
    }
  }

  const result = assessment?.result;
  const totalSavings = useMemo(
    () =>
      result?.upgrades.reduce(
        (s, u) => s + Math.max(u.costUsd - u.effectiveCostUsd, 0),
        0
      ) ?? 0,
    [result]
  );

  if (loading) {
    return (
      <Shell>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* Address bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-emerald-400" />
            {household?.address}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Your resilience &amp; clean-energy plan
          </h1>
        </div>
        <Button
          onClick={runAssessment}
          disabled={running}
          className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
        >
          {running ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {assessment ? "Re-run assessment" : "Run assessment"}
        </Button>
      </div>

      {/* Agent progress */}
      <AnimatePresence>
        {running && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="space-y-3 p-6">
                {AGENT_STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const state = i < stepIdx ? "done" : i === stepIdx ? "active" : "todo";
                  return (
                    <div
                      key={s.label}
                      className={`flex items-center gap-3 text-sm transition-opacity ${
                        state === "todo" ? "opacity-35" : ""
                      }`}
                    >
                      {state === "done" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : state === "active" ? (
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                      ) : (
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      )}
                      {s.label}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!result && !running && <EmptyState onRun={runAssessment} />}

      {result && (
        <div className="space-y-8">
          {/* Headline stats: savings + risk + timeline */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="relative overflow-hidden border-emerald-500/30">
              <BorderBeam colorFrom="#34d399" colorTo="#22d3ee" size={70} />
              <CardContent className="p-5">
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                  <PiggyBank className="h-3.5 w-3.5 text-emerald-400" /> Grants found
                </p>
                <p className="mt-2 text-3xl font-bold text-emerald-400">
                  $<NumberTicker value={totalSavings} className="text-emerald-400" />
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  in rebates &amp; credits across your upgrade path
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-5">
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400" /> Top risk
                </p>
                <p className="mt-2 text-3xl font-bold text-red-400">
                  {result.risks[0]?.hazard ?? "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  risk score{" "}
                  <NumberTicker
                    value={result.risks[0]?.riskScore ?? 0}
                    decimalPlaces={2}
                    className="text-red-400"
                  />
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-5">
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                  <Timer className="h-3.5 w-3.5 text-cyan-400" /> First install
                </p>
                <p className="mt-2 text-3xl font-bold text-cyan-400">
                  <NumberTicker
                    value={fastestPath(result.upgrades)[0]?.leadWeeks ?? 0}
                    className="text-cyan-400"
                  />{" "}
                  wks
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  until “{fastestPath(result.upgrades)[0]?.upgrade}” is in
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top risk hero */}
          <TopRiskCard risk={result.risks[0]} />

          {/* Graph viz */}
          <section>
            <SectionTitle icon={<Network className="h-4 w-4 text-emerald-400" />}>
              Why — your home&apos;s dependency graph
            </SectionTitle>
            <RiskGraph data={result.graph} />
          </section>

          {/* Fastest path timeline */}
          <section>
            <SectionTitle icon={<Timer className="h-4 w-4 text-cyan-400" />}>
              Fastest path to installed
            </SectionTitle>
            <FastestPathStrip upgrades={result.upgrades} />
          </section>

          {/* Other risks */}
          {result.risks.length > 1 && (
            <section>
              <SectionTitle icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}>
                Remaining risks
              </SectionTitle>
              <div className="grid gap-3 sm:grid-cols-3">
                {result.risks.slice(1).map((r) => (
                  <RiskMiniCard key={r.hazardId} risk={r} />
                ))}
              </div>
            </section>
          )}

          {/* Upgrade path */}
          <section>
            <SectionTitle icon={<BatteryCharging className="h-4 w-4 text-emerald-400" />}>
              Your upgrade path — best risk reduction per dollar
            </SectionTitle>
            <div className="space-y-4">
              {result.upgrades.map((u, i) => (
                <UpgradeCard key={u.upgradeId} upgrade={u} index={i} isPro={isPro} />
              ))}
            </div>
          </section>

          {/* Community impact — shared lifelines */}
          <CommunityImpact
            propertyId={household?.property_id ?? "prop-1"}
          />

          {/* Pro upsell */}
          {!isPro && (
            <Card className="relative overflow-hidden border-emerald-500/40">
              <BorderBeam colorFrom="#34d399" colorTo="#22d3ee" />
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Lock className="h-4 w-4 text-emerald-400" />
                    Unlock ${totalSavings.toLocaleString()} in applications
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pro includes the pre-filled grant packet, contractor phone
                    numbers &amp; intros, and seasonal alerts.
                  </p>
                </div>
                <Button
                  onClick={upgradeToPro}
                  className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                >
                  Upgrade to Pro — $9/mo
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Simulation */}
          {result.simulation && <SimulationCard sim={result.simulation} />}

          {/* Narrative */}
          <section>
            <SectionTitle icon={<Sparkles className="h-4 w-4 text-violet-400" />}>
              Your agent&apos;s plan
              <Badge variant="outline" className="ml-2 border-border/60 text-[10px] text-muted-foreground">
                {result.narrativeSource === "rocketride-cloud"
                  ? "computed on RocketRide Cloud"
                  : "gateway fallback"}
              </Badge>
            </SectionTitle>
            <Card className="border-border/60">
              <CardContent className="prose prose-invert prose-sm max-w-none p-6 prose-headings:text-foreground prose-strong:text-foreground">
                <ReactMarkdown>{result.narrative}</ReactMarkdown>
              </CardContent>
            </Card>
          </section>

          {/* Memories */}
          {result.memories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Brain className="h-3.5 w-3.5 text-violet-400" /> Agent remembers:
              </span>
              {result.memories.slice(0, 3).map((m, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="max-w-xs truncate border-violet-400/30 bg-violet-400/10 text-[11px] text-violet-300"
                >
                  {m.length > 90 ? `${m.slice(0, 90)}…` : m}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}

/* ---------- pieces ---------- */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">{children}</main>
    </div>
  );
}

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
      {icon}
      {children}
    </h2>
  );
}

function EmptyState({ onRun }: { onRun: () => void }) {
  return (
    <Card className="border-dashed border-border/60">
      <CardContent className="flex flex-col items-center gap-4 p-14 text-center">
        <Network className="h-10 w-10 text-emerald-400/60" />
        <div>
          <h2 className="text-lg font-semibold">Your risk graph is ready to traverse</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            The agent will walk your home&apos;s dependencies in Neo4j, simulate
            failures in a Daytona sandbox, and write a funded action plan on
            RocketRide Cloud. Takes about a minute.
          </p>
        </div>
        <Button onClick={onRun} className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
          <Sparkles className="mr-2 h-4 w-4" /> Run my first assessment
        </Button>
      </CardContent>
    </Card>
  );
}

function TopRiskCard({ risk }: { risk?: HazardRisk }) {
  if (!risk) return null;
  const Icon = HAZARD_ICONS[risk.icon] ?? Zap;
  return (
    <Card className="border-red-500/30 bg-gradient-to-br from-red-500/10 via-transparent to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/15 ring-1 ring-red-400/30">
            <Icon className="h-5 w-5 text-red-400" />
          </span>
          <span>
            {risk.hazard} is your highest-impact risk
            <span className="ml-3 align-middle text-sm font-normal text-muted-foreground">
              score <NumberTicker value={risk.riskScore} decimalPlaces={2} />
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 p-6 pt-3 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
            What fails
          </p>
          <ul className="space-y-2 text-sm">
            {risk.disruptedInfrastructure.map((i) => (
              <li key={i.name} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-blue-400" />
                  {i.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(i.probability * 100)}% · ~{i.avgDurationHrs}h ·{" "}
                  {i.redundancy} redundancy
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
            Who&apos;s vulnerable
          </p>
          <ul className="space-y-2 text-sm">
            {risk.affectedVulnerabilities.length ? (
              risk.affectedVulnerabilities.map((v) => (
                <li key={v.name} className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  {v.name}
                  {v.resident && (
                    <span className="text-xs text-muted-foreground">({v.resident})</span>
                  )}
                </li>
              ))
            ) : (
              <li className="text-sm text-muted-foreground">
                No specific vulnerabilities in the blast radius.
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function RiskMiniCard({ risk }: { risk: HazardRisk }) {
  const Icon = HAZARD_ICONS[risk.icon] ?? Zap;
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-amber-400" />
          {risk.hazard}
          <span className="ml-auto text-xs text-muted-foreground">
            {risk.riskScore.toFixed(2)}
          </span>
        </p>
        <div className="mt-3 space-y-2">
          <MeterRow label="exposure" value={risk.exposure} />
          <MeterRow label="annual probability" value={risk.annualProbability} />
        </div>
      </CardContent>
    </Card>
  );
}

function MeterRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <Progress value={value * 100} className="h-1" />
    </div>
  );
}

function fastestPath(upgrades: UpgradeRecommendation[]) {
  return [...upgrades].sort((a, b) => a.leadWeeks - b.leadWeeks);
}

function FastestPathStrip({ upgrades }: { upgrades: UpgradeRecommendation[] }) {
  const ordered = fastestPath(upgrades);
  const max = Math.max(...ordered.map((u) => u.leadWeeks), 1);
  return (
    <Card className="border-border/60">
      <CardContent className="p-6">
        <div className="relative ml-2 border-l border-border/60 pl-6">
          {ordered.map((u) => (
            <div key={u.upgradeId} className="relative pb-6 last:pb-0">
              <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 ring-1 ring-cyan-400/40">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              </span>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-xs text-cyan-400">
                  week {u.leadWeeks}
                </span>
                <span className="text-sm font-medium">{u.upgrade}</span>
                <span className="text-xs text-muted-foreground">
                  ${u.effectiveCostUsd.toLocaleString()} after grants
                </span>
              </div>
              <div className="mt-1.5 h-1 max-w-md overflow-hidden rounded bg-border/40">
                <div
                  className="h-full rounded bg-gradient-to-r from-cyan-500 to-emerald-400"
                  style={{ width: `${(u.leadWeeks / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function UpgradeCard({
  upgrade,
  index,
  isPro,
}: {
  upgrade: UpgradeRecommendation;
  index: number;
  isPro: boolean;
}) {
  const savings = Math.max(upgrade.costUsd - upgrade.effectiveCostUsd, 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-400 ring-1 ring-emerald-400/30">
                {index + 1}
              </span>
              <div>
                <h3 className="font-semibold">{upgrade.upgrade}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {upgrade.category} · ~{upgrade.leadWeeks} weeks to install ·
                  protects against{" "}
                  {upgrade.mitigates.map((m) => m.hazard).join(", ")}
                </p>
              </div>
            </div>
            <div className="text-right">
              {savings > 0 && (
                <p className="text-xs text-muted-foreground line-through">
                  ${upgrade.costUsd.toLocaleString()}
                </p>
              )}
              <p className="text-xl font-bold text-emerald-400">
                ${upgrade.effectiveCostUsd.toLocaleString()}
              </p>
              <Badge
                variant="outline"
                className="mt-1 border-emerald-400/30 bg-emerald-400/10 text-[10px] text-emerald-300"
              >
                risk ↓ {upgrade.riskReductionPerK.toFixed(2)} per $1k
              </Badge>
            </div>
          </div>

          {upgrade.grants.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="flex flex-wrap gap-2">
                {upgrade.grants.map((g) => (
                  <Badge
                    key={g.name}
                    variant="outline"
                    className="gap-1.5 border-cyan-400/30 bg-cyan-400/10 text-[11px] text-cyan-300"
                  >
                    <Landmark className="h-3 w-3" />
                    {g.name} — saves ${g.savingsUsd.toLocaleString()}
                  </Badge>
                ))}
              </div>
            </>
          )}

          {upgrade.contractors.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className={`flex flex-wrap gap-4 ${isPro ? "" : "relative"}`}>
                {upgrade.contractors.map((c) => (
                  <span key={c.name} className="flex items-center gap-2 text-sm">
                    <Wrench className="h-3.5 w-3.5 text-pink-400" />
                    {c.name}
                    <span className="text-xs text-muted-foreground">★ {c.rating}</span>
                    <span
                      className={`flex items-center gap-1 text-xs ${
                        isPro ? "text-muted-foreground" : "select-none blur-sm"
                      }`}
                    >
                      <Phone className="h-3 w-3" />
                      {isPro ? c.phone : "(510) 555-0000"}
                    </span>
                  </span>
                ))}
                {!isPro && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <Lock className="h-3 w-3" /> Pro
                  </span>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SimulationCard({ sim }: { sim: BackupSimResult }) {
  return (
    <section>
      <SectionTitle icon={<FlaskConical className="h-4 w-4 text-cyan-400" />}>
        Sandbox-verified backup simulation
        <Badge variant="outline" className="ml-2 border-border/60 text-[10px] text-muted-foreground">
          computed in a Daytona sandbox
        </Badge>
      </SectionTitle>
      <Card className="border-border/60">
        <CardContent className="grid gap-6 p-6 sm:grid-cols-4">
          <SimStat
            label="backup runtime"
            value={`${sim.backupHours}h`}
            hint={`at ${sim.totalLoadW}W critical load`}
          />
          <SimStat
            label="nights of CPAP"
            value={`${sim.nightsOfCpap}`}
            hint="on battery alone"
          />
          <SimStat
            label="P95 outage"
            value={`${sim.p95OutageHrs}h`}
            hint="Monte Carlo, 10k runs"
          />
          <div className="flex flex-col justify-center">
            {sim.coversP95Outage ? (
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Covers a 95th-percentile outage
              </p>
            ) : (
              <p className="flex items-center gap-2 text-sm font-medium text-amber-400">
                <AlertTriangle className="h-4 w-4" /> Add solar to cover long outages
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function SimStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-cyan-400">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
