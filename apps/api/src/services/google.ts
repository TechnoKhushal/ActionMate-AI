import { google } from "googleapis";
import { config } from "../config";

export function createGoogleClient(
  accessToken: string,
  refreshToken?: string
) {
  const client = new google.auth.OAuth2(
    config.googleClientId,
    config.googleClientSecret,
    config.googleRedirectUri
  );

  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return client;
}