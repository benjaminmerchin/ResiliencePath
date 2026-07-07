"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Share2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ImpactRow {
  infrastructure: string;
  type: string;
  redundancy: string;
  householdsServed: number;
  vulnerableResidents: number;
  hazards: string[];
}

const REDUNDANCY_STYLES: Record<string, string> = {
  none: "border-red-400/40 bg-red-400/10 text-red-300",
  low: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  medium: "border-blue-400/40 bg-blue-400/10 text-blue-300",
  high: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
};

export function CommunityImpact({ propertyId }: { propertyId: string }) {
  const [impact, setImpact] = useState<ImpactRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/community?propertyId=${encodeURIComponent(propertyId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.impact?.length) setImpact(d.impact);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  if (!impact) return null;

  return (
    <section>
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        <Share2 className="h-4 w-4 text-blue-400" />
        Your lifelines are shared
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Single-point-of-failure analysis across the modeled neighborhood graph
        — each cascading dependency below serves more homes than yours.
      </p>
      <Card className="border-border/60">
        <CardContent className="divide-y divide-border/40 p-0">
          {impact.map((row, i) => (
            <motion.div
              key={row.infrastructure}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5"
            >
              <span className="min-w-48 text-sm font-medium">
                {row.infrastructure}
              </span>
              <Badge
                variant="outline"
                className={`font-mono text-[10px] ${
                  REDUNDANCY_STYLES[row.redundancy] ?? REDUNDANCY_STYLES.medium
                }`}
              >
                {row.redundancy === "none"
                  ? "single point of failure"
                  : `${row.redundancy} redundancy`}
              </Badge>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5 text-violet-400" />
                serves {row.householdsServed} modeled household
                {row.householdsServed === 1 ? "" : "s"} ·{" "}
                {row.vulnerableResidents} vulnerable resident
                {row.vulnerableResidents === 1 ? "" : "s"} downstream
              </span>
              <span className="ml-auto flex flex-wrap gap-1.5">
                {row.hazards.map((h) => (
                  <Badge
                    key={h}
                    variant="outline"
                    className="border-red-400/30 bg-red-400/10 text-[10px] text-red-300"
                  >
                    {h}
                  </Badge>
                ))}
              </span>
            </motion.div>
          ))}
        </CardContent>
      </Card>
      <p className="mt-3 text-xs text-muted-foreground">
        A battery on your home keeps the block&apos;s most vulnerable resident
        breathing when Transformer T-42 goes down.
      </p>
    </section>
  );
}
