import express from "express";
import cors from "cors";
import session from "express-session";

import googleRoutes from "./routes/google";
import taskRoutes from "./routes/tasks";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://action-mate-ai-main.vercel.app",
    ],
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
app.use("/tasks", taskRoutes);

export default app;