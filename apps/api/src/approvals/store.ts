import crypto from "crypto";

export type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTED"
  | "FAILED";

export type ApprovalRecord = {
  id: string;

  ownerId: string;

  tool: string;

  arguments: Record<string, unknown>;

  risk: string;

  reason: string;

  context?: Record<string, unknown>;

  status: ApprovalStatus;

  createdAt: string;

  decidedAt?: string;
};

const approvals = new Map<
  string,
  ApprovalRecord
>();

export function createApproval(input: {
  ownerId: string;

  tool: string;

  arguments: Record<string, unknown>;

  risk: string;

  reason: string;

  context?: Record<string, unknown>;
}) {
  const approval: ApprovalRecord = {
    id: crypto.randomUUID(),

    ownerId: input.ownerId,

    tool: input.tool,

    arguments: input.arguments,

    risk: input.risk,

    reason: input.reason,

    context: input.context,

    status: "PENDING",

    createdAt: new Date().toISOString(),
  };

  approvals.set(approval.id, approval);

  return approval;
}

export function getApproval(
  approvalId: string
) {
  return approvals.get(approvalId);
}

export function approveApproval(
  approvalId: string,
  ownerId: string
) {
  const approval = approvals.get(approvalId);

  if (!approval) {
    throw new Error("Approval not found");
  }

  if (approval.ownerId !== ownerId) {
    throw new Error("Not authorized to approve this action");
  }

  if (approval.status !== "PENDING") {
    throw new Error(
      `Approval is already ${approval.status}`
    );
  }

  approval.status = "APPROVED";
  approval.decidedAt = new Date().toISOString();

  return approval;
}

export function rejectApproval(
  approvalId: string,
  ownerId: string
) {
  const approval = approvals.get(approvalId);

  if (!approval) {
    throw new Error("Approval not found");
  }

  if (approval.ownerId !== ownerId) {
    throw new Error("Not authorized to reject this action");
  }

  if (approval.status !== "PENDING") {
    throw new Error(
      `Approval is already ${approval.status}`
    );
  }

  approval.status = "REJECTED";
  approval.decidedAt = new Date().toISOString();

  return approval;
}

export function markExecuted(
  approvalId: string
) {
  const approval = approvals.get(approvalId);

  if (!approval) {
    throw new Error("Approval not found");
  }

  approval.status = "EXECUTED";

  return approval;
}

export function markFailed(
  approvalId: string
) {
  const approval = approvals.get(approvalId);

  if (!approval) {
    throw new Error("Approval not found");
  }

  approval.status = "FAILED";

  return approval;
}