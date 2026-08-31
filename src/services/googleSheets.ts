import { Client, SessionPurchase, Booking, ClientStats } from '../types';

export interface DriveSpreadsheet {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface SheetsSyncResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  error?: string;
}

export interface ImportedSheetsData {
  clients: Client[];
  purchases: SessionPurchase[];
  bookings: Booking[];
}

/**
 * List existing spreadsheets from Google Drive for the current user
 */
export async function listUserSpreadsheets(accessToken: string): Promise<DriveSpreadsheet[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const fields = encodeURIComponent('files(id, name, modifiedTime, webViewLink)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime desc&pageSize=30`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch spreadsheets (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Creates a brand new Google Spreadsheet configured with Clients, Purchases, and Bookings tabs
 */
export async function createNewSpreadsheetWithData(
  accessToken: string,
  title: string,
  clients: Client[],
  purchases: SessionPurchase[],
  bookings: Booking[],
  getClientStats: (id: string) => ClientStats | null
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // 1. Create spreadsheet with 3 sheets
  const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  const createPayload = {
    properties: {
      title: title || `Client Sessions & Bookings (${new Date().toLocaleDateString()})`,
    },
    sheets: [
      { properties: { title: 'Clients', index: 0 } },
      { properties: { title: 'Purchases', index: 1 } },
      { properties: { title: 'Bookings', index: 2 } },
    ],
  };

  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create spreadsheet (${createRes.status})`);
  }

  const created = await createRes.json();
  const spreadsheetId = created.spreadsheetId;
  const spreadsheetUrl = created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // 2. Populate data into the newly created sheets
  await exportAllDataToSpreadsheet(
    accessToken,
    spreadsheetId,
    clients,
    purchases,
    bookings,
    getClientStats
  );

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Exports clients, purchases, and bookings into the target spreadsheet
 */
export async function exportAllDataToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  clients: Client[],
  purchases: SessionPurchase[],
  bookings: Booking[],
  getClientStats: (id: string) => ClientStats | null
): Promise<void> {
  // Check sheet tabs in spreadsheet
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to access target spreadsheet');
  }

  const metaData = await metaRes.json();
  const existingSheetTitles: string[] = (metaData.sheets || []).map(
    (s: { properties?: { title?: string } }) => s.properties?.title || ''
  );

  // Add missing sheets if needed
  const requiredSheets = ['Clients', 'Purchases', 'Bookings'];
  const missingSheets = requiredSheets.filter((req) => !existingSheetTitles.includes(req));

  if (missingSheets.length > 0) {
    const addSheetRequests = missingSheets.map((title) => ({
      addSheet: {
        properties: { title },
      },
    }));

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: addSheetRequests }),
    });
  }

  // Build rows for Clients
  const clientHeaders = [
    'Client ID',
    'Client Name',
    'Phone',
    'Email',
    'First Booking Date',
    'Total Hours Purchased',
    'Total Slots Used',
    'Hours Remaining',
    'Notes',
    'Created At',
  ];

  const clientRows = clients.map((c) => {
    const st = getClientStats(c.id);
    return [
      c.id,
      c.name,
      c.phone || '',
      c.email || '',
      c.firstBookingDate || (st ? st.firstBookingDate : ''),
      st ? st.totalHoursPurchased : 0,
      st ? st.totalSlotsUsed : 0,
      st ? st.hoursRemaining : 0,
      c.notes || '',
      c.createdAt || '',
    ];
  });

  // Build rows for Purchases
  const purchaseHeaders = [
    'Purchase ID',
    'Client ID',
    'Client Name',
    'Purchase Date',
    'Hours Purchased',
    'Rate Per Hour ($)',
    'Total Amount ($)',
    'Payment Status',
    'Notes',
    'Created At',
  ];

  const purchaseRows = purchases.map((p) => [
    p.id,
    p.clientId,
    p.clientName,
    p.purchaseDate,
    p.hoursPurchased,
    p.ratePerHour || '',
    p.totalAmount || '',
    p.paymentStatus || 'Paid',
    p.notes || '',
    p.createdAt || '',
  ]);

  // Build rows for Bookings
  const bookingHeaders = [
    'Booking ID',
    'Client ID',
    'Client Name',
    'Linked Purchase ID',
    'Start Date',
    'Start Time',
    'Duration / Slots Used (Hrs)',
    'Status',
    'Agenda / Notes',
    'Created At',
  ];

  const bookingRows = bookings.map((b) => [
    b.id,
    b.clientId,
    b.clientName,
    b.purchaseId || '',
    b.startDate,
    b.startTime,
    b.durationHours,
    b.status,
    b.notes || '',
    b.createdAt || '',
  ]);

  // Clear existing ranges to avoid dangling rows
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ranges: ['Clients!A1:Z500', 'Purchases!A1:Z500', 'Bookings!A1:Z500'],
      }),
    }
  );

  // Batch update values
  const updatePayload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: 'Clients!A1',
        majorDimension: 'ROWS',
        values: [clientHeaders, ...clientRows],
      },
      {
        range: 'Purchases!A1',
        majorDimension: 'ROWS',
        values: [purchaseHeaders, ...purchaseRows],
      },
      {
        range: 'Bookings!A1',
        majorDimension: 'ROWS',
        values: [bookingHeaders, ...bookingRows],
      },
    ],
  };

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to update sheet values');
  }
}

/**
 * Import and parse data from an existing Google Spreadsheet
 */
export async function importDataFromSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<ImportedSheetsData> {
  // Fetch metadata first to get exact sheet titles
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to read spreadsheet metadata');
  }

  const metaData = await metaRes.json();
  const sheetTitles: string[] = (metaData.sheets || []).map(
    (s: { properties?: { title?: string } }) => s.properties?.title || ''
  );

  // Find corresponding sheets (case-insensitive)
  const clientSheetName = sheetTitles.find((t) => /client|master/i.test(t)) || sheetTitles[0] || 'Clients';
  const purchaseSheetName = sheetTitles.find((t) => /purchase|package/i.test(t)) || (sheetTitles[1] || 'Purchases');
  const bookingSheetName = sheetTitles.find((t) => /booking|session|schedule/i.test(t)) || (sheetTitles[2] || 'Bookings');

  // Read ranges in batch
  const ranges = [
    encodeURIComponent(`${clientSheetName}!A1:Z500`),
    encodeURIComponent(`${purchaseSheetName}!A1:Z500`),
    encodeURIComponent(`${bookingSheetName}!A1:Z500`),
  ];

  const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=${ranges.join('&ranges=')}`;
  const batchRes = await fetch(batchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!batchRes.ok) {
    const err = await batchRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch spreadsheet ranges');
  }

  const batchData = await batchRes.json();
  const valueRanges = batchData.valueRanges || [];

  const clientValues: any[][] = (valueRanges[0] && valueRanges[0].values) || [];
  const purchaseValues: any[][] = (valueRanges[1] && valueRanges[1].values) || [];
  const bookingValues: any[][] = (valueRanges[2] && valueRanges[2].values) || [];

  // Parse Clients (skip header row if present)
  const parsedClients: Client[] = [];
  const clientRows = clientValues.length > 0 && isHeaderRow(clientValues[0]) ? clientValues.slice(1) : clientValues;

  clientRows.forEach((row, idx) => {
    if (!row || row.length === 0 || !row[0] || !row[1]) return;
    parsedClients.push({
      id: String(row[0]).trim() || `CLI${(idx + 1).toString().padStart(4, '0')}`,
      name: String(row[1]).trim(),
      phone: row[2] ? String(row[2]).trim() : undefined,
      email: row[3] ? String(row[3]).trim() : undefined,
      firstBookingDate: row[4] ? String(row[4]).trim() : undefined,
      notes: row[8] ? String(row[8]).trim() : undefined,
      createdAt: row[9] ? String(row[9]).trim() : new Date().toISOString(),
    });
  });

  // Parse Purchases
  const parsedPurchases: SessionPurchase[] = [];
  const purchaseRows = purchaseValues.length > 0 && isHeaderRow(purchaseValues[0]) ? purchaseValues.slice(1) : purchaseValues;

  purchaseRows.forEach((row, idx) => {
    if (!row || row.length === 0 || !row[0]) return;
    parsedPurchases.push({
      id: String(row[0]).trim() || `Pur${(idx + 1).toString().padStart(4, '0')}`,
      clientId: String(row[1] || '').trim(),
      clientName: String(row[2] || '').trim(),
      purchaseDate: String(row[3] || new Date().toISOString().slice(0, 10)).trim(),
      hoursPurchased: Number(row[4]) || 0,
      ratePerHour: row[5] && !isNaN(Number(row[5])) ? Number(row[5]) : undefined,
      totalAmount: row[6] && !isNaN(Number(row[6])) ? Number(row[6]) : undefined,
      paymentStatus: (row[7] === 'Pending' || row[7] === 'Partial') ? row[7] : 'Paid',
      notes: row[8] ? String(row[8]).trim() : undefined,
      createdAt: row[9] ? String(row[9]).trim() : new Date().toISOString(),
    });
  });

  // Parse Bookings
  const parsedBookings: Booking[] = [];
  const bookingRows = bookingValues.length > 0 && isHeaderRow(bookingValues[0]) ? bookingValues.slice(1) : bookingValues;

  bookingRows.forEach((row, idx) => {
    if (!row || row.length === 0 || !row[0]) return;
    const rawStatus = String(row[7] || '').trim();
    let status: Booking['status'] = 'Scheduled';
    if (['Completed', 'In Progress', 'Cancelled'].includes(rawStatus)) {
      status = rawStatus as Booking['status'];
    }

    parsedBookings.push({
      id: String(row[0]).trim() || `BK${(idx + 1).toString().padStart(4, '0')}`,
      clientId: String(row[1] || '').trim(),
      clientName: String(row[2] || '').trim(),
      purchaseId: row[3] ? String(row[3]).trim() : undefined,
      courtId: 'court-1',
      courtName: 'Court 1',
      startDate: String(row[4] || new Date().toISOString().slice(0, 10)).trim(),
      startTime: String(row[5] || '09:00 AM').trim(),
      durationHours: Number(row[6]) || 0,
      status,
      notes: row[8] ? String(row[8]).trim() : undefined,
      createdAt: row[9] ? String(row[9]).trim() : new Date().toISOString(),
    });
  });

  return {
    clients: parsedClients,
    purchases: parsedPurchases,
    bookings: parsedBookings,
  };
}

function isHeaderRow(row: any[]): boolean {
  if (!row || row.length === 0) return false;
  const firstCell = String(row[0] || '').toLowerCase();
  return (
    firstCell.includes('id') ||
    firstCell.includes('name') ||
    firstCell.includes('client') ||
    firstCell.includes('purchase') ||
    firstCell.includes('booking')
  );
}
