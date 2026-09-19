"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: Number(process.env.PORT || 5000),
    googleClientId: process.env.GOOGLE_CLIENT_ID || "",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ||
        "http://localhost:5000/auth/google/callback",
};
if (!exports.config.googleClientId) {
    throw new Error("GOOGLE_CLIENT_ID is missing");
}
if (!exports.config.googleClientSecret) {
    throw new Error("GOOGLE_CLIENT_SECRET is missing");
}
//# sourceMappingURL=config.js.map