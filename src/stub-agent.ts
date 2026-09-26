import { fingerprint } from "./fingerprint.js";
import type { Orchestrator } from "./orchestrator.js";
import type { DispatchResult } from "./types.js";

export class StubAgent {
  constructor(private readonly orchestrator: Orchestrator) {}

  print(): DispatchResult {
    return this.orchestrator.dispatch("ppm:print");
  }

  audit(): DispatchResult {
    return this.orchestrator.dispatch("ppm:check");
  }

  hashLogs(): string {
    return fingerprint(JSON.stringify(this.orchestrator.events()));
  }
}
