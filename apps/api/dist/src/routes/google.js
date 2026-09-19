"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const googleapis_1 = require("googleapis");
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../config");
const calendar_1 = require("../services/calendar");
const contacts_1 = require("../services/contacts");
const router = (0, express_1.Router)();
const SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/contacts.readonly",
];
function createOAuthClient() {
    return new googleapis_1.google.auth.OAuth2(config_1.config.googleClientId, config_1.config.googleClientSecret, config_1.config.googleRedirectUri);
}
// Start Google OAuth
router.get("/google", (req, res) => {
    const oauth2Client = createOAuthClient();
    const state = crypto_1.default.randomUUID();
    req.session.oauthState = state;
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: SCOPES,
        state,
    });
    res.redirect(authUrl);
});
// Google OAuth callback
router.get("/google/callback", async (req, res) => {
    try {
        const { code, state } = req.query;
        if (!code || typeof code !== "string") {
            return res.status(400).send("Missing authorization code");
        }
        if (!state || typeof state !== "string") {
            return res.status(400).send("Missing OAuth state");
        }
        if (state !== req.session.oauthState) {
            return res.status(400).send("Invalid OAuth state");
        }
        delete req.session.oauthState;
        const oauth2Client = createOAuthClient();
        const { tokens } = await oauth2Client.getToken(code);
        req.session.googleTokens = {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date,
        };
        console.log("Google connected successfully.");
        console.log("Access token received:", Boolean(tokens.access_token));
        console.log("Refresh token received:", Boolean(tokens.refresh_token));
        res.send(`
      <html>
        <body style="font-family: Arial; padding: 40px">
          <h1>✅ Google Connected</h1>
          <p>ActionMate successfully connected to Google.</p>
          <p>You can close this window.</p>
        </body>
      </html>
    `);
    }
    catch (error) {
        console.error("Google OAuth error:", error);
        res.status(500).send("Google OAuth failed");
    }
});
router.get("/calendar/events", async (req, res) => {
    try {
        const tokens = req.session.googleTokens;
        if (!tokens?.access_token) {
            return res.status(401).json({
                error: "Google account not connected",
            });
        }
        const now = new Date();
        const later = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const events = await (0, calendar_1.getCalendarEvents)(tokens.access_token, tokens.refresh_token, now.toISOString(), later.toISOString());
        res.json({
            events,
        });
    }
    catch (error) {
        console.error("Calendar error:", error);
        res.status(500).json({
            error: "Could not read calendar",
        });
    }
});
router.get("/contacts/search", async (req, res) => {
    try {
        const tokens = req.session.googleTokens;
        if (!tokens?.access_token) {
            return res.status(401).json({
                error: "Google account not connected",
            });
        }
        const name = String(req.query.name || "").trim();
        if (!name) {
            return res.status(400).json({
                error: "Missing name",
            });
        }
        const contacts = await (0, contacts_1.findContact)(tokens.access_token, tokens.refresh_token, name);
        res.json({
            contacts,
        });
    }
    catch (error) {
        console.error("Contacts error:", error);
        res.status(500).json({
            error: "Could not search contacts",
        });
    }
});
router.get("/calendar/create-test", async (req, res) => {
    try {
        const tokens = req.session.googleTokens;
        if (!tokens?.access_token) {
            return res.status(401).json({
                error: "Google account not connected",
            });
        }
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const end = new Date(start.getTime() + 30 * 60 * 1000);
        const meeting = await (0, calendar_1.createMeeting)(tokens.access_token, tokens.refresh_token, "ActionMate Test Meeting", start.toISOString(), end.toISOString(), "shiv194819@gmail.com");
        res.json({
            success: true,
            meeting,
        });
    }
    catch (error) {
        console.error("Create meeting error:", error);
        res.status(500).json({
            error: "Could not create meeting",
        });
    }
});
exports.default = router;
