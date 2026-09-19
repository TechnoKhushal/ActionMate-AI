export type PolicyDecision =
  | "ALLOW"
  | "REQUIRE_APPROVAL"
  | "DENY";

export type RiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export type ActionRequest = {
  userId: string;
  tool: string;
  arguments: Record<string, unknown>;
};

export type PolicyResult = {
  decision: PolicyDecision;
  risk: RiskLevel;
  reason: string;
};