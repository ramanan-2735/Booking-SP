import { Booking, Client, GoogleCalendarEvent, GoogleCalendarItem } from '../types';

/**
 * List the user's calendars from Google Calendar
 */
export async function listUserCalendars(accessToken: string): Promise<GoogleCalendarItem[]> {
  const url = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch calendars (${res.status})`);
  }

  const data = await res.json();
  const items: any[] = data.items || [];
  return items.map((item) => ({
    id: item.id,
    summary: item.summary,
    description: item.description,
    primary: !!item.primary,
    backgroundColor: item.backgroundColor,
    foregroundColor: item.foregroundColor,
  }));
}

/**
 * Helper to parse startDate ("2026-08-22") + startTime ("09:00 AM" or "14:30") + durationHours (e.g. 2)
 * into ISO start and end Date objects in local time
 */
export function calculateEventTimeRange(
  startDate: string,
  startTime: string,
  durationHours: number
): { startIso: string; endIso: string; timeZone: string } {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  
  // Format standard date part YYYY-MM-DD
  let datePart = startDate.trim();
  if (datePart.includes('/')) {
    // If format DD/MM/YYYY or MM/DD/YYYY
    const parts = datePart.split('/');
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        // Assume YYYY at end, convert to YYYY-MM-DD
        datePart = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
    }
  }

  let hours = 9;
  let minutes = 0;

  if (startTime) {
    const cleanTime = startTime.trim();
    const isPM = /pm/i.test(cleanTime);
    const isAM = /am/i.test(cleanTime);
    const match = cleanTime.replace(/(am|pm)/i, '').trim().split(':');
    
    if (match.length >= 1) {
      let parsedH = parseInt(match[0], 10);
      if (!isNaN(parsedH)) {
        if (isPM && parsedH < 12) parsedH += 12;
        if (isAM && parsedH === 12) parsedH = 0;
        hours = parsedH;
      }
    }
    if (match.length >= 2) {
      const parsedM = parseInt(match[1], 10);
      if (!isNaN(parsedM)) {
        minutes = parsedM;
      }
    }
  }

  const startDateObj = new Date(`${datePart}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
  // Fallback if invalid
  if (isNaN(startDateObj.getTime())) {
    const now = new Date();
    const endNow = new Date(now.getTime() + (durationHours || 1) * 3600 * 1000);
    return {
      startIso: now.toISOString(),
      endIso: endNow.toISOString(),
      timeZone,
    };
  }

  const endDateObj = new Date(startDateObj.getTime() + (durationHours || 1) * 3600 * 1000);

  return {
    startIso: startDateObj.toISOString(),
    endIso: endDateObj.toISOString(),
    timeZone,
  };
}

/**
 * Fetch events for a given calendar
 */
export async function getCalendarEvents(
  accessToken: string,
  calendarId = 'primary',
  timeMin?: string,
  timeMax?: string
): Promise<GoogleCalendarEvent[]> {
  let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    calendarId
  )}/events?singleEvents=true&orderBy=startTime&maxResults=100`;

  if (timeMin) url += `&timeMin=${encodeURIComponent(timeMin)}`;
  if (timeMax) url += `&timeMax=${encodeURIComponent(timeMax)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch calendar events (${res.status})`);
  }

  const data = await res.json();
  return (data.items || []).map((ev: any) => ({
    id: ev.id,
    summary: ev.summary || '(Untitled Event)',
    description: ev.description,
    location: ev.location,
    start: ev.start || {},
    end: ev.end || {},
    htmlLink: ev.htmlLink,
    status: ev.status,
    attendees: ev.attendees,
  }));
}

/**
 * Create a new event on Google Calendar for a booking
 */
export async function createCalendarEventForBooking(
  accessToken: string,
  calendarId: string,
  booking: Booking,
  client?: Client
): Promise<{ eventId: string; htmlLink: string }> {
  const { startIso, endIso, timeZone } = calculateEventTimeRange(
    booking.startDate,
    booking.startTime,
    booking.durationHours
  );

  const eventPayload: any = {
    summary: `Client Session: ${booking.clientName || 'Client'} (${booking.id})`,
    description: `Client: ${booking.clientName} (${booking.clientId})\nBooking ID: ${booking.id}\nDuration: ${booking.durationHours} hrs\nStatus: ${booking.status}\nNotes: ${booking.notes || 'None'}\n\nManaged via Client Session & Booking Manager`,
    start: {
      dateTime: startIso,
      timeZone,
    },
    end: {
      dateTime: endIso,
      timeZone,
    },
    status: booking.status === 'Cancelled' ? 'cancelled' : 'confirmed',
  };

  if (client?.email) {
    eventPayload.attendees = [{ email: client.email, displayName: client.name }];
  }

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to create calendar event (${res.status})`);
  }

  const created = await res.json();
  return {
    eventId: created.id,
    htmlLink: created.htmlLink || `https://calendar.google.com/calendar/r/eventedit/${created.id}`,
  };
}

/**
 * Update an existing event on Google Calendar
 */
export async function updateCalendarEventForBooking(
  accessToken: string,
  calendarId: string,
  eventId: string,
  booking: Booking,
  client?: Client
): Promise<{ eventId: string; htmlLink: string }> {
  const { startIso, endIso, timeZone } = calculateEventTimeRange(
    booking.startDate,
    booking.startTime,
    booking.durationHours
  );

  const eventPayload: any = {
    summary: `Client Session: ${booking.clientName || 'Client'} (${booking.id})`,
    description: `Client: ${booking.clientName} (${booking.clientId})\nBooking ID: ${booking.id}\nDuration: ${booking.durationHours} hrs\nStatus: ${booking.status}\nNotes: ${booking.notes || 'None'}\n\nManaged via Client Session & Booking Manager`,
    start: {
      dateTime: startIso,
      timeZone,
    },
    end: {
      dateTime: endIso,
      timeZone,
    },
    status: booking.status === 'Cancelled' ? 'cancelled' : 'confirmed',
  };

  if (client?.email) {
    eventPayload.attendees = [{ email: client.email, displayName: client.name }];
  }

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    calendarId
  )}/events/${encodeURIComponent(eventId)}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to update calendar event (${res.status})`);
  }

  const updated = await res.json();
  return {
    eventId: updated.id || eventId,
    htmlLink: updated.htmlLink || `https://calendar.google.com/calendar/r/eventedit/${updated.id || eventId}`,
  };
}

/**
 * Delete an event on Google Calendar
 */
export async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    calendarId
  )}/events/${encodeURIComponent(eventId)}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to delete calendar event (${res.status})`);
  }
}
