"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApproval = createApproval;
exports.getApproval = getApproval;
exports.approveApproval = approveApproval;
exports.rejectApproval = rejectApproval;
exports.markExecuted = markExecuted;
exports.markFailed = markFailed;
const crypto_1 = __importDefault(require("crypto"));
const approvals = new Map();
function createApproval(input) {
    const approval = {
        id: crypto_1.default.randomUUID(),
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
function getApproval(approvalId) {
    return approvals.get(approvalId);
}
function approveApproval(approvalId, ownerId) {
    const approval = approvals.get(approvalId);
    if (!approval) {
        throw new Error("Approval not found");
    }
    if (approval.ownerId !== ownerId) {
        throw new Error("Not authorized to approve this action");
    }
    if (approval.status !== "PENDING") {
        throw new Error(`Approval is already ${approval.status}`);
    }
    approval.status = "APPROVED";
    approval.decidedAt = new Date().toISOString();
    return approval;
}
function rejectApproval(approvalId, ownerId) {
    const approval = approvals.get(approvalId);
    if (!approval) {
        throw new Error("Approval not found");
    }
    if (approval.ownerId !== ownerId) {
        throw new Error("Not authorized to reject this action");
    }
    if (approval.status !== "PENDING") {
        throw new Error(`Approval is already ${approval.status}`);
    }
    approval.status = "REJECTED";
    approval.decidedAt = new Date().toISOString();
    return approval;
}
function markExecuted(approvalId) {
    const approval = approvals.get(approvalId);
    if (!approval) {
        throw new Error("Approval not found");
    }
    approval.status = "EXECUTED";
    return approval;
}
function markFailed(approvalId) {
    const approval = approvals.get(approvalId);
    if (!approval) {
        throw new Error("Approval not found");
    }
    approval.status = "FAILED";
    return approval;
}
