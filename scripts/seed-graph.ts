/**
 * Seeds the ResiliencePath risk graph in Neo4j Aura.
 *
 * Model:
 *   (:Property)-[:EXPOSED_TO {score}]->(:Hazard)
 *   (:Property)-[:DEPENDS_ON {criticality}]->(:Infrastructure)
 *   (:Infrastructure)-[:DEPENDS_ON]->(:Infrastructure)          // cascades
 *   (:Hazard)-[:DISRUPTS {probability, avgDurationHrs}]->(:Infrastructure)
 *   (:Resident)-[:LIVES_AT]->(:Property)
 *   (:Resident)-[:HAS_VULNERABILITY]->(:Vulnerability)
 *   (:Vulnerability)-[:DEPENDS_ON {criticality}]->(:Infrastructure)
 *   (:Upgrade)-[:MITIGATES {reduction}]->(:Hazard)
 *   (:Upgrade)-[:BACKS_UP {durationHrs}]->(:Infrastructure)
 *   (:Grant)-[:APPLIES_TO {amountUsd|pct}]->(:Upgrade)
 *   (:Contractor)-[:INSTALLS]->(:Upgrade)
 *
 * Run: npx tsx scripts/seed-graph.ts
 */
import dotenv from "dotenv";
import neo4j from "neo4j-driver";

dotenv.config({ path: ".env.local" });

async function main() {
  const driver = neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(process.env.NEO4J_USERNAME ?? "neo4j", process.env.NEO4J_PASSWORD!)
  );
  const session = driver.session();

  try {
    console.log("Wiping existing graph…");
    await session.run("MATCH (n) DETACH DELETE n");

    console.log("Creating constraints…");
    for (const label of [
      "Property", "Hazard", "Infrastructure", "Resident",
      "Vulnerability", "Upgrade", "Grant", "Contractor",
    ]) {
      await session.run(
        `CREATE CONSTRAINT ${label.toLowerCase()}_id IF NOT EXISTS
         FOR (n:${label}) REQUIRE n.id IS UNIQUE`
      );
    }

    console.log("Seeding nodes + relationships…");
    await session.run(SEED_CYPHER);

    const counts = await session.run(
      "MATCH (n) RETURN labels(n)[0] AS label, count(*) AS c ORDER BY label"
    );
    console.log("Seeded:");
    for (const rec of counts.records) {
      console.log(`  ${rec.get("label")}: ${rec.get("c")}`);
    }
    const rels = await session.run("MATCH ()-[r]->() RETURN count(r) AS c");
    console.log(`  relationships: ${rels.records[0].get("c")}`);
  } finally {
    await session.close();
    await driver.close();
  }
}

const SEED_CYPHER = `
// ---------- Hazards ----------
CREATE (wildfire:Hazard {id:'hz-wildfire', name:'Wildfire', season:'Jun–Oct', annualProbability:0.18, icon:'flame'})
CREATE (outage:Hazard {id:'hz-outage', name:'Power Outage', season:'year-round, peaks in winter storms', annualProbability:0.85, icon:'zap-off'})
CREATE (heatwave:Hazard {id:'hz-heatwave', name:'Extreme Heat', season:'Jul–Sep', annualProbability:0.65, icon:'thermometer'})
CREATE (flood:Hazard {id:'hz-flood', name:'Flood', season:'Dec–Mar', annualProbability:0.12, icon:'waves'})

// ---------- Infrastructure ----------
CREATE (feeder:Infrastructure {id:'inf-feeder-oak7', name:'PG&E Feeder Oakland-7', type:'grid-feeder', redundancy:'low'})
CREATE (transformer:Infrastructure {id:'inf-xfmr-t42', name:'Transformer T-42 (38th Ave)', type:'transformer', redundancy:'none'})
CREATE (substation:Infrastructure {id:'inf-substation-fruitvale', name:'Fruitvale Substation', type:'substation', redundancy:'medium'})
CREATE (road:Infrastructure {id:'inf-road-35th', name:'35th Ave Corridor', type:'road', redundancy:'medium'})
CREATE (celltower:Infrastructure {id:'inf-cell-ct9', name:'Cell Tower CT-9', type:'cell-tower', redundancy:'low'})
CREATE (waterpump:Infrastructure {id:'inf-pump-wp3', name:'EBMUD Pump Station WP-3', type:'water-pump', redundancy:'medium'})

// cascading dependencies
CREATE (transformer)-[:DEPENDS_ON {criticality:'critical'}]->(feeder)
CREATE (feeder)-[:DEPENDS_ON {criticality:'critical'}]->(substation)
CREATE (celltower)-[:DEPENDS_ON {criticality:'high'}]->(feeder)
CREATE (waterpump)-[:DEPENDS_ON {criticality:'high'}]->(substation)

// ---------- Hazard → Infrastructure disruption ----------
CREATE (outage)-[:DISRUPTS {probability:0.7, avgDurationHrs:14}]->(feeder)
CREATE (outage)-[:DISRUPTS {probability:0.45, avgDurationHrs:24}]->(transformer)
CREATE (wildfire)-[:DISRUPTS {probability:0.5, avgDurationHrs:72}]->(feeder)
CREATE (wildfire)-[:DISRUPTS {probability:0.6, avgDurationHrs:48}]->(road)
CREATE (wildfire)-[:DISRUPTS {probability:0.4, avgDurationHrs:36}]->(celltower)
CREATE (heatwave)-[:DISRUPTS {probability:0.55, avgDurationHrs:8}]->(transformer)
CREATE (heatwave)-[:DISRUPTS {probability:0.3, avgDurationHrs:6}]->(feeder)
CREATE (flood)-[:DISRUPTS {probability:0.5, avgDurationHrs:24}]->(road)
CREATE (flood)-[:DISRUPTS {probability:0.35, avgDurationHrs:48}]->(waterpump)

// ---------- Properties ----------
CREATE (home:Property {id:'prop-1', address:'2847 38th Ave, Oakland, CA', lat:37.7893, lng:-122.2043, floodZone:'X', roofAge:22, insulation:'poor', demo:true})
CREATE (hills:Property {id:'prop-2', address:'6120 Skyline Blvd, Oakland, CA', lat:37.8214, lng:-122.1857, floodZone:'X', roofAge:8, insulation:'average', demo:false})
CREATE (flats:Property {id:'prop-3', address:'1035 66th Ave, Oakland, CA', lat:37.7639, lng:-122.1907, floodZone:'AE', roofAge:15, insulation:'poor', demo:false})

CREATE (home)-[:EXPOSED_TO {score:0.9}]->(outage)
CREATE (home)-[:EXPOSED_TO {score:0.55}]->(heatwave)
CREATE (home)-[:EXPOSED_TO {score:0.25}]->(wildfire)
CREATE (home)-[:EXPOSED_TO {score:0.1}]->(flood)
CREATE (hills)-[:EXPOSED_TO {score:0.85}]->(wildfire)
CREATE (hills)-[:EXPOSED_TO {score:0.7}]->(outage)
CREATE (flats)-[:EXPOSED_TO {score:0.75}]->(flood)
CREATE (flats)-[:EXPOSED_TO {score:0.6}]->(heatwave)

CREATE (home)-[:DEPENDS_ON {criticality:'critical'}]->(transformer)
CREATE (home)-[:DEPENDS_ON {criticality:'high'}]->(celltower)
CREATE (home)-[:DEPENDS_ON {criticality:'high'}]->(road)
CREATE (home)-[:DEPENDS_ON {criticality:'medium'}]->(waterpump)
CREATE (hills)-[:DEPENDS_ON {criticality:'critical'}]->(feeder)
CREATE (hills)-[:DEPENDS_ON {criticality:'critical'}]->(road)
CREATE (flats)-[:DEPENDS_ON {criticality:'critical'}]->(transformer)
CREATE (flats)-[:DEPENDS_ON {criticality:'high'}]->(waterpump)

// ---------- Residents & vulnerabilities ----------
CREATE (ben:Resident {id:'res-1', name:'Ben', age:34, role:'account-holder'})
CREATE (dad:Resident {id:'res-2', name:'Robert (father)', age:71, role:'household-member'})
CREATE (ben)-[:LIVES_AT]->(home)
CREATE (dad)-[:LIVES_AT]->(home)

CREATE (cpap:Vulnerability {id:'vul-cpap', name:'CPAP machine dependency', severity:0.95, kind:'medical-device'})
CREATE (elderly:Vulnerability {id:'vul-elderly', name:'Age 65+ heat sensitivity', severity:0.7, kind:'demographic'})
CREATE (insul:Vulnerability {id:'vul-insulation', name:'Poor insulation (indoor heat/cold retention)', severity:0.5, kind:'building'})

CREATE (dad)-[:HAS_VULNERABILITY]->(cpap)
CREATE (dad)-[:HAS_VULNERABILITY]->(elderly)
CREATE (home)-[:HAS_VULNERABILITY]->(insul)

CREATE (cpap)-[:DEPENDS_ON {criticality:'life-safety'}]->(transformer)
CREATE (elderly)-[:DEPENDS_ON {criticality:'high'}]->(transformer)

// ---------- Upgrades ----------
CREATE (battery:Upgrade {id:'up-battery', name:'Home battery backup (13.5 kWh)', costUsd:12000, category:'power', leadWeeks:6})
CREATE (solar:Upgrade {id:'up-solar', name:'Rooftop solar (6 kW)', costUsd:16000, category:'power', leadWeeks:10})
CREATE (heatpump:Upgrade {id:'up-heatpump', name:'Heat pump + AC', costUsd:14000, category:'thermal', leadWeeks:8})
CREATE (insulation:Upgrade {id:'up-insulation', name:'Attic + wall insulation retrofit', costUsd:6500, category:'thermal', leadWeeks:3})
CREATE (airfilter:Upgrade {id:'up-airfilter', name:'MERV-13 filtration + room purifiers', costUsd:1200, category:'air', leadWeeks:1})
CREATE (waterstore:Upgrade {id:'up-water', name:'Emergency water storage (200 gal)', costUsd:900, category:'water', leadWeeks:1})
CREATE (defensible:Upgrade {id:'up-defensible', name:'Defensible space + ember-resistant vents', costUsd:4000, category:'fire-hardening', leadWeeks:4})

CREATE (battery)-[:MITIGATES {reduction:0.85}]->(outage)
CREATE (battery)-[:BACKS_UP {durationHrs:24}]->(transformer)
CREATE (solar)-[:MITIGATES {reduction:0.35}]->(outage)
CREATE (solar)-[:BACKS_UP {durationHrs:720}]->(transformer)
CREATE (heatpump)-[:MITIGATES {reduction:0.75}]->(heatwave)
CREATE (insulation)-[:MITIGATES {reduction:0.45}]->(heatwave)
CREATE (airfilter)-[:MITIGATES {reduction:0.4}]->(wildfire)
CREATE (waterstore)-[:MITIGATES {reduction:0.3}]->(flood)
CREATE (defensible)-[:MITIGATES {reduction:0.6}]->(wildfire)

// solar amplifies battery (islanding recharges it)
CREATE (solar)-[:ENHANCES {note:'recharges battery during multi-day outages'}]->(battery)

// ---------- Grants ----------
CREATE (ira25d:Grant {id:'gr-ira25d', name:'IRA 25D Residential Clean Energy Credit', agency:'IRS', pct:0.3, maxUsd:null, expires:'2032-12-31'})
CREATE (sgip:Grant {id:'gr-sgip', name:'SGIP Equity Resiliency (battery)', agency:'CPUC', pct:1.0, maxUsd:15000, expires:'2026-12-31', requirement:'medical baseline or PSPS-affected'})
CREATE (bayren:Grant {id:'gr-bayren', name:'BayREN Home+ rebate', agency:'BayREN', pct:null, maxUsd:5000, expires:'2026-12-31'})
CREATE (tech:Grant {id:'gr-tech', name:'TECH Clean California (heat pump)', agency:'CA', pct:null, maxUsd:3000, expires:'2027-06-30'})

CREATE (ira25d)-[:APPLIES_TO]->(battery)
CREATE (ira25d)-[:APPLIES_TO]->(solar)
CREATE (sgip)-[:APPLIES_TO]->(battery)
CREATE (bayren)-[:APPLIES_TO]->(insulation)
CREATE (tech)-[:APPLIES_TO]->(heatpump)
CREATE (bayren)-[:APPLIES_TO]->(heatpump)

// ---------- Contractors ----------
CREATE (c1:Contractor {id:'con-1', name:'East Bay Solar & Storage', rating:4.8, phone:'(510) 555-0119', licensed:true})
CREATE (c2:Contractor {id:'con-2', name:'Oakland Green HVAC', rating:4.6, phone:'(510) 555-0142', licensed:true})
CREATE (c3:Contractor {id:'con-3', name:'Firewise Home Hardening Co.', rating:4.7, phone:'(510) 555-0177', licensed:true})

CREATE (c1)-[:INSTALLS]->(battery)
CREATE (c1)-[:INSTALLS]->(solar)
CREATE (c2)-[:INSTALLS]->(heatpump)
CREATE (c2)-[:INSTALLS]->(insulation)
CREATE (c2)-[:INSTALLS]->(airfilter)
CREATE (c3)-[:INSTALLS]->(defensible)
CREATE (c3)-[:INSTALLS]->(waterstore)
`;

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
