"use client";

import { motion } from "motion/react";
import { Building2, HardHat, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const MARKET_STATS = [
  {
    stat: "$100B+ / yr",
    label: "U.S. weather-disaster losses (NOAA 2024: 27 billion-dollar events)",
  },
  {
    stat: "$8.8B",
    label: "IRA home-energy rebate pool (HOMES + HEEHRA) most homeowners never claim",
  },
  {
    stat: "$1 → $6",
    label: "FEMA-estimated savings per $1 spent on pre-disaster mitigation",
  },
  {
    stat: "30M+",
    label: "U.S. homes in high wildfire, flood, or outage risk zones",
  },
];

const MODEL = [
  {
    icon: Home,
    accent: "text-emerald-400",
    who: "Consumers",
    line: "Free assessment; $9/mo Pro — full plan, grant packet, seasonal alerts.",
  },
  {
    icon: HardHat,
    accent: "text-cyan-400",
    who: "Contractors",
    line: "Qualified-lead referral fees on funded installs — the graph knows who's ready to buy and which grant pays.",
  },
  {
    icon: Building2,
    accent: "text-violet-400",
    who: "Insurers & utilities",
    line: "De-identified risk-graph analytics: a portfolio-level view of cascading residential risk.",
  },
];

export function BusinessCase() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4">
        <motion.h2
          {...fadeUp}
          className="mb-4 text-center text-3xl font-bold tracking-tight"
        >
          The business writes itself
        </motion.h2>
        <motion.p
          {...fadeUp}
          className="mx-auto mb-12 max-w-2xl text-center text-sm text-muted-foreground"
        >
          Climate adaptation is a trillion-dollar coordination problem with the
          money already on the table — it just isn&apos;t connected to the homes
          that qualify.
        </motion.p>

        <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MARKET_STATS.map((s, i) => (
            <motion.div
              key={s.stat}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.05 }}
            >
              <Card className="h-full border-border/60 bg-card/50">
                <CardContent className="p-5">
                  <p className="text-2xl font-bold text-emerald-400">{s.stat}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {s.label}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div {...fadeUp}>
          <Card className="border-border/60">
            <CardContent className="divide-y divide-border/40 p-0">
              {MODEL.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.who}
                    className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <span className="flex w-44 shrink-0 items-center gap-2 text-sm font-semibold">
                      <Icon className={`h-4 w-4 ${m.accent}`} />
                      {m.who}
                    </span>
                    <span className="text-sm text-muted-foreground">{m.line}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        <motion.p
          {...fadeUp}
          className="mt-10 text-center font-mono text-sm text-muted-foreground"
        >
          Every assessment makes the graph smarter —{" "}
          <span className="text-emerald-400">and the graph is the moat.</span>
        </motion.p>
      </div>
    </section>
  );
}
