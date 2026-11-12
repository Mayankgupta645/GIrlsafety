import { updateAllRoadRisks } from "./services/risk.engine.js";

// Every 10 minutes
setInterval(updateAllRoadRisks, 10 * 60 * 1000);
