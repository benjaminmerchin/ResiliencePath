import dotenv from "dotenv";
import fs from "fs";
import { RocketRideClient } from "rocketride";

dotenv.config({ path: ".env.local" });

// Substitute ${ROCKETRIDE_*} refs so the persistent deployment is self-contained.
const env: Record<string, string> = {
  ROCKETRIDE_NEO4J_URI: process.env.NEO4J_URI!,
  ROCKETRIDE_NEO4J_USER: process.env.NEO4J_USERNAME ?? "neo4j",
  ROCKETRIDE_NEO4J_PASSWORD: process.env.NEO4J_PASSWORD!,
  ROCKETRIDE_BUTTERBASE_KEY: process.env.BUTTERBASE_SERVICE_KEY!,
};
let raw = fs.readFileSync("pipelines/resilience.pipe", "utf8");
for (const [k, v] of Object.entries(env)) {
  raw = raw.replaceAll(`\${${k}}`, v);
}
const pipeline = JSON.parse(raw);

const client = new RocketRideClient({
  auth: process.env.ROCKETRIDE_API_KEY!,
  uri: "https://api.rocketride.ai",
  maxRetryTime: 60000,
});

await client.connect();
const record = await client.deploy.add(pipeline, { schedule: "manual" });
console.log("deployed:", JSON.stringify(record, null, 2).slice(0, 800));
const list = await client.deploy.list();
console.log("deployments now:", list.length);
await client.disconnect();
