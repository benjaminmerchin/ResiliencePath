"use client";

import { useMemo } from "react";
import { InteractiveNvlWrapper } from "@neo4j-nvl/react";
import type { Node, Relationship } from "@neo4j-nvl/base";
import { LABEL_COLORS, type GraphData } from "./risk-graph";

export default function NvlGraph({ data }: { data: GraphData }) {
  const { nodes, rels } = useMemo(() => {
    const nodes: Node[] = data.nodes.map((n) => ({
      id: n.id,
      color: LABEL_COLORS[n.label] ?? "#94a3b8",
      size: n.label === "Property" ? 34 : n.label === "Hazard" ? 26 : 20,
      captions: [{ value: n.caption }],
    }));
    const rels: Relationship[] = data.relationships.map((r) => ({
      id: r.id,
      from: r.from,
      to: r.to,
      color: "#475569",
      captions: [{ value: r.type.replaceAll("_", " ").toLowerCase() }],
    }));
    return { nodes, rels };
  }, [data]);

  return (
    <InteractiveNvlWrapper
      nodes={nodes}
      rels={rels}
      nvlOptions={{
        initialZoom: 1.1,
        renderer: "canvas",
      }}
      mouseEventCallbacks={{
        onZoom: true,
        onPan: true,
        onDrag: true,
      }}
    />
  );
}
