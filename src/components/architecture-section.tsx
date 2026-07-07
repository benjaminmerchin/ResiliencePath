"use client";

import { motion } from "motion/react";
import {
  Brain,
  Database,
  FlaskConical,
  Network,
  Rocket,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const FLOW = [
  { n: "01", label: "POST /api/assess", detail: "one request, five systems" },
  { n: "02", label: "neo4j aura", detail: "risk traversal · cascades · grant matching" },
  { n: "03", label: "cognee", detail: "GRAPH_COMPLETION recall of household memory" },
  { n: "04", label: "daytona", detail: "monte carlo sim in ephemeral sandbox" },
  { n: "05", label: "rocketride cloud", detail: "agent pipeline · db_neo4j tool · DAP invoke" },
  { n: "06", label: "butterbase", detail: "persisted to Postgres under RLS" },
];

interface TechCard {
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  chipBg: string;
  name: string;
  claim: string;
  chips: string[];
  points: string[];
}

const TECH: TechCard[] = [
  {
    icon: Network,
    accent: "text-emerald-400",
    chipBg: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    name: "Neo4j Aura",
    claim: "The risk graph is the product.",
    chips: ["8 node labels", "9 relationship types", "NVL rendering"],
    points: [
      "Risk is a multiplicative traversal: EXPOSED_TO.score × Hazard.annualProbability × cascading DEPENDS_ON*1..3 disruption × vulnerability severity — life-safety dependencies dominate the weighting.",
      "Upgrades ranked by risk-reduction per effective dollar after grant matching in the same query.",
      "The dashboard renders the explanation subgraph (30 nodes / 48 relationships) with Neo4j NVL — every recommendation is a visible path, not a black box.",
    ],
  },
  {
    icon: Rocket,
    accent: "text-orange-400",
    chipBg: "border-orange-400/30 bg-orange-400/10 text-orange-300",
    name: "RocketRide Cloud",
    claim: "The agent runs as a deployed pipeline, not a prompt.",
    chips: ["6-node JSON DAG", "C++ engine", "WebSocket DAP"],
    points: [
      "webhook source → question normalizer → CrewAI advisor agent ← db_neo4j tool ← LLM control plane → response_answers.",
      "The db_neo4j tool does live NL→Cypher over Aura (get_schema / get_data / get_cypher), read-only enforced.",
      "Invoked from the app over the WebSocket DAP protocol with per-request env injection for secrets.",
    ],
  },
  {
    icon: Database,
    accent: "text-amber-300",
    chipBg: "border-amber-300/30 bg-amber-300/10 text-amber-200",
    name: "Butterbase",
    claim: "One backend, four roles.",
    chips: ["Postgres + RLS", "JWT auth", "Stripe Connect", "AI gateway"],
    points: [
      "Per-app Postgres with row-level-security user isolation (households, assessments) and JWT auth (signup / login / refresh).",
      "Stripe Connect subscription billing gates the Pro roadmap.",
      "Its OpenAI-compatible AI gateway serves Claude to the RocketRide pipeline itself — the graph agent's reasoning is routed through our backend's model gateway. No separate LLM keys anywhere.",
    ],
  },
  {
    icon: FlaskConical,
    accent: "text-cyan-400",
    chipBg: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
    name: "Daytona",
    claim: "Computed, never hallucinated.",
    chips: ["10,000 draws", "ephemeral sandbox", "script provenance"],
    points: [
      "For every assessment the agent generates a Python Monte Carlo simulation — 10,000 lognormal outage-duration draws seeded from graph disruption data plus the household's device load profile.",
      "It executes in an ephemeral Daytona sandbox; “38 nights of CPAP backup, P95 outage 66h” are computed numbers, with the generating script preserved as provenance.",
    ],
  },
  {
    icon: Brain,
    accent: "text-violet-400",
    chipBg: "border-violet-400/30 bg-violet-400/10 text-violet-300",
    name: "Cognee",
    claim: "The advisor remembers.",
    chips: ["add → cognify", "GRAPH_COMPLETION", "cross-session"],
    points: [
      "After each assessment the agent writes what it learned into a Cognee knowledge graph (add → cognify).",
      "The next assessment opens with GRAPH_COMPLETION recall over that memory — per-household context that compounds across sessions.",
    ],
  },
];

export function ArchitectureSection() {
  return (
    <section
      id="architecture"
      className="relative border-y border-border/40 bg-card/30 py-24"
    >
      {/* blueprint grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4">
        <motion.p
          {...fadeUp}
          className="mb-3 text-center font-mono text-xs uppercase tracking-[0.3em] text-emerald-400/80"
        >
          under the hood
        </motion.p>
        <motion.h2
          {...fadeUp}
          className="mb-4 text-center text-3xl font-bold tracking-tight"
        >
          One assessment request touches five systems
        </motion.h2>
        <motion.p
          {...fadeUp}
          className="mx-auto mb-12 max-w-2xl text-center text-sm text-muted-foreground"
        >
          Every number on the dashboard is traceable to a graph traversal, a
          sandboxed computation, or a deployed pipeline run — nothing is a
          prompt guessing.
        </motion.p>

        {/* Request flow */}
        <motion.div {...fadeUp} className="mb-12">
          <div className="overflow-x-auto rounded-xl border border-border/60 bg-[#0b1220]/80 p-5 backdrop-blur">
            <div className="flex min-w-max items-stretch gap-0">
              {FLOW.map((step, i) => (
                <div key={step.n} className="flex items-center">
                  <div className="w-44 shrink-0 px-3">
                    <p className="font-mono text-[10px] text-emerald-400/70">
                      {step.n}
                    </p>
                    <p className="mt-0.5 font-mono text-[13px] font-semibold text-foreground">
                      {step.label}
                    </p>
                    <p className="mt-1 font-mono text-[10px] leading-relaxed text-muted-foreground">
                      {step.detail}
                    </p>
                  </div>
                  {i < FLOW.length - 1 && (
                    <span
                      aria-hidden
                      className="mx-1 font-mono text-lg text-emerald-400/40"
                    >
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tech cards */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TECH.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.div
                key={t.name}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.05 }}
                className={i === 0 ? "md:col-span-2 lg:col-span-1" : ""}
              >
                <Card className="h-full border-border/60 bg-[#0b1220]/60 backdrop-blur">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="mb-3 flex items-center gap-2.5">
                      <Icon className={`h-4.5 w-4.5 ${t.accent}`} />
                      <h3 className="font-mono text-sm font-semibold tracking-tight">
                        {t.name}
                      </h3>
                    </div>
                    <p className="text-sm font-medium">{t.claim}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {t.chips.map((c) => (
                        <span
                          key={c}
                          className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${t.chipBg}`}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                    <ul className="mt-4 space-y-2.5 text-[13px] leading-relaxed text-muted-foreground">
                      {t.points.map((p, j) => (
                        <li key={j} className="flex gap-2">
                          <span
                            aria-hidden
                            className={`mt-[7px] h-1 w-1 shrink-0 rounded-full bg-current ${t.accent}`}
                          />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          {...fadeUp}
          className="mt-12 text-center font-mono text-sm text-muted-foreground"
        >
          Five managed systems, zero servers of our own —{" "}
          <span className="text-emerald-400">the graph does the reasoning</span>
          , <span className="text-cyan-400">the pipeline does the work</span>.
        </motion.p>
      </div>
    </section>
  );
}
