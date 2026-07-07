import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const { getCommunityImpact } = await import("../src/lib/queries");
const { getDriver } = await import("../src/lib/neo4j");
console.log(JSON.stringify(await getCommunityImpact("prop-1"), null, 1));
await getDriver().close();
