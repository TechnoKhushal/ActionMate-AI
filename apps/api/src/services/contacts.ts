import { google } from "googleapis";
import { createGoogleClient } from "./google";

export async function findContact(
  accessToken: string,
  refreshToken: string | undefined,
  name: string
) {
  const auth = createGoogleClient(accessToken, refreshToken);

  const people = google.people({
    version: "v1",
    auth,
  });

  const response = await people.people.searchContacts({
    query: name,
    readMask: "names,emailAddresses",
    pageSize: 10,
  });

  const results = response.data.results ?? [];

  return results.map((item) => ({
    resourceName: item.person?.resourceName,
    name:
      item.person?.names?.[0]?.displayName ??
      "Unknown",
    email:
      item.person?.emailAddresses?.[0]?.value ??
      null,
  }));
}