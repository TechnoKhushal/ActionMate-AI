import { Router } from "express";
import {
  getApproval,
  approveApproval,
  rejectApproval,
  markExecuted,
  markFailed,
} from "../approvals/store";
import {
  evaluateAction,
} from "../policy/engine";
import {
  createMeeting,
  getCalendarEvents,
} from "../services/calendar";

const router = Router();

function getOwnerId(req: any) {
  return req.sessionID;
}

// ---------------------------------------------------------
// GET APPROVAL
// ---------------------------------------------------------

router.get("/:approvalId", (req, res) => {
  try {
    const ownerId = getOwnerId(req);

    const approval = getApproval(
      req.params.approvalId
    );

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
  } catch (error) {
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
    const approval = rejectApproval(
      req.params.approvalId,
      getOwnerId(req)
    );

    res.json({
      success: true,
      status: approval.status,
      approvalId: approval.id,
    });
  } catch (error) {
    console.error(
      "Approval rejection error:",
      error
    );

    res.status(400).json({
      error:
        error instanceof Error
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
    const approval = approveApproval(
      approvalId,
      getOwnerId(req)
    );

    // Re-check policy after approval.
    const policy = evaluateAction({
      userId: approval.ownerId,
      tool: approval.tool,
      arguments: approval.arguments,
    });

    if (policy.decision !== "REQUIRE_APPROVAL") {
      markFailed(approvalId);

      return res.status(403).json({
        error:
          "This action is no longer permitted by policy",
      });
    }

    if (approval.tool !== "create_meeting") {
      markFailed(approvalId);

      return res.status(400).json({
        error:
          "Unsupported approval action",
      });
    }

    const context = approval.context as
      | {
          contactVerified?: boolean;
          verifiedSlot?: {
            startDateTime: string;
            endDateTime: string;
          };
        }
      | undefined;

    if (!context?.contactVerified) {
      markFailed(approvalId);

      return res.status(400).json({
        error:
          "The attendee was not verified by the contact tool",
      });
    }

    if (!context.verifiedSlot) {
      markFailed(approvalId);

      return res.status(400).json({
        error:
          "No verified calendar slot exists",
      });
    }

    const args = approval.arguments;

    const startDateTime =
      String(args.startDateTime);

    const endDateTime =
      String(args.endDateTime);

    const attendeeEmail =
      String(args.attendeeEmail);

    const title =
      String(args.title);

    // Exact action integrity check.
    if (
      startDateTime !==
        context.verifiedSlot.startDateTime ||
      endDateTime !==
        context.verifiedSlot.endDateTime
    ) {
      markFailed(approvalId);

      return res.status(400).json({
        error:
          "Stored meeting time no longer matches the verified slot",
      });
    }

    // We need the Google session tokens.
    const tokens = req.session.googleTokens;

    if (!tokens?.access_token) {
      markFailed(approvalId);

      return res.status(401).json({
        error:
          "Google account is not connected",
      });
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      markFailed(approvalId);

      return res.status(400).json({
        error:
          "Invalid meeting time",
      });
    }

    // Final availability check immediately before execution.
    const existingEvents =
      await getCalendarEvents(
        tokens.access_token,
        tokens.refresh_token,
        new Date(
          start.getTime() - 60_000
        ).toISOString(),
        new Date(
          end.getTime() + 60_000
        ).toISOString()
      );

    const overlappingEvent =
      existingEvents.find((event: any) => {
        const eventStart =
          event.start?.dateTime
            ? new Date(event.start.dateTime)
            : null;

        const eventEnd =
          event.end?.dateTime
            ? new Date(event.end.dateTime)
            : null;

        if (!eventStart || !eventEnd) {
          return false;
        }

        return (
          start < eventEnd &&
          end > eventStart
        );
      });

    if (overlappingEvent) {
      markFailed(approvalId);

      return res.status(409).json({
        error:
          "The approved meeting time is no longer available",
      });
    }

    // Execute the exact stored action.
    const meeting = await createMeeting(
      tokens.access_token,
      tokens.refresh_token,
      title,
      startDateTime,
      endDateTime,
      attendeeEmail
    );

    markExecuted(approvalId);

    res.json({
      success: true,
      status: "EXECUTED",
      approvalId,
      meeting,
    });
  } catch (error) {
    console.error(
      "Approval execution error:",
      error
    );

    try {
      markFailed(approvalId);
    } catch {
      // Ignore secondary state-update errors.
    }

    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Could not execute approved action",
    });
  }
});

export default router;