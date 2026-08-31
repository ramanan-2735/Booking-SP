import * as XLSX from 'xlsx';
import { Client, SessionPurchase, Booking, ClientStats } from '../types';

export function exportAllDataToExcel(
  clients: Client[],
  purchases: SessionPurchase[],
  bookings: Booking[],
  getClientStats: (clientId: string) => ClientStats | undefined
) {
  const workbook = XLSX.utils.book_new();

  // 1. Clients Sheet - Matching exact column format from user request
  const clientsData = clients.map((client) => {
    const stats = getClientStats(client.id);
    return {
      'Client ID': client.id,
      'Client Name': client.name,
      'Phone': client.phone ? String(client.phone).trim() : 'N/A',
      'Email': client.email || 'N/A',
      'First Booking Date': stats?.firstBookingDate || 'N/A',
      'Total Hours Purchased': stats?.totalHoursPurchased ?? 0,
      'Total Slots Used': stats?.totalSlotsUsed ?? 0,
      'Hours Remaining': stats?.hoursRemaining ?? 0,
      'Notes': client.notes || 'N/A',
      'Created At': client.createdAt || new Date().toISOString(),
    };
  });

  const clientsSheet = XLSX.utils.json_to_sheet(clientsData);

  // Set column widths for clean readability in Excel
  clientsSheet['!cols'] = [
    { wch: 12 }, // Client ID
    { wch: 20 }, // Client Name
    { wch: 16 }, // Phone
    { wch: 26 }, // Email
    { wch: 20 }, // First Booking Date
    { wch: 22 }, // Total Hours Purchased
    { wch: 18 }, // Total Slots Used
    { wch: 18 }, // Hours Remaining
    { wch: 30 }, // Notes
    { wch: 25 }, // Created At
  ];

  XLSX.utils.book_append_sheet(workbook, clientsSheet, 'Clients Master');

  // 2. Purchases Sheet
  const purchasesData = purchases.map((p) => ({
    'Purchase ID': p.id,
    'Client ID': p.clientId,
    'Client Name': p.clientName,
    'Hours Purchased': p.hoursPurchased,
    'Rate Per Hour': p.ratePerHour,
    'Total Amount': p.totalAmount,
    'Payment Status': p.paymentStatus,
    'Purchase Date': p.purchaseDate,
    'Notes': p.notes || 'N/A',
    'Created At': p.createdAt || 'N/A',
  }));
  const purchasesSheet = XLSX.utils.json_to_sheet(purchasesData);
  purchasesSheet['!cols'] = [
    { wch: 14 },
    { wch: 12 },
    { wch: 20 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 15 },
    { wch: 15 },
    { wch: 25 },
    { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(workbook, purchasesSheet, 'Purchases');

  // 3. Bookings Sheet
  const bookingsData = bookings.map((b) => ({
    'Booking ID': b.id,
    'Client ID': b.clientId,
    'Client Name': b.clientName,
    'Court': b.courtName || b.courtId,
    'Date': b.startDate,
    'Time': b.startTime,
    'Duration (Hours)': b.durationHours,
    'Status': b.status,
    'Notes': b.notes || 'N/A',
    'Created At': b.createdAt || 'N/A',
  }));
  const bookingsSheet = XLSX.utils.json_to_sheet(bookingsData);
  bookingsSheet['!cols'] = [
    { wch: 14 },
    { wch: 12 },
    { wch: 20 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 18 },
    { wch: 12 },
    { wch: 25 },
    { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(workbook, bookingsSheet, 'Bookings');

  // Generate and trigger download of .xlsx file
  const fileName = `BSC_Booking_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
