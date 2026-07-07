# ResiliencePath

**The fastest way to get clean energy in your home — with every grant and discount you qualify for — planned around the disasters your address actually faces.**

Instead of generic climate advice, ResiliencePath models your home as a **risk graph**: what fails first when wildfire / heatwave / outage / flood hits, who in the household is vulnerable, and which upgrades cut the most risk per dollar — then funds the plan with real grants and orders it by weeks-to-installed.

> "I live in Oakland, my father uses a CPAP machine, and we lose power during storms."
>
> → Top risk: **power outage** — because the CPAP depends on Transformer T-42, which has no redundancy and is disrupted 45% of the time by storm outages.
> → Fastest funded path: **battery backup** (SGIP covers up to 100%), then **rooftop solar** (IRA 25D, 30%), then **heat pump** (TECH + BayREN).
> → Action plan: contractor to call, grant to file, install before fire season.

Built for **HackwithBay 3.0**.

## How each technology is load-bearing

### 🕸️ Neo4j — the risk graph (the product IS the graph)
Every assessment is a traversal, not a lookup:
- `(:Property)-[:EXPOSED_TO]->(:Hazard)` — address-specific exposure
- `(:Property|:Vulnerability)-[:DEPENDS_ON*]->(:Infrastructure)` — cascading lifeline dependencies (CPAP → transformer → feeder → substation)
- `(:Hazard)-[:DISRUPTS]->(:Infrastructure)` — how disasters propagate through the cascade
- `(:Upgrade)-[:MITIGATES]->(:Hazard)`, `(:Grant)-[:APPLIES_TO]->(:Upgrade)`, `(:Contractor)-[:INSTALLS]->(:Upgrade)` — the funded fix

Risk scores multiply exposure × disruption probability × vulnerability severity along paths (`src/lib/queries.ts`); upgrades are ranked by **risk reduction per effective dollar** after grant matching. The UI renders the explanation subgraph so users see *why*.

### 🚀 RocketRide Cloud — the deployed agent pipeline
`pipelines/resilience.pipe` runs on RocketRide Cloud (`api.rocketride.ai`): webhook source → question → **CrewAI resilience-advisor agent** with the Neo4j graph attached as a live tool (`db_neo4j`, NL→Cypher over Aura) → response. The Next.js app invokes it via the `rocketride` SDK (`src/lib/rocketride.ts`).

### 🧈 Butterbase — the entire backend
- **Database**: `households` + `assessments` tables (Postgres, RLS user isolation)
- **Auth**: email/password JWT sessions (`/auth/{app}/signup|login|me`)
- **Payments**: "ResiliencePath Pro" $9/mo via Butterbase billing — plan created through the billing API, subscribe flow returns Stripe Checkout, grant packet + contractor intros are Pro-gated in the UI. *Note: Stripe Connect's identity verification requires US business details our (France/UAE) team cannot provide, so live charges are pending that verification — the integration itself is complete and exercised up to Stripe's KYC wall.*
- **AI gateway**: the RocketRide pipeline's LLM node points at `https://api.butterbase.ai/v1` — Butterbase serves the model that powers the RocketRide agent

### 📦 Daytona (bonus) — computed, not hallucinated
The agent generates a Python Monte Carlo simulation (battery sizing vs. outage-duration distribution, CPAP nightly load) and executes it in a Daytona sandbox (`src/lib/daytona.ts`). The report's "38 nights of CPAP backup" is a computed number.

### 🧠 Cognee (bonus) — agent memory
After each assessment the agent stores what it learned (vulnerabilities, concerns, decisions) in a Cognee knowledge graph and recalls it at the start of the next one (`src/lib/cognee.ts`) — the advisor remembers your household across sessions.

## Stack
Next.js (App Router, TS) · Tailwind v4 · shadcn/ui · Motion · MagicUI · Neo4j Aura + NVL · Butterbase · RocketRide Cloud · Daytona · Cognee

## Run it

```bash
npm install
cp .env.example .env.local   # fill in keys (see below)
npx tsx scripts/seed-graph.ts   # seed the Oakland risk graph into Aura
npm run dev
```

`.env.local` needs: `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, `BUTTERBASE_SERVICE_KEY`, `NEXT_PUBLIC_BUTTERBASE_APP_ID`, `ROCKETRIDE_API_KEY`, `DAYTONA_API_KEY`, `COGNEE_API_URL`, `COGNEE_API_KEY`, `COGNEE_TENANT_ID`.

Demo flow: sign up → onboarding (address + household) → dashboard → **Run assessment** → risks, explanation graph, funded upgrade path, sandbox-simulated backup numbers, agent narrative → upgrade to Pro for the grant packet.

## Why this project should win

**Deep integration (the core judging criterion)** — nothing is bolted on:
- The **Neo4j graph is the product**: risk scores are multiplicative path traversals (exposure × annual probability × cascading `DEPENDS_ON*1..3` disruption × vulnerability severity), upgrades are ranked by risk-reduction-per-effective-dollar after `(:Grant)-[:APPLIES_TO]->(:Upgrade)` matching, and a single-point-of-failure analysis quantifies how many vulnerable residents share each lifeline. Remove Neo4j and there is no product.
- The **RocketRide Cloud pipeline is the agent**: a deployed 6-node DAG where the CrewAI advisor holds the live Neo4j graph as a NL→Cypher tool. Remove RocketRide and there is no reasoning.
- **Butterbase plays four roles at once**: Postgres+RLS data, JWT auth, Stripe Connect billing — and its AI gateway serves Claude *to the RocketRide pipeline itself*. The integrations integrate with each other.
- **Both bonus tracks are real**: Daytona executes an agent-generated 10,000-draw Monte Carlo per assessment (computed numbers, script preserved as provenance); Cognee gives the advisor compounding cross-session memory (add → cognify → GRAPH_COMPLETION recall).

**A demo with stakes** — not a CRUD app: "your father's CPAP depends on a transformer with no redundancy; the battery that fixes it is $0 after SGIP" is a real dependency chain from the graph, with real grant programs and computed backup-hours.

**Complete and live** — deployed frontend, deployed pipeline, seeded cloud graph, one-click demo login, working payments flow, business model (see [BUSINESS.md](BUSINESS.md)). Every number on the dashboard traces to a traversal, a sandboxed computation, or a pipeline run — nothing is hardcoded.

**Good for the world** — it points the most vulnerable households (elderly, medical-device-dependent) to money that already exists for them, before the disaster instead of after.
