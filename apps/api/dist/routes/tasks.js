"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contacts_1 = require("../services/contacts");
const calendar_1 = require("../services/calendar");
const router = (0, express_1.Router)();
function getTomorrowIndiaDate() {
    const now = new Date();
    const indiaString = now.toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
    });
    const indiaDate = new Date(indiaString);
    indiaDate.setDate(indiaDate.getDate() + 1);
    const year = indiaDate.getFullYear();
    const month = String(indiaDate.getMonth() + 1).padStart(2, "0");
    const day = String(indiaDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
function parseRequestedTime(goal) {
    // 3:30 PM, 3 PM, 3:30pm, 3pm
    const amPmMatch = goal.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b/i);
    if (amPmMatch) {
        let hour = Number(amPmMatch[1]);
        const minute = Number(amPmMatch[2] || "0");
        const meridiem = amPmMatch[3].toUpperCase();
        if (hour < 1 ||
            hour > 12 ||
            minute < 0 ||
            minute > 59) {
            return null;
        }
        if (meridiem === "AM") {
            if (hour === 12) {
                hour = 0;
            }
        }
        else {
            if (hour !== 12) {
                hour += 12;
            }
        }
        return {
            hour,
            minute,
            explicit: true,
        };
    }
    // 15:30 / 15:00
    const twentyFourHourMatch = goal.match(/(?:at\s+)?\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (twentyFourHourMatch) {
        return {
            hour: Number(twentyFourHourMatch[1]),
            minute: Number(twentyFourHourMatch[2]),
            explicit: true,
        };
    }
    return {
        explicit: false,
    };
}
function buildIndiaDateTime(date, hour, minute) {
    return new Date(`${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+05:30`);
}
router.post("/", async (req, res) => {
    console.log("TASK:", req.body);
    try {
        const goal = String(req.body?.goal || "").trim();
        if (!goal) {
            return res.status(400).json({
                error: "Please enter a task.",
            });
        }
        const tokens = req.session.googleTokens;
        if (!tokens?.access_token) {
            return res.status(401).json({
                error: "Please connect Google first.",
            });
        }
        if (!/meeting|schedule|book/i.test(goal)) {
            return res.json({
                status: "UNSUPPORTED",
                message: "The MVP currently supports meeting scheduling.",
            });
        }
        // -----------------------------
        // Find duration
        // -----------------------------
        const durationMatch = goal.match(/(\d+)\s*[-]?\s*minute/i);
        const durationMinutes = durationMatch
            ? Number(durationMatch[1])
            : 30;
        // -----------------------------
        // Find contact
        // -----------------------------
        const personName = "Rahul";
        const contacts = await (0, contacts_1.findContact)(tokens.access_token, tokens.refresh_token, personName);
        const contact = contacts.find((item) => typeof item.email === "string" &&
            item.email.trim().length > 0);
        if (!contact || typeof contact.email !== "string") {
            return res.status(404).json({
                status: "CONTACT_NOT_FOUND",
                message: `I couldn't find ${personName} with a valid email address in Google Contacts.`,
            });
        }
        const attendeeEmail = contact.email;
        // -----------------------------
        // Tomorrow
        // -----------------------------
        const date = getTomorrowIndiaDate();
        // -----------------------------
        // Requested time
        // -----------------------------
        const requestedTime = parseRequestedTime(goal);
        if (!requestedTime) {
            return res.status(400).json({
                status: "INVALID_TIME",
                message: "I couldn't understand the requested meeting time.",
            });
        }
        let startDateTime;
        let endDateTime;
        if (requestedTime.explicit) {
            // --------------------------------
            // EXACT TIME WAS REQUESTED
            // --------------------------------
            startDateTime =
                buildIndiaDateTime(date, requestedTime.hour, requestedTime.minute);
            endDateTime = new Date(startDateTime.getTime() +
                durationMinutes *
                    60 *
                    1000);
            console.log("EXACT REQUESTED TIME:", startDateTime.toISOString());
            // Check the EXACT requested time.
            const availability = await (0, calendar_1.checkExactSlot)(tokens.access_token, tokens.refresh_token, startDateTime.toISOString(), endDateTime.toISOString());
            if (!availability.available) {
                return res.status(409).json({
                    status: "TIME_UNAVAILABLE",
                    message: "The exact requested time is already occupied.",
                    requestedTime: startDateTime.toISOString(),
                    durationMinutes,
                    contact,
                });
            }
        }
        else {
            // --------------------------------
            // NO EXACT TIME
            // --------------------------------
            let windowStartHour = 13;
            let windowEndHour = 18;
            if (/morning/i.test(goal)) {
                windowStartHour = 9;
                windowEndHour = 12;
            }
            if (/afternoon/i.test(goal)) {
                windowStartHour = 13;
                windowEndHour = 18;
            }
            if (/evening/i.test(goal)) {
                windowStartHour = 17;
                windowEndHour = 21;
            }
            const slot = await (0, calendar_1.findAvailableSlot)(tokens.access_token, tokens.refresh_token, date, durationMinutes, windowStartHour, windowEndHour);
            if (!slot.available ||
                !slot.startDateTime ||
                !slot.endDateTime) {
                return res.json({
                    status: "NO_SLOT",
                    message: "I couldn't find an available slot in the requested time window.",
                    contact,
                });
            }
            startDateTime = new Date(slot.startDateTime);
            endDateTime = new Date(slot.endDateTime);
        }
        // -----------------------------
        // Create REAL meeting
        // -----------------------------
        const meeting = await (0, calendar_1.createMeeting)(tokens.access_token, tokens.refresh_token, `Meeting with ${contact.name}`, startDateTime.toISOString(), endDateTime.toISOString(), attendeeEmail);
        return res.json({
            status: "COMPLETED",
            message: "Meeting created successfully.",
            contact,
            scheduledTime: {
                startDateTime: startDateTime.toISOString(),
                endDateTime: endDateTime.toISOString(),
                display: startDateTime.toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                }),
            },
            meeting,
        });
    }
    catch (error) {
        console.error("========== TASK ERROR ==========");
        console.error(error);
        console.error("================================");
        return res.status(500).json({
            error: error instanceof Error
                ? error.message
                : "Task failed.",
        });
    }
});
exports.default = router;
//# sourceMappingURL=tasks.js.map