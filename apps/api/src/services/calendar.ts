import { google } from "googleapis";
import { createGoogleClient } from "./google";

export async function getCalendarEvents(
  accessToken: string,
  refreshToken: string | undefined,
  timeMin: string,
  timeMax: string
) {
  const auth = createGoogleClient(accessToken, refreshToken);

  const calendar = google.calendar({
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

export async function createMeeting(
  accessToken: string,
  refreshToken: string | undefined,
  title: string,
  startDateTime: string,
  endDateTime: string,
  attendeeEmail: string
) {
  const auth = createGoogleClient(accessToken, refreshToken);

  const calendar = google.calendar({
    version: "v3",
    auth,
  });

  const response = await calendar.events.insert({
    calendarId: "primary",
    sendUpdates: "all",
    requestBody: {
      summary: title,
      start: {
        dateTime: startDateTime,
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: endDateTime,
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
  };
}
export async function findAvailableSlot(
  accessToken: string,
  refreshToken: string | undefined,
  date: string,
  durationMinutes: number,
  windowStartHour = 12,
  windowEndHour = 18
) {
  const timeZoneOffset = "+05:30";

  const windowStart = new Date(
    `${date}T${String(windowStartHour).padStart(2, "0")}:00:00${timeZoneOffset}`
  );

  const windowEnd = new Date(
    `${date}T${String(windowEndHour).padStart(2, "0")}:00:00${timeZoneOffset}`
  );

  if (
    Number.isNaN(windowStart.getTime()) ||
    Number.isNaN(windowEnd.getTime())
  ) {
    throw new Error("Invalid date");
  }

  if (windowEnd <= windowStart) {
    throw new Error("Invalid availability window");
  }

  const events = await getCalendarEvents(
    accessToken,
    refreshToken,
    windowStart.toISOString(),
    windowEnd.toISOString()
  );

  const busyPeriods = events
    .map((event: any) => {
      const start = event.start?.dateTime
        ? new Date(event.start.dateTime)
        : event.start?.date
          ? new Date(`${event.start.date}T00:00:00${timeZoneOffset}`)
          : null;

      const end = event.end?.dateTime
        ? new Date(event.end.dateTime)
        : event.end?.date
          ? new Date(`${event.end.date}T23:59:59${timeZoneOffset}`)
          : null;

      if (!start || !end) {
        return null;
      }

      return { start, end };
    })
    .filter(
      (
        period
      ): period is { start: Date; end: Date } => period !== null
    )
    .sort(
      (a, b) => a.start.getTime() - b.start.getTime()
    );

  const durationMs = durationMinutes * 60 * 1000;

  let candidate = new Date(windowStart);

  for (const busy of busyPeriods) {
    if (
      candidate.getTime() + durationMs <=
      busy.start.getTime()
    ) {
      return {
        available: true,
        startDateTime: candidate.toISOString(),
        endDateTime: new Date(
          candidate.getTime() + durationMs
        ).toISOString(),
        durationMinutes,
      };
    }

    if (busy.end > candidate) {
      candidate = new Date(busy.end);
    }
  }

  if (
    candidate.getTime() + durationMs <=
    windowEnd.getTime()
  ) {
    return {
      available: true,
      startDateTime: candidate.toISOString(),
      endDateTime: new Date(
        candidate.getTime() + durationMs
      ).toISOString(),
      durationMinutes,
    };
  }

  return {
    available: false,
    message: "No available slot in the requested window.",
  };
}