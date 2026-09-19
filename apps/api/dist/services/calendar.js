"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCalendarEvents = getCalendarEvents;
exports.findAvailableSlot = findAvailableSlot;
exports.checkExactSlot = checkExactSlot;
exports.createMeeting = createMeeting;
const googleapis_1 = require("googleapis");
const google_1 = require("./google");
async function getCalendarEvents(accessToken, refreshToken, timeMin, timeMax) {
    const auth = (0, google_1.createGoogleClient)(accessToken, refreshToken);
    const calendar = googleapis_1.google.calendar({
        version: "v3",
        auth,
    });
    const response = await calendar.events.list({
        calendarId: "primary",
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
    });
    return response.data.items ?? [];
}
async function findAvailableSlot(accessToken, refreshToken, date, durationMinutes, windowStartHour, windowEndHour) {
    const offset = "+05:30";
    const windowStart = new Date(`${date}T${String(windowStartHour).padStart(2, "0")}:00:00${offset}`);
    const windowEnd = new Date(`${date}T${String(windowEndHour).padStart(2, "0")}:00:00${offset}`);
    if (Number.isNaN(windowStart.getTime()) ||
        Number.isNaN(windowEnd.getTime())) {
        throw new Error("Invalid date or time window");
    }
    const events = await getCalendarEvents(accessToken, refreshToken, windowStart.toISOString(), windowEnd.toISOString());
    const busyPeriods = events
        .map((event) => {
        const start = event.start?.dateTime
            ? new Date(event.start.dateTime)
            : null;
        const end = event.end?.dateTime
            ? new Date(event.end.dateTime)
            : null;
        if (!start || !end) {
            return null;
        }
        return { start, end };
    })
        .filter((value) => value !== null)
        .sort((a, b) => a.start.getTime() - b.start.getTime());
    const durationMs = durationMinutes * 60 * 1000;
    let candidate = new Date(windowStart);
    for (const busy of busyPeriods) {
        if (candidate.getTime() + durationMs <=
            busy.start.getTime()) {
            return {
                available: true,
                startDateTime: candidate.toISOString(),
                endDateTime: new Date(candidate.getTime() + durationMs).toISOString(),
            };
        }
        if (busy.end > candidate) {
            candidate = new Date(busy.end);
        }
    }
    if (candidate.getTime() + durationMs <=
        windowEnd.getTime()) {
        return {
            available: true,
            startDateTime: candidate.toISOString(),
            endDateTime: new Date(candidate.getTime() + durationMs).toISOString(),
        };
    }
    return {
        available: false,
        message: "No available slot in this time window.",
    };
}
async function checkExactSlot(accessToken, refreshToken, startDateTime, endDateTime) {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const events = await getCalendarEvents(accessToken, refreshToken, new Date(start.getTime() - 60_000).toISOString(), new Date(end.getTime() + 60_000).toISOString());
    const conflict = events.find((event) => {
        const eventStart = event.start?.dateTime
            ? new Date(event.start.dateTime)
            : null;
        const eventEnd = event.end?.dateTime
            ? new Date(event.end.dateTime)
            : null;
        if (!eventStart || !eventEnd) {
            return false;
        }
        return (start < eventEnd &&
            end > eventStart);
    });
    return {
        available: !conflict,
        conflict: conflict ?? null,
    };
}
async function createMeeting(accessToken, refreshToken, title, startDateTime, endDateTime, attendeeEmail) {
    const auth = (0, google_1.createGoogleClient)(accessToken, refreshToken);
    const calendar = googleapis_1.google.calendar({
        version: "v3",
        auth,
    });
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    if (Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())) {
        throw new Error("Invalid meeting time");
    }
    // Convert the absolute UTC instant into an India-local
    // calendar time such as 2026-09-20T15:00:00.
    const indiaParts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    }).formatToParts(start);
    const indiaEndParts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    }).formatToParts(end);
    function part(parts, type) {
        return parts.find((item) => item.type === type)?.value;
    }
    const startLocal = `${part(indiaParts, "year")}-${part(indiaParts, "month")}-${part(indiaParts, "day")}` +
        `T${part(indiaParts, "hour")}:${part(indiaParts, "minute")}:${part(indiaParts, "second")}`;
    const endLocal = `${part(indiaEndParts, "year")}-${part(indiaEndParts, "month")}-${part(indiaEndParts, "day")}` +
        `T${part(indiaEndParts, "hour")}:${part(indiaEndParts, "minute")}:${part(indiaEndParts, "second")}`;
    console.log("GOOGLE EVENT START:", startLocal);
    console.log("GOOGLE EVENT END:", endLocal);
    const response = await calendar.events.insert({
        calendarId: "primary",
        sendUpdates: "all",
        requestBody: {
            summary: title,
            start: {
                dateTime: startLocal,
                timeZone: "Asia/Kolkata",
            },
            end: {
                dateTime: endLocal,
                timeZone: "Asia/Kolkata",
            },
            attendees: [
                {
                    email: attendeeEmail,
                },
            ],
        },
    });
    return {
        id: response.data.id,
        htmlLink: response.data.htmlLink,
        status: response.data.status,
        summary: response.data.summary,
        start: response.data.start,
        end: response.data.end,
    };
}
//# sourceMappingURL=calendar.js.map