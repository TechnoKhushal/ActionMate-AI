import express from "express";
import cors from "cors";
import session from "express-session";
import { config } from "./config";
import googleRoutes from "./routes/google";
import agentRoutes from "./routes/agent";
import approvalRoutes from "./routes/approvals";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "actionmate-dev-secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "ActionMate API",
  });
});

app.use("/auth", googleRoutes);
app.use("/agent", agentRoutes);
app.use("/approvals", approvalRoutes);

app.listen(config.port, () => {
  console.log(`ActionMate API running on http://localhost:${config.port}`);
});