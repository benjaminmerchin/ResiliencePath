import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const { getRiskAssessment, getUpgradePlan, getExplanationGraph } = await import(
  "../src/lib/queries"
);
const { getDriver } = await import("../src/lib/neo4j");

const risks = await getRiskAssessment("prop-1");
console.log("--- risks:");
for (const r of risks) {
  console.log(
    `${r.hazard}: score=${r.riskScore} infra=[${r.disruptedInfrastructure.map((i) => i.name).join(", ")}] vulns=[${r.affectedVulnerabilities.map((v) => v.name).join(", ")}]`
  );
}

const upgrades = await getUpgradePlan("prop-1", risks);
console.log("--- upgrades:");
for (const u of upgrades) {
  console.log(
    `${u.upgrade}: $${u.costUsd} → $${u.effectiveCostUsd} (grants: ${u.grants.map((g) => `${g.name} -$${g.savingsUsd}`).join("; ") || "none"}) score/k=${u.riskReductionPerK} lead=${u.leadWeeks}w`
  );
}

const graph = await getExplanationGraph("prop-1");
console.log(`--- graph: ${graph.nodes.length} nodes, ${graph.relationships.length} rels`);

await getDriver().close();
