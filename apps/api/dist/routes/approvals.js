"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const store_1 = require("../approvals/store");
const engine_1 = require("../policy/engine");
const calendar_1 = require("../services/calendar");
const router = (0, express_1.Router)();
function getOwnerId(req) {
    return req.sessionID;
}
// ---------------------------------------------------------
// GET APPROVAL
// ---------------------------------------------------------
router.get("/:approvalId", (req, res) => {
    try {
        const ownerId = getOwnerId(req);
        const approval = (0, store_1.getApproval)(req.params.approvalId);
        if (!approval) {
            return res.status(404).json({
                error: "Approval not found",
            });
        }
        if (approval.ownerId !== ownerId) {
            return res.status(403).json({
                error: "Not authorized",
            });
        }
        res.json({
            id: approval.id,
            tool: approval.tool,
            arguments: approval.arguments,
            risk: approval.risk,
            reason: approval.reason,
            status: approval.status,
            createdAt: approval.createdAt,
            decidedAt: approval.decidedAt,
        });
    }
    catch (error) {
        console.error("Approval lookup error:", error);
        res.status(500).json({
            error: "Could not read approval",
        });
    }
});
// ---------------------------------------------------------
// REJECT APPROVAL
// ---------------------------------------------------------
router.post("/:approvalId/reject", (req, res) => {
    try {
        const approval = (0, store_1.rejectApproval)(req.params.approvalId, getOwnerId(req));
        res.json({
            success: true,
            status: approval.status,
            approvalId: approval.id,
        });
    }
    catch (error) {
        console.error("Approval rejection error:", error);
        res.status(400).json({
            error: error instanceof Error
                ? error.message
                : "Could not reject approval",
        });
    }
});
// ---------------------------------------------------------
// APPROVE AND EXECUTE
// ---------------------------------------------------------
router.post("/:approvalId/approve", async (req, res) => {
    let approvalId = req.params.approvalId;
    try {
        // The approval record contains the exact stored action.
        // Nothing comes from req.body.
        const approval = (0, store_1.approveApproval)(approvalId, getOwnerId(req));
        // Re-check policy after approval.
        const policy = (0, engine_1.evaluateAction)({
            userId: approval.ownerId,
            tool: approval.tool,
            arguments: approval.arguments,
        });
        if (policy.decision !== "REQUIRE_APPROVAL") {
            (0, store_1.markFailed)(approvalId);
            return res.status(403).json({
                error: "This action is no longer permitted by policy",
            });
        }
        if (approval.tool !== "create_meeting") {
            (0, store_1.markFailed)(approvalId);
            return res.status(400).json({
                error: "Unsupported approval action",
            });
        }
        const context = approval.context;
        if (!context?.contactVerified) {
            (0, store_1.markFailed)(approvalId);
            return res.status(400).json({
                error: "The attendee was not verified by the contact tool",
            });
        }
        if (!context.verifiedSlot) {
            (0, store_1.markFailed)(approvalId);
            return res.status(400).json({
                error: "No verified calendar slot exists",
            });
        }
        const args = approval.arguments;
        const startDateTime = String(args.startDateTime);
        const endDateTime = String(args.endDateTime);
        const attendeeEmail = String(args.attendeeEmail);
        const title = String(args.title);
        // Exact action integrity check.
        if (startDateTime !==
            context.verifiedSlot.startDateTime ||
            endDateTime !==
                context.verifiedSlot.endDateTime) {
            (0, store_1.markFailed)(approvalId);
            return res.status(400).json({
                error: "Stored meeting time no longer matches the verified slot",
            });
        }
        // We need the Google session tokens.
        const tokens = req.session.googleTokens;
        if (!tokens?.access_token) {
            (0, store_1.markFailed)(approvalId);
            return res.status(401).json({
                error: "Google account is not connected",
            });
        }
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        if (Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            end <= start) {
            (0, store_1.markFailed)(approvalId);
            return res.status(400).json({
                error: "Invalid meeting time",
            });
        }
        // Final availability check immediately before execution.
        const existingEvents = await (0, calendar_1.getCalendarEvents)(tokens.access_token, tokens.refresh_token, new Date(start.getTime() - 60_000).toISOString(), new Date(end.getTime() + 60_000).toISOString());
        const overlappingEvent = existingEvents.find((event) => {
            const eventStart = event.start?.dateTime
                ? new Date(event.start.dateTime)
                : null;
            const eventEnd = event.end?.dateTime
                ? new Date(event.end.dateTime)
                : null;
            if (!eventStart || !eventEnd) {
                return false;
            }
            return (start < eventEnd &&
                end > eventStart);
        });
        if (overlappingEvent) {
            (0, store_1.markFailed)(approvalId);
            return res.status(409).json({
                error: "The approved meeting time is no longer available",
            });
        }
        // Execute the exact stored action.
        const meeting = await (0, calendar_1.createMeeting)(tokens.access_token, tokens.refresh_token, title, startDateTime, endDateTime, attendeeEmail);
        (0, store_1.markExecuted)(approvalId);
        res.json({
            success: true,
            status: "EXECUTED",
            approvalId,
            meeting,
        });
    }
    catch (error) {
        console.error("Approval execution error:", error);
        try {
            (0, store_1.markFailed)(approvalId);
        }
        catch {
            // Ignore secondary state-update errors.
        }
        res.status(500).json({
            error: error instanceof Error
                ? error.message
                : "Could not execute approved action",
        });
    }
});
exports.default = router;
//# sourceMappingURL=approvals.js.map