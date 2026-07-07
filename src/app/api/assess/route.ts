import { NextRequest, NextResponse } from "next/server";
import { chatCompletion, db } from "@/lib/butterbase";
import { unwrapList } from "@/lib/jsonb";
import { getUser } from "@/lib/session";
import {
  getRiskAssessment,
  getUpgradePlan,
  getExplanationGraph,
} from "@/lib/queries";
import { tryResiliencePipeline } from "@/lib/rocketride";
import { tryBackupSimulation } from "@/lib/daytona";
import { tryRecall, tryRemember } from "@/lib/cognee";

interface HouseholdRow {
  id: string;
  user_id: string;
  address: string;
  property_id: string | null;
  concerns: string[] | null;
  vulnerabilities: string[] | null;
}

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const session = await getUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { householdId } = await req.json();
  const [row] = await db.select<HouseholdRow>(
    "households",
    `id=eq.${householdId}`,
    session.token
  );
  if (!row) return NextResponse.json({ error: "household not found" }, { status: 404 });
  const household: HouseholdRow = {
    ...row,
    concerns: unwrapList(row.concerns) as string[],
    vulnerabilities: unwrapList(row.vulnerabilities) as string[],
  };

  const propertyId = household.property_id ?? "prop-1";

  // 1. Neo4j: traverse the risk graph — hazards × infrastructure cascades × vulnerabilities
  const risks = await getRiskAssessment(propertyId);
  const [upgrades, graph, memories] = await Promise.all([
    getUpgradePlan(propertyId, risks),
    getExplanationGraph(propertyId),
    // 2. Cognee: recall what the agent already knows about this household
    tryRecall(`household at ${household.address}: vulnerabilities, concerns, past assessments`),
  ]);

  // 3. Daytona: compute (don't hallucinate) battery backup coverage in a sandbox
  const topOutageRisk = risks.find((r) => r.hazardId === "hz-outage");
  const hasCpap = JSON.stringify(household.vulnerabilities ?? [])
    .toLowerCase()
    .includes("cpap") ||
    risks.some((r) =>
      r.affectedVulnerabilities.some((v) => v.name.toLowerCase().includes("cpap"))
    );
  const simulation = topOutageRisk
    ? await tryBackupSimulation({
        batteryKwh: 13.5,
        avgOutageHrs:
          topOutageRisk.disruptedInfrastructure[0]?.avgDurationHrs ?? 14,
        criticalDevices: [
          ...(hasCpap ? [{ name: "CPAP machine", watts: 40, hoursPerDay: 8 }] : []),
          { name: "refrigerator", watts: 150, hoursPerDay: 24 },
          { name: "phone + router + lights", watts: 60, hoursPerDay: 12 },
        ],
        hasSolar: false,
      })
    : null;

  // 4. RocketRide Cloud: the deployed agent pipeline reasons over the graph
  const pipelineInput = buildAgentPrompt(household, risks, upgrades, simulation, memories);
  let narrative = await tryResiliencePipeline(pipelineInput);
  if (narrative.source === "unavailable") {
    // fallback so a demo never dies — flagged in the result payload
    const text = await chatCompletion([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: pipelineInput },
    ]);
    narrative = { text, source: "unavailable" };
  }

  const result = {
    propertyId,
    risks,
    upgrades,
    graph,
    simulation,
    memories,
    narrative: narrative.text,
    narrativeSource: narrative.source,
    generatedAt: new Date().toISOString(),
  };

  // 5. Butterbase: persist the assessment (RLS-scoped to this user)
  const assessment = await db.insert(
    "assessments",
    {
      user_id: session.user.id,
      household_id: household.id,
      status: "complete",
      result,
    },
    session.token
  );

  // 6. Cognee: remember what we learned for next time
  void tryRemember(
    `Assessment for household at ${household.address} (${new Date().toISOString().slice(0, 10)}): ` +
      `top risk ${risks[0]?.hazard} (score ${risks[0]?.riskScore}); ` +
      `recommended first upgrade: ${upgrades[0]?.upgrade}; ` +
      `vulnerabilities: ${JSON.stringify(household.vulnerabilities ?? [])}; ` +
      `concerns: ${JSON.stringify(household.concerns ?? [])}.`
  );

  return NextResponse.json({ assessment });
}

const SYSTEM_PROMPT = `You are ResiliencePath's disaster-resilience advisor. Given graph-derived risk data for a specific home, write a clear, empathetic assessment with:
1. **Top risk** — the single highest-impact hazard and WHY (name the exact dependency chain, e.g. "your father's CPAP depends on Transformer T-42 which has no redundancy").
2. **Fastest funded path to clean energy** — the ordered upgrades, each with effective cost after grants, weeks to installed, and what it protects; call out total grant savings and total timeline.
3. **Action plan** — concrete next steps: which contractor to call, which grant to apply for, and timing relative to hazard season.
Be specific with numbers from the data. Keep it under 400 words. Use markdown.`;

function buildAgentPrompt(
  household: HouseholdRow,
  risks: unknown,
  upgrades: unknown,
  simulation: unknown,
  memories: string[]
): string {
  return [
    `Assess disaster resilience for the home at ${household.address}.`,
    `Household-stated concerns: ${JSON.stringify(household.concerns ?? [])}`,
    `Household-stated vulnerabilities: ${JSON.stringify(household.vulnerabilities ?? [])}`,
    memories.length ? `Agent memory of this household: ${memories.join(" | ")}` : "",
    `Graph risk analysis (Neo4j): ${JSON.stringify(risks)}`,
    `Ranked upgrades with grants (Neo4j): ${JSON.stringify(upgrades)}`,
    simulation ? `Sandbox-computed battery simulation (Daytona): ${JSON.stringify(simulation)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}
