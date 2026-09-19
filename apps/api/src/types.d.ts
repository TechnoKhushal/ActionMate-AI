import "express-session";

declare module "express-session" {
  interface SessionData {
    oauthState?: string;

    googleTokens?: {
      access_token?: string;
      refresh_token?: string;
      expiry_date?: number;
    };
  }
}