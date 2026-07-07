"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode, useMemo } from "react";

export interface GraphData {
  nodes: { id: string; label: string; kind: string; caption: string }[];
  relationships: { id: string; from: string; to: string; type: string }[];
}

const NvlGraph = dynamic(() => import("./risk-graph-nvl"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
      Rendering risk graph…
    </div>
  ),
});

export const LABEL_COLORS: Record<string, string> = {
  Property: "#34d399", // emerald
  Hazard: "#f87171", // red
  Infrastructure: "#60a5fa", // blue
  Resident: "#a78bfa", // violet
  Vulnerability: "#fbbf24", // amber
  Upgrade: "#4ade80", // green
  Grant: "#22d3ee", // cyan
  Contractor: "#f472b6", // pink
};

export function RiskGraph({ data }: { data: GraphData }) {
  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-xl border border-border/60 bg-[#0b1220]">
      <GraphErrorBoundary fallback={<CircularSvgGraph data={data} />}>
        <NvlGraph data={data} />
      </GraphErrorBoundary>
      <Legend data={data} />
    </div>
  );
}

function Legend({ data }: { data: GraphData }) {
  const labels = Array.from(new Set(data.nodes.map((n) => n.label)));
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 flex max-w-[90%] flex-wrap gap-x-3 gap-y-1 rounded-lg bg-black/40 px-3 py-2 backdrop-blur">
      {labels.map((l) => (
        <span key={l} className="flex items-center gap-1.5 text-[11px] text-white/80">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: LABEL_COLORS[l] ?? "#94a3b8" }}
          />
          {l}
        </span>
      ))}
    </div>
  );
}

class GraphErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

/** Deterministic circular layout fallback if WebGL/NVL fails. */
function CircularSvgGraph({ data }: { data: GraphData }) {
  const positions = useMemo(() => {
    const byLabel = new Map<string, { x: number; y: number }>();
    const W = 900;
    const H = 480;
    const cx = W / 2;
    const cy = H / 2;
    const n = data.nodes.length || 1;
    data.nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const r = node.label === "Property" ? 0 : 150 + (i % 3) * 45;
      byLabel.set(node.id, {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      });
    });
    return { byLabel, W, H };
  }, [data]);

  return (
    <svg
      viewBox={`0 0 ${positions.W} ${positions.H}`}
      className="h-full w-full"
      role="img"
      aria-label="Risk graph"
    >
      {data.relationships.map((r) => {
        const a = positions.byLabel.get(r.from);
        const b = positions.byLabel.get(r.to);
        if (!a || !b) return null;
        return (
          <line
            key={r.id}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="#334155"
            strokeWidth={1}
          />
        );
      })}
      {data.nodes.map((n) => {
        const p = positions.byLabel.get(n.id);
        if (!p) return null;
        return (
          <g key={n.id}>
            <circle
              cx={p.x}
              cy={p.y}
              r={n.label === "Property" ? 16 : 10}
              fill={LABEL_COLORS[n.label] ?? "#94a3b8"}
              fillOpacity={0.9}
            />
            <text
              x={p.x}
              y={p.y - 16}
              textAnchor="middle"
              className="fill-white/70"
              fontSize={10}
            >
              {n.caption}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
