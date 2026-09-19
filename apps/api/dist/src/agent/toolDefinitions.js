"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolDefinitions = void 0;
exports.toolDefinitions = [
    {
        type: "function",
        function: {
            name: "find_contact",
            description: "Find a person's contact information by name. Use this before creating a meeting with a person.",
            parameters: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "The person's name",
                    },
                },
                required: ["name"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "check_calendar",
            description: "Get calendar events between two ISO timestamps so you can determine availability.",
            parameters: {
                type: "object",
                properties: {
                    timeMin: {
                        type: "string",
                        description: "Start of the period in ISO 8601 format",
                    },
                    timeMax: {
                        type: "string",
                        description: "End of the period in ISO 8601 format",
                    },
                },
                required: ["timeMin", "timeMax"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "find_available_slot",
            description: "Find the first genuinely free calendar slot in a requested time window. The application calculates availability from the real calendar.",
            parameters: {
                type: "object",
                properties: {
                    date: {
                        type: "string",
                        description: "Date in YYYY-MM-DD format",
                    },
                    durationMinutes: {
                        type: "number",
                        description: "Required meeting duration in minutes",
                    },
                    windowStartHour: {
                        type: "number",
                        description: "Start hour in local India time, for example 12",
                    },
                    windowEndHour: {
                        type: "number",
                        description: "End hour in local India time, for example 18",
                    }
                },
                required: [
                    "date",
                    "durationMinutes",
                    "windowStartHour",
                    "windowEndHour"
                ]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "create_meeting",
            description: "Create a calendar meeting with an attendee. Only use this after finding the contact and checking calendar availability.",
            parameters: {
                type: "object",
                properties: {
                    title: {
                        type: "string",
                        description: "Meeting title",
                    },
                    startDateTime: {
                        type: "string",
                        description: "Meeting start time in ISO 8601 format",
                    },
                    endDateTime: {
                        type: "string",
                        description: "Meeting end time in ISO 8601 format",
                    },
                    attendeeEmail: {
                        type: "string",
                        description: "Email address of the verified contact",
                    },
                },
                required: [
                    "title",
                    "startDateTime",
                    "endDateTime",
                    "attendeeEmail",
                ],
            },
        },
    },
];
