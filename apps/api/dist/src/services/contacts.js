"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findContact = findContact;
const googleapis_1 = require("googleapis");
const google_1 = require("./google");
async function findContact(accessToken, refreshToken, name) {
    const auth = (0, google_1.createGoogleClient)(accessToken, refreshToken);
    const people = googleapis_1.google.people({
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
        name: item.person?.names?.[0]?.displayName ??
            "Unknown",
        email: item.person?.emailAddresses?.[0]?.value ??
            null,
    }));
}
