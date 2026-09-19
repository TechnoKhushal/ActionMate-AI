"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const planner_1 = require("../agent/planner");
const runner_1 = require("../agent/runner");
const router = (0, express_1.Router)();
router.get("/understand", async (req, res) => {
    try {
        const goal = String(req.query.goal || "").trim();
        if (!goal) {
            return res.status(400).json({
                error: "Missing goal",
            });
        }
        const plan = await (0, planner_1.understandTask)(goal);
        res.json({
            goal,
            plan,
        });
    }
    catch (error) {
        console.error("Agent planning error:", error);
        res.status(error?.status || 500).json({
            error: error?.message || String(error),
            code: error?.code || null,
            type: error?.type || null,
        });
    }
});
router.get("/run", async (req, res) => {
    try {
        const goal = String(req.query.goal || "").trim();
        if (!goal) {
            return res.status(400).json({
                error: "Missing goal",
            });
        }
        const tokens = req.session.googleTokens;
        if (!tokens?.access_token) {
            return res.status(401).json({
                error: "Google account not connected",
            });
        }
        const result = await (0, runner_1.runAgent)(goal, {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            dryRun: true,
            ownerId: req.sessionID,
        });
        res.json({
            goal,
            ...result,
        });
    }
    catch (error) {
        console.error("Agent run error:", error);
        res.status(500).json({
            error: error?.message || "Agent execution failed",
        });
    }
});
exports.default = router;
//# sourceMappingURL=agent.js.map