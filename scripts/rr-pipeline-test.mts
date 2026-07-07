import dotenv from "dotenv";
import { RocketRideClient } from "rocketride";

dotenv.config({ path: ".env.local" });

const client = new RocketRideClient({
  auth: process.env.ROCKETRIDE_API_KEY!,
  uri: "https://api.rocketride.ai",
  maxRetryTime: 30000,
  onEvent: async (e) => console.log("event:", e.event, JSON.stringify(e.body).slice(0, 300)),
  onConnectError: (m) => console.error("connect error:", m),
});

const env = {
  ROCKETRIDE_NEO4J_URI: process.env.NEO4J_URI ?? "",
  ROCKETRIDE_NEO4J_USER: process.env.NEO4J_USERNAME ?? "neo4j",
  ROCKETRIDE_NEO4J_PASSWORD: process.env.NEO4J_PASSWORD ?? "",
  ROCKETRIDE_BUTTERBASE_KEY: process.env.BUTTERBASE_SERVICE_KEY ?? "",
};

try {
  await client.connect();
  console.log("connected");
  const useResult = await client.use({
    filepath: "pipelines/resilience.pipe",
    source: "webhook_1",
    name: "resiliencepath-test",
    env,
    pipelineTraceLevel: "summary",
  });
  console.log("use OK, token:", useResult.token);
  const result = await client.send(
    useResult.token,
    "What is the top risk for the property at 2847 38th Ave, Oakland (prop-1), and what should they do first?",
    { name: "test.txt" },
    "text/plain"
  );
  console.log("RESULT:", JSON.stringify(result, null, 2).slice(0, 3000));
  await client.terminate(useResult.token);
} catch (e) {
  console.error("FAILED:", e);
  process.exitCode = 1;
} finally {
  await client.disconnect().catch(() => {});
}
