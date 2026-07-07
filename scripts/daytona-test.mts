import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const { runBackupSimulation } = await import("../src/lib/daytona");

const result = await runBackupSimulation({
  batteryKwh: 13.5,
  avgOutageHrs: 14,
  criticalDevices: [
    { name: "CPAP machine", watts: 40, hoursPerDay: 8 },
    { name: "refrigerator", watts: 150, hoursPerDay: 24 },
    { name: "phone + router + lights", watts: 60, hoursPerDay: 12 },
  ],
  hasSolar: false,
});
console.log(JSON.stringify({ ...result, script: "<omitted>" }, null, 2));
