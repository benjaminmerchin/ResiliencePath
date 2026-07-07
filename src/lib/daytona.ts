/**
 * Daytona sandbox integration: the agent generates a Python resilience
 * simulation and executes it in an isolated sandbox, so the numbers in the
 * report are computed, not hallucinated.
 */
import { Daytona } from "@daytonaio/sdk";

export interface BackupSimResult {
  totalLoadW: number;
  backupHours: number;
  coversP95Outage: boolean;
  p95OutageHrs: number;
  nightsOfCpap: number;
  withSolarIndefinite: boolean;
  script: string;
}

export async function runBackupSimulation(params: {
  batteryKwh: number;
  avgOutageHrs: number;
  criticalDevices: { name: string; watts: number; hoursPerDay: number }[];
  hasSolar: boolean;
}): Promise<BackupSimResult> {
  const script = buildScript(params);
  const daytona = new Daytona({ apiKey: process.env.DAYTONA_API_KEY! });
  const sandbox = await daytona.create({ language: "python" });
  try {
    const response = await sandbox.process.codeRun(script);
    if (response.exitCode !== 0) {
      throw new Error(`simulation failed (${response.exitCode}): ${response.result}`);
    }
    const parsed = JSON.parse(response.result.trim().split("\n").pop() ?? "{}");
    return { ...parsed, script };
  } finally {
    await sandbox.delete().catch(() => {});
  }
}

function buildScript(params: {
  batteryKwh: number;
  avgOutageHrs: number;
  criticalDevices: { name: string; watts: number; hoursPerDay: number }[];
  hasSolar: boolean;
}): string {
  return `
import json, math, random

battery_wh = ${params.batteryKwh} * 1000 * 0.9   # usable capacity (90% DoD)
devices = ${JSON.stringify(params.criticalDevices)}
has_solar = ${params.hasSolar ? "True" : "False"}
avg_outage = ${params.avgOutageHrs}

# average continuous load across a day
total_load_w = sum(d["watts"] * d["hoursPerDay"] / 24.0 for d in devices)
backup_hours = battery_wh / total_load_w if total_load_w > 0 else float("inf")

# Monte Carlo outage durations (lognormal around historical mean)
random.seed(42)
mu = math.log(avg_outage)
outages = [random.lognormvariate(mu, 0.6) for _ in range(10000)]
outages.sort()
p95 = outages[int(0.95 * len(outages)) - 1]

cpap = next((d for d in devices if "cpap" in d["name"].lower()), None)
nights_of_cpap = battery_wh / (cpap["watts"] * cpap["hoursPerDay"]) if cpap else 0

print(json.dumps({
    "totalLoadW": round(total_load_w, 1),
    "backupHours": round(backup_hours, 1),
    "coversP95Outage": backup_hours >= p95 or has_solar,
    "p95OutageHrs": round(p95, 1),
    "nightsOfCpap": round(nights_of_cpap, 1),
    "withSolarIndefinite": has_solar,
}))
`.trim();
}

export async function tryBackupSimulation(
  params: Parameters<typeof runBackupSimulation>[0]
): Promise<BackupSimResult | null> {
  try {
    return await runBackupSimulation(params);
  } catch (e) {
    console.warn("daytona simulation failed:", e);
    return null;
  }
}
