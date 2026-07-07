"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  BatteryCharging,
  Check,
  Home,
  Landmark,
  Network,
  PlugZap,
  ShieldCheck,
  Timer,
  User,
  Zap,
  ZapOff,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ArchitectureSection } from "@/components/architecture-section";
import { BusinessCase } from "@/components/business-case";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Particles } from "@/components/ui/particles";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { NumberTicker } from "@/components/ui/number-ticker";
import { BorderBeam } from "@/components/ui/border-beam";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <Particles
          className="absolute inset-0"
          quantity={90}
          color="#34d399"
          ease={60}
        />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pb-24 pt-24 text-center sm:pt-32">
          <motion.div {...fadeUp}>
            <AnimatedGradientText className="mb-6 text-sm">
              ⚡ Graph-powered clean-energy planning
            </AnimatedGradientText>
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.05 }}
            className="max-w-3xl text-balance bg-gradient-to-b from-white to-white/60 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl"
          >
            Clean energy for your home.{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Faster, cheaper, ready for anything.
            </span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground"
          >
            We find every grant you qualify for and order your upgrades by
            speed, savings — and the risks your address actually faces. Solar,
            batteries, heat pumps: funded, scheduled, and resilient.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.15 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          >
            <Link href="/auth?mode=signup">
              <ShimmerButton
                shimmerColor="#34d399"
                background="rgba(6, 78, 59, 1)"
                className="px-8 py-3 text-base font-semibold text-emerald-50"
              >
                Get your funded plan
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </ShimmerButton>
            </Link>
            <Button asChild variant="ghost" size="lg" className="text-muted-foreground">
              <Link href="#how">How it works</Link>
            </Button>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.2 }}
            className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <StatCard
              prefix="$"
              value={30}
              suffix="k+"
              label="in rebates & credits found per home"
            />
            <StatCard value={6} suffix=" wks" label="to your first installed upgrade" />
            <StatCard value={85} suffix="%" label="of outage risk cut by upgrade #1" />
          </motion.div>
        </div>
      </section>

      {/* Value chain */}
      <section className="border-y border-border/40 bg-card/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <motion.p {...fadeUp} className="mb-8 text-center text-sm uppercase tracking-widest text-muted-foreground">
            Why a graph? Because your home is a chain of dependencies
          </motion.p>
          <motion.div
            {...fadeUp}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
          >
            <ChainNode icon={<User className="h-4 w-4" />} label="Your father" color="text-violet-400 border-violet-400/30 bg-violet-400/10" />
            <ChainArrow />
            <ChainNode icon={<PlugZap className="h-4 w-4" />} label="CPAP machine" color="text-amber-400 border-amber-400/30 bg-amber-400/10" />
            <ChainArrow />
            <ChainNode icon={<Zap className="h-4 w-4" />} label="Transformer T-42" color="text-blue-400 border-blue-400/30 bg-blue-400/10" />
            <ChainArrow />
            <ChainNode icon={<ZapOff className="h-4 w-4" />} label="Outage risk" color="text-red-400 border-red-400/30 bg-red-400/10" />
            <ChainArrow />
            <ChainNode icon={<BatteryCharging className="h-4 w-4" />} label="Battery backup" color="text-emerald-400 border-emerald-400/30 bg-emerald-400/10" />
            <ChainArrow />
            <ChainNode icon={<Landmark className="h-4 w-4" />} label="100% SGIP rebate" color="text-cyan-400 border-cyan-400/30 bg-cyan-400/10" />
          </motion.div>
          <motion.p {...fadeUp} className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
            Generic advice sees a house. Our agent traverses the actual graph —
            residents, medical devices, grid infrastructure, hazards, upgrades,
            grants — and finds the path that cuts the most risk per dollar,
            fastest.
          </motion.p>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24">
        <div className="mx-auto max-w-6xl px-4">
          <motion.h2 {...fadeUp} className="mb-14 text-center text-3xl font-bold tracking-tight">
            Three steps to a funded, resilient home
          </motion.h2>
          <div className="grid gap-6 md:grid-cols-3">
            <StepCard
              n={1}
              icon={<Home className="h-5 w-5" />}
              title="Tell us about your home"
              body="Your address, who lives there, and what worries you. Two minutes — no site visit."
            />
            <StepCard
              n={2}
              icon={<Network className="h-5 w-5" />}
              title="The agent walks your risk graph"
              body="It traverses your home's dependencies in Neo4j — grid lines, hazards, vulnerabilities — and simulates what fails first."
            />
            <StepCard
              n={3}
              icon={<Timer className="h-5 w-5" />}
              title="Get the fastest funded path"
              body="Upgrades ordered by speed and savings, every matching grant attached, and the contractor to call this week."
            />
          </div>
        </div>
      </section>

      {/* Architecture / under the hood */}
      <ArchitectureSection />

      {/* Business case */}
      <BusinessCase />

      {/* Pricing */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-4">
          <motion.h2 {...fadeUp} className="mb-4 text-center text-3xl font-bold tracking-tight">
            Start free. Upgrade when you&apos;re ready to act.
          </motion.h2>
          <motion.p {...fadeUp} className="mb-12 text-center text-muted-foreground">
            The assessment is free forever. Pro unlocks the money.
          </motion.p>
          <div className="grid gap-6 md:grid-cols-2">
            <motion.div {...fadeUp}>
              <Card className="h-full border-border/60">
                <CardContent className="flex h-full flex-col p-6">
                  <h3 className="text-lg font-semibold">Free assessment</h3>
                  <p className="mt-1 text-3xl font-bold">$0</p>
                  <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                    <PriceLine>Address-specific risk graph</PriceLine>
                    <PriceLine>Top-risk analysis with the “why” path</PriceLine>
                    <PriceLine>Recommended upgrade order</PriceLine>
                  </ul>
                  <Button asChild variant="outline" className="mt-8 w-full">
                    <Link href="/auth?mode=signup">Run my assessment</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
              <Card className="relative h-full overflow-hidden border-emerald-500/30">
                <BorderBeam colorFrom="#34d399" colorTo="#22d3ee" />
                <CardContent className="flex h-full flex-col p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Pro</h3>
                    <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15">
                      Most popular
                    </Badge>
                  </div>
                  <p className="mt-1 text-3xl font-bold">
                    $9<span className="text-base font-normal text-muted-foreground">/mo</span>
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                    <PriceLine>Full upgrade roadmap with timelines</PriceLine>
                    <PriceLine>Grant application packet — every $ you qualify for</PriceLine>
                    <PriceLine>Contractor introductions</PriceLine>
                    <PriceLine>Seasonal risk alerts</PriceLine>
                  </ul>
                  <Button
                    asChild
                    className="mt-8 w-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                  >
                    <Link href="/auth?mode=signup">
                      Get Pro <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="border-t border-border/40 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
          <p className="text-sm text-muted-foreground">
            ResiliencePath — built for HackwithBay 3.0 with Neo4j, RocketRide
            Cloud, Butterbase, Daytona &amp; Cognee.
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({
  value,
  label,
  prefix,
  suffix,
}: {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-5 backdrop-blur">
      <p className="text-3xl font-bold text-emerald-400">
        {prefix}
        <NumberTicker value={value} className="text-emerald-400" />
        {suffix}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ChainNode({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <span
      className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium ${color}`}
    >
      {icon}
      {label}
    </span>
  );
}

function ChainArrow() {
  return <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />;
}

function StepCard({
  n,
  icon,
  title,
  body,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: n * 0.06 }}>
      <Card className="h-full border-border/60 bg-card/50">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/30">
              {icon}
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Step {n}
            </span>
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PriceLine({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
      {children}
    </li>
  );
}
