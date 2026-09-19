import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 5000),

  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:5000/auth/google/callback",
};

if (!config.googleClientId) {
  throw new Error("GOOGLE_CLIENT_ID is missing");
}

if (!config.googleClientSecret) {
  throw new Error("GOOGLE_CLIENT_SECRET is missing");
}