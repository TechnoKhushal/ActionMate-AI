"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGoogleClient = createGoogleClient;
const googleapis_1 = require("googleapis");
const config_1 = require("../config");
function createGoogleClient(accessToken, refreshToken) {
    const client = new googleapis_1.google.auth.OAuth2(config_1.config.googleClientId, config_1.config.googleClientSecret, config_1.config.googleRedirectUri);
    client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
    });
    return client;
}
//# sourceMappingURL=google.js.map