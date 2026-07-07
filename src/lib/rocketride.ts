/**
 * RocketRide Cloud client: invokes the deployed resilience-agent pipeline.
 * The pipeline (pipelines/resilience.pipe) runs on RocketRide Cloud and does
 * the agentic reasoning: NL→Cypher over the Neo4j risk graph + LLM synthesis
 * (served through the Butterbase AI gateway).
 *
 * A fresh client per invocation: serverless-safe and avoids stale WebSocket
 * state across requests.
 */
import path from "path";
import { RocketRideClient } from "rocketride";

const URI = "https://api.rocketride.ai";
const PIPE_PATH = path.join(process.cwd(), "pipelines", "resilience.pipe");

function pipelineEnv(): Record<string, string> {
  return {
    ROCKETRIDE_NEO4J_URI: process.env.NEO4J_URI ?? "",
    ROCKETRIDE_NEO4J_USER: process.env.NEO4J_USERNAME ?? "neo4j",
    ROCKETRIDE_NEO4J_PASSWORD: process.env.NEO4J_PASSWORD ?? "",
    ROCKETRIDE_BUTTERBASE_KEY: process.env.BUTTERBASE_SERVICE_KEY ?? "",
  };
}

/**
 * Send a prompt through the cloud pipeline and return the agent's text output.
 */
export async function runResiliencePipeline(input: string): Promise<string> {
  const client = new RocketRideClient({
    auth: process.env.ROCKETRIDE_API_KEY!,
    uri: URI,
    maxRetryTime: 30_000,
  });
  await client.connect();
  let token: string | undefined;
  try {
    const useResult = await client.use({
      filepath: PIPE_PATH,
      source: "webhook_1",
      name: "resiliencepath-assessment",
      env: pipelineEnv(),
    });
    token = useResult.token;
    const result = await client.send(
      token,
      input,
      { name: "assessment-request.txt" },
      "text/plain"
    );
    return extractText(result);
  } finally {
    if (token) await client.terminate(token).catch(() => {});
    await client.disconnect().catch(() => {});
  }
}

function extractText(result: unknown): string {
  if (typeof result === "string") return result;
  if (result && typeof result === "object") {
    const r = result as Record<string, unknown>;
    if (Array.isArray(r.answers) && typeof r.answers[0] === "string") {
      return r.answers[0];
    }
    for (const key of ["text", "answer", "response", "result", "output", "content"]) {
      if (typeof r[key] === "string") return r[key] as string;
    }
    return JSON.stringify(result);
  }
  return String(result ?? "");
}

export async function tryResiliencePipeline(input: string): Promise<{
  text: string;
  source: "rocketride-cloud" | "unavailable";
}> {
  try {
    const text = await runResiliencePipeline(input);
    return { text, source: "rocketride-cloud" };
  } catch (e) {
    console.warn("rocketride pipeline failed:", e);
    return { text: "", source: "unavailable" };
  }
}
