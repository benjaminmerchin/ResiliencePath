import { RocketRideClient } from "rocketride";

const client = new RocketRideClient({
  auth: process.env.ROCKETRIDE_API_KEY!,
  uri: "https://api.rocketride.ai",
  maxRetryTime: 30000,
  onConnectError: (m) => console.error("connect error:", m),
});

try {
  await client.connect();
  console.log("connected OK");
  const deployments = await client.deploy.list();
  console.log("deployments:", JSON.stringify(deployments, null, 2));
} catch (e) {
  console.error("FAILED:", e);
  process.exit(1);
} finally {
  await client.disconnect().catch(() => {});
}
