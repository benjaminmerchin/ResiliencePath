# ResiliencePath — Business Plan

## The problem, in dollars
- The U.S. suffered **27 separate billion-dollar weather disasters in 2024 alone**; annual weather-disaster losses now exceed **$100B**.
- **$8.8B** in IRA home-energy rebates (HOMES + HEEHRA) plus state programs (SGIP, BayREN, TECH Clean California) sit largely unclaimed because homeowners can't navigate eligibility.
- FEMA estimates **every $1 of pre-disaster mitigation saves ~$6** in avoided losses.
- **30M+ U.S. homes** sit in high wildfire, flood, or outage-risk zones — and the most vulnerable households (elderly, medical-device-dependent) are the least equipped to plan.

The market failure: climate adaptation advice is generic, grants are fragmented across federal/state/utility programs, and nobody models the *actual failure chain* of a specific home. The result is money left on the table and lives left exposed.

## The product
A graph-native planning agent: model each home as a **risk graph** (residents → vulnerabilities → lifeline infrastructure → hazards), traverse it to find what fails first, then output the **fastest funded path to clean energy** — upgrades ranked by risk-reduction-per-effective-dollar after automatic grant matching, with a contractor and a timeline attached.

Differentiator vs. clean-energy marketplaces (e.g. GridPath-style "connect me to solar"): we rank by **address-specific cascading risk**, not by generic savings — which is why a CPAP household gets a battery *before* solar, funded at $0 by SGIP Equity Resiliency.

## Revenue model (three stacked layers)
1. **Consumer SaaS** — free assessment → **$9/mo Pro**: full roadmap, grant application packet, contractor introductions, seasonal risk alerts. (Live today via Butterbase billing → Stripe.)
2. **Contractor referrals** — qualified-lead fees on funded installs. Industry-standard solar/HVAC lead prices run $50–$300; our leads arrive pre-qualified with the grant that pays for the job already identified. The graph knows *who is ready to buy and why*.
3. **Risk-graph analytics (B2B)** — de-identified, aggregate views of cascading residential risk for **insurers** (underwriting, mitigation-linked premiums), **utilities** (targeted resilience programs, SGIP outreach), and **municipalities** (community hardening priorities). The single-point-of-failure analysis (one transformer, many vulnerable households) is exactly what these buyers cannot see today.

## Unit economics (illustrative)
- CAC via utility/community partnerships: low — utilities are *mandated* to promote programs like SGIP and have no delivery mechanism this targeted.
- A single funded battery install: $9/mo subscriber + ~$200 referral fee + a permanent enrichment of the graph.
- Marginal cost per assessment: cents (Neo4j Aura query + one pipeline run + one sandbox simulation).

## Go-to-market
1. **Wedge**: California medical-baseline households (PG&E's own PSPS-affected, CPAP/oxygen users) — highest urgency, richest grants (SGIP Equity Resiliency covers up to 100% of a battery), clearest story.
2. **Expand**: hills/wildfire and flood-zone archetypes across CA; then state-by-state as grant graphs are seeded (the schema is region-agnostic; grants and infrastructure are data, not code).
3. **Partnerships**: CBOs and Area Agencies on Aging for vulnerable-household reach; contractor networks for fulfillment.

## The moat
Every assessment writes back into the graph: which upgrades were installed, which grants closed, which contractors delivered, which outages actually happened. The dataset — a living, address-level cascading-dependency graph of residential climate risk — compounds and is not reconstructible from public data alone. **Every assessment makes the graph smarter, and the graph is the moat.**
