"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateAction = evaluateAction;
const POLICY = {
    find_contact: {
        decision: "ALLOW",
        risk: "LOW",
        reason: "Reading contact information is allowed.",
    },
    check_calendar: {
        decision: "ALLOW",
        risk: "LOW",
        reason: "Reading calendar information is allowed.",
    },
    find_available_slot: {
        decision: "ALLOW",
        risk: "LOW",
        reason: "Finding an available calendar slot is allowed.",
    },
    create_meeting: {
        decision: "REQUIRE_APPROVAL",
        risk: "MEDIUM",
        reason: "Creating a meeting sends an external calendar invitation and requires human approval.",
    },
};
function evaluateAction(action) {
    const rule = POLICY[action.tool];
    if (!rule) {
        return {
            decision: "DENY",
            risk: "HIGH",
            reason: "This tool is not registered in the ActionMate policy.",
        };
    }
    return {
        decision: rule.decision,
        risk: rule.risk,
        reason: rule.reason,
    };
}
//# sourceMappingURL=engine.js.map