"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const config_1 = require("./config");
const google_1 = __importDefault(require("./routes/google"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "http://localhost:3000",
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET ||
        "actionmate-dev-secret",
    resave: false,
    saveUninitialized: false,
}));
app.get("/health", (_req, res) => {
    res.json({
        ok: true,
        service: "ActionMate API",
    });
});
app.use("/auth", google_1.default);
app.use("/tasks", tasks_1.default);
app.listen(config_1.config.port, () => {
    console.log(`ActionMate API running on http://localhost:${config_1.config.port}`);
});
exports.default = app;
//# sourceMappingURL=server.js.map