/**
 * Graph queries powering the resilience assessment.
 * These traversals are the core product: cascading-dependency risk scoring,
 * upgrade ranking by risk-reduction-per-dollar, grant matching, and the
 * explanation subgraph rendered in the UI.
 */
import { read } from "./neo4j";

export interface HazardRisk {
  hazardId: string;
  hazard: string;
  icon: string;
  exposure: number;
  annualProbability: number;
  riskScore: number;
  disruptedInfrastructure: {
    name: string;
    type: string;
    redundancy: string;
    probability: number;
    avgDurationHrs: number;
    criticality: string;
  }[];
  affectedVulnerabilities: {
    name: string;
    severity: number;
    kind: string;
    resident: string | null;
  }[];
}

/**
 * Rank hazards for a property by traversing:
 * exposure × infrastructure-disruption (incl. cascades) × household vulnerability.
 */
export async function getRiskAssessment(propertyId: string): Promise<HazardRisk[]> {
  const rows = await read<{
    hazardId: string;
    hazard: string;
    icon: string;
    exposure: number;
    annualProbability: number;
    riskScore: number;
    infra: HazardRisk["disruptedInfrastructure"];
    vulns: HazardRisk["affectedVulnerabilities"];
  }>(
    `
    MATCH (p:Property {id: $propertyId})-[e:EXPOSED_TO]->(h:Hazard)
    // infrastructure the property depends on (directly or via cascade) that this hazard disrupts
    OPTIONAL MATCH (p)-[dep:DEPENDS_ON]->(i0:Infrastructure)
    OPTIONAL MATCH cascade = (i0)-[:DEPENDS_ON*0..2]->(i:Infrastructure)<-[d:DISRUPTS]-(h)
    WITH p, h, e,
         collect(DISTINCT CASE WHEN d IS NULL THEN null ELSE {
           name: i0.name, type: i0.type, redundancy: i0.redundancy,
           probability: d.probability, avgDurationHrs: d.avgDurationHrs,
           criticality: dep.criticality
         } END) AS infraRaw
    // household vulnerabilities whose lifeline infrastructure this hazard knocks out
    OPTIONAL MATCH (r:Resident)-[:LIVES_AT]->(p)
    OPTIONAL MATCH (r)-[:HAS_VULNERABILITY]->(v:Vulnerability)-[:DEPENDS_ON]->(vi:Infrastructure)
    OPTIONAL MATCH (vi)-[:DEPENDS_ON*0..2]->(:Infrastructure)<-[vd:DISRUPTS]-(h)
    WITH p, h, e, infraRaw,
         collect(DISTINCT CASE WHEN vd IS NULL THEN null ELSE {
           name: v.name, severity: v.severity, kind: v.kind, resident: r.name
         } END) AS vulnsRaw
    // building-level vulnerabilities (attached to the property itself)
    OPTIONAL MATCH (p)-[:HAS_VULNERABILITY]->(bv:Vulnerability)
    WITH h, e, infraRaw, vulnsRaw,
         collect(DISTINCT CASE WHEN bv IS NULL THEN null ELSE {
           name: bv.name, severity: bv.severity, kind: bv.kind, resident: null
         } END) AS bldgRaw
    WITH h, e,
         [x IN infraRaw WHERE x IS NOT NULL] AS infra,
         [x IN vulnsRaw WHERE x IS NOT NULL] + [x IN bldgRaw WHERE x IS NOT NULL] AS vulns
    WITH h, e, infra, vulns,
         reduce(m = 0.0, x IN infra | CASE WHEN x.probability > m THEN x.probability ELSE m END) AS maxDisruption,
         reduce(s = 0.0, x IN vulns | s + x.severity) AS vulnWeight
    RETURN h.id AS hazardId, h.name AS hazard, h.icon AS icon,
           e.score AS exposure, h.annualProbability AS annualProbability,
           e.score * h.annualProbability * (0.4 + 0.6 * maxDisruption) * (1.0 + vulnWeight) AS riskScore,
           infra, vulns
    ORDER BY riskScore DESC
    `,
    { propertyId }
  );
  return rows.map((r) => ({
    hazardId: r.hazardId,
    hazard: r.hazard,
    icon: r.icon,
    exposure: r.exposure,
    annualProbability: r.annualProbability,
    riskScore: Math.round(r.riskScore * 100) / 100,
    disruptedInfrastructure: Array.from(
      new Map(r.infra.map((i) => [i.name, i])).values()
    ),
    affectedVulnerabilities: r.vulns,
  }));
}

export interface UpgradeRecommendation {
  upgradeId: string;
  upgrade: string;
  category: string;
  costUsd: number;
  leadWeeks: number;
  mitigates: { hazard: string; reduction: number; riskScore: number }[];
  grants: {
    name: string;
    agency: string;
    savingsUsd: number;
    requirement: string | null;
    expires: string;
  }[];
  effectiveCostUsd: number;
  riskReductionPerK: number;
  contractors: { name: string; rating: number; phone: string }[];
}

/**
 * Rank upgrades by risk-reduction-per-dollar after applying matching grants.
 */
export async function getUpgradePlan(
  propertyId: string,
  hazardRisks: { hazardId: string; riskScore: number }[]
): Promise<UpgradeRecommendation[]> {
  const rows = await read<{
    upgradeId: string;
    upgrade: string;
    category: string;
    costUsd: number;
    leadWeeks: number;
    mitigations: { hazardId: string; hazard: string; reduction: number }[];
    grants: {
      name: string;
      agency: string;
      pct: number | null;
      maxUsd: number | null;
      requirement: string | null;
      expires: string;
    }[];
    contractors: { name: string; rating: number; phone: string }[];
  }>(
    `
    MATCH (p:Property {id: $propertyId})-[e:EXPOSED_TO]->(h:Hazard)<-[m:MITIGATES]-(u:Upgrade)
    WITH u, collect({hazardId: h.id, hazard: h.name, reduction: m.reduction}) AS mitigations
    OPTIONAL MATCH (g:Grant)-[:APPLIES_TO]->(u)
    WITH u, mitigations,
         collect(DISTINCT CASE WHEN g IS NULL THEN null ELSE {
           name: g.name, agency: g.agency, pct: g.pct, maxUsd: g.maxUsd,
           requirement: g.requirement, expires: g.expires
         } END) AS grantsRaw
    OPTIONAL MATCH (c:Contractor)-[:INSTALLS]->(u)
    RETURN u.id AS upgradeId, u.name AS upgrade, u.category AS category,
           u.costUsd AS costUsd, u.leadWeeks AS leadWeeks,
           mitigations,
           [x IN grantsRaw WHERE x IS NOT NULL] AS grants,
           collect(DISTINCT CASE WHEN c IS NULL THEN null ELSE {
             name: c.name, rating: c.rating, phone: c.phone
           } END)[..3] AS contractors
    `,
    { propertyId }
  );

  const riskByHazard = new Map(hazardRisks.map((h) => [h.hazardId, h.riskScore]));

  const recs: UpgradeRecommendation[] = rows.map((r) => {
    const grants = r.grants.map((g) => ({
      name: g.name,
      agency: g.agency,
      savingsUsd: Math.min(
        g.pct != null ? Math.round(r.costUsd * g.pct) : (g.maxUsd ?? 0),
        g.maxUsd ?? Number.MAX_SAFE_INTEGER
      ),
      requirement: g.requirement,
      expires: g.expires,
    }));
    const totalSavings = Math.min(
      grants.reduce((s, g) => s + g.savingsUsd, 0),
      r.costUsd
    );
    const effectiveCostUsd = Math.max(r.costUsd - totalSavings, 0);
    const mitigates = r.mitigations.map((m) => ({
      hazard: m.hazard,
      reduction: m.reduction,
      riskScore: riskByHazard.get(m.hazardId) ?? 0,
    }));
    const totalRiskReduction = mitigates.reduce(
      (s, m) => s + m.reduction * m.riskScore,
      0
    );
    return {
      upgradeId: r.upgradeId,
      upgrade: r.upgrade,
      category: r.category,
      costUsd: r.costUsd,
      leadWeeks: r.leadWeeks,
      mitigates,
      grants,
      effectiveCostUsd,
      riskReductionPerK:
        Math.round((totalRiskReduction / Math.max(effectiveCostUsd, 500)) * 1000 * 100) / 100,
      contractors: r.contractors.filter(Boolean) as UpgradeRecommendation["contractors"],
    };
  });

  return recs.sort((a, b) => b.riskReductionPerK - a.riskReductionPerK);
}

export interface GraphData {
  nodes: { id: string; label: string; kind: string; caption: string }[];
  relationships: { id: string; from: string; to: string; type: string }[];
}

/**
 * Explanation subgraph for the UI: every path that justifies the assessment —
 * resident → vulnerability → lifeline infrastructure ← hazard, plus
 * upgrade → mitigation and grant → upgrade edges.
 */
export async function getExplanationGraph(propertyId: string): Promise<GraphData> {
  const rows = await read<{ nodes: GraphData["nodes"]; rels: GraphData["relationships"] }>(
    `
    MATCH (p:Property {id: $propertyId})
    CALL (p) {
      MATCH path = (r:Resident)-[:LIVES_AT]->(p) RETURN path
      UNION
      MATCH path = (p)-[:EXPOSED_TO]->(:Hazard) RETURN path
      UNION
      MATCH path = (p)-[:DEPENDS_ON]->(:Infrastructure)-[:DEPENDS_ON*0..2]->(:Infrastructure) RETURN path
      UNION
      MATCH (r:Resident)-[:LIVES_AT]->(p)
      MATCH path = (r)-[:HAS_VULNERABILITY]->(:Vulnerability)-[:DEPENDS_ON]->(:Infrastructure) RETURN path
      UNION
      MATCH path = (p)-[:HAS_VULNERABILITY]->(:Vulnerability) RETURN path
      UNION
      MATCH (p)-[:EXPOSED_TO]->(h:Hazard)
      MATCH path = (h)-[:DISRUPTS]->(:Infrastructure) RETURN path
      UNION
      MATCH (p)-[:EXPOSED_TO]->(h:Hazard)
      MATCH path = (:Upgrade)-[:MITIGATES]->(h) RETURN path
      UNION
      MATCH (p)-[:EXPOSED_TO]->(h:Hazard)<-[:MITIGATES]-(u:Upgrade)
      MATCH path = (:Grant)-[:APPLIES_TO]->(u) RETURN path
      UNION
      MATCH (p)-[:EXPOSED_TO]->(h:Hazard)<-[:MITIGATES]-(u:Upgrade)
      MATCH path = (:Contractor)-[:INSTALLS]->(u) RETURN path
    }
    WITH collect(path) AS paths
    WITH reduce(ns = [], x IN paths | ns + nodes(x)) AS allNodes,
         reduce(rs = [], x IN paths | rs + relationships(x)) AS allRels
    RETURN
      [n IN allNodes | {
        id: n.id, label: labels(n)[0], kind: coalesce(n.type, n.kind, n.category, labels(n)[0]),
        caption: coalesce(n.name, n.address, n.id)
      }] AS nodes,
      [r IN allRels | {
        id: elementId(r),
        from: startNode(r).id, to: endNode(r).id, type: type(r)
      }] AS rels
    `,
    { propertyId }
  );
  const row = rows[0];
  if (!row) return { nodes: [], relationships: [] };
  const nodes = Array.from(new Map(row.nodes.map((n) => [n.id, n])).values());
  const rels = Array.from(new Map(row.rels.map((r) => [r.id, r])).values());
  return { nodes, relationships: rels };
}

export interface CommunityImpact {
  infrastructure: string;
  type: string;
  redundancy: string;
  householdsServed: number;
  vulnerableResidents: number;
  hazards: string[];
}

/**
 * Single-point-of-failure analysis: for each lifeline this property depends
 * on, how many other modeled households share it, how many vulnerable
 * residents sit downstream, and which hazards can take it out. Upgrading one
 * home hardens the whole block — this quantifies that.
 */
export async function getCommunityImpact(propertyId: string): Promise<CommunityImpact[]> {
  return read<CommunityImpact>(
    `
    MATCH (p:Property {id: $propertyId})-[:DEPENDS_ON]->(i:Infrastructure)
    OPTIONAL MATCH (other:Property)-[:DEPENDS_ON]->(i) WHERE other.id <> p.id
    OPTIONAL MATCH (r:Resident)-[:LIVES_AT]->(:Property)-[:DEPENDS_ON]->(i)
    OPTIONAL MATCH (r)-[:HAS_VULNERABILITY]->(v:Vulnerability)
    OPTIONAL MATCH (h:Hazard)-[:DISRUPTS]->(i)
    RETURN i.name AS infrastructure, i.type AS type, i.redundancy AS redundancy,
           count(DISTINCT other) + 1 AS householdsServed,
           count(DISTINCT v) AS vulnerableResidents,
           collect(DISTINCT h.name) AS hazards
    ORDER BY householdsServed DESC, vulnerableResidents DESC
    `,
    { propertyId }
  );
}
