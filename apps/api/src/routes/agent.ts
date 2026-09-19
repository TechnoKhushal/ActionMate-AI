import { Router } from "express";
import { understandTask } from "../agent/planner";
import { runAgent } from "../agent/runner";

const router = Router();

router.get("/understand", async (req, res) => {
  try {
    const goal = String(req.query.goal || "").trim();

    if (!goal) {
      return res.status(400).json({
        error: "Missing goal",
      });
    }

    const plan = await understandTask(goal);

    res.json({
      goal,
      plan,
    });
  } catch (error: any) {
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

    const result = await runAgent(goal, {
  accessToken: tokens.access_token,
  refreshToken: tokens.refresh_token,
  dryRun: true,
  ownerId: req.sessionID,
});

    res.json({
      goal,
      ...result,
    });
  } catch (error: any) {
    console.error("Agent run error:", error);

    res.status(500).json({
      error:
        error?.message || "Agent execution failed",
    });
  }
});

export default router;