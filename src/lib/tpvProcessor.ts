import { 
  type TPVTransaction, 
  type TPVReport, 
  type TPVReportSummary, 
  type TPVCommissionDistribution,
  type RevenueDistribution,
  type CommissionRecipient,
  type TPVConfig,
  type TPVReportFormat,
  type PromoterRef,
  TPV_CONFIG_DEFAULTS
} from './types';

// Simple UUID generator without external dependency
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Billpocket CSV column mappings
const BILLPOCKET_COLUMNS = {
  transactionId: 'ID TRANSACCION',
  dateTime: 'FECHA/HORA',
  device: 'DISPOSITIVO',
  card: 'TARJETA',
  type: 'TIPO',
  subtotal: 'SUBTOTAL',
  tip: 'PROPINA',
  totalAmount: 'MONTO TOTAL',
  refundAmount: 'MONTO DEVOLUCION',
  commission: 'COMISION',
};

export interface ParsedCSVRow {
  transactionId: string;
  dateTime: string;
  device: string;
  cardNumber: string;
  cardType: 'Debito' | 'Credito' | 'Internacional';
  subtotal: number;
  tip: number;
  totalAmount: number;
  refundAmount: number;
  providerCommission: number;
}

// Promoter info for commission calculation
export interface PromoterInfo {
  promoterId: string;
  promoterName: string;
  percentage: number; // Percentage of WitBiz commission that goes to this promoter
}

export interface ProcessingConfig {
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  supplierId?: string;
  supplierName?: string;
  revenueDistribution: RevenueDistribution;
  witbizCommissionRate: number; // Legacy - kept for compatibility
  // New TPV Configuration
  tpvConfig?: TPVConfig;
  // Promoters linked to this client
  promoters?: PromoterInfo[];
}

// Helper to get effective TPV config (client override > service default > global default)
export function getEffectiveTPVConfig(
  clientConfig?: TPVConfig,
  serviceConfig?: TPVConfig,
  defaultFormat: TPVReportFormat = 'formato2'
): TPVConfig {
  // Priority: Client > Service > Default
  if (clientConfig) return clientConfig;
  if (serviceConfig) return serviceConfig;
  return TPV_CONFIG_DEFAULTS[defaultFormat];
}

// Get commission rate based on card type and TPV config
export function getCommissionRateForCardType(
  cardType: 'Debito' | 'Credito' | 'Internacional',
  tpvConfig: TPVConfig
): { billpocketRate: number; witbizRate: number } {
  const isInternacional = cardType === 'Internacional';
  return {
    billpocketRate: isInternacional 
      ? tpvConfig.billpocketInternacional 
      : tpvConfig.billpocketNacional,
    witbizRate: tpvConfig.witbizComision,
  };
}

// Detect if a CSV is from Billpocket by checking headers
export function detectBillpocketCSV(csvContent: string): boolean {
  const firstLine = csvContent.split('\n')[0].toLowerCase();
  return (
    firstLine.includes('id transaccion') &&
    firstLine.includes('dispositivo') &&
    firstLine.includes('tarjeta') &&
    firstLine.includes('comision')
  );
}

// Parse CSV content into structured rows
export function parseCSV(csvContent: string): string[][] {
  const lines = csvContent.trim().split('\n');
  const result: string[][] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Handle quoted values with commas inside
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    result.push(row);
  }
  
  return result;
}

// Parse Billpocket CSV specifically
export function parseBillpocketCSV(csvContent: string): ParsedCSVRow[] {
  const rows = parseCSV(csvContent);
  if (rows.length < 2) return [];
  
  const headers = rows[0].map(h => h.replace(/"/g, '').trim());
  const dataRows = rows.slice(1);
  
  // Find column indices
  const getColumnIndex = (name: string): number => {
    return headers.findIndex(h => 
      h.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(h.toLowerCase())
    );
  };
  
  const indices = {
    transactionId: getColumnIndex('ID TRANSACCION'),
    dateTime: getColumnIndex('FECHA'),
    device: getColumnIndex('DISPOSITIVO'),
    card: getColumnIndex('TARJETA'),
    type: getColumnIndex('TIPO'),
    subtotal: getColumnIndex('SUBTOTAL'),
    tip: getColumnIndex('PROPINA'),
    totalAmount: getColumnIndex('MONTO TOTAL'),
    refundAmount: getColumnIndex('MONTO DEVOLUCION'),
    commission: getColumnIndex('COMISION'),
  };
  
  const parseNumber = (value: string): number => {
    if (!value) return 0;
    const cleaned = value.replace(/[,$"]/g, '').trim();
    return parseFloat(cleaned) || 0;
  };
  
  const normalizeCardType = (type: string): 'Debito' | 'Credito' | 'Internacional' => {
    const normalized = type.toLowerCase().trim();
    if (normalized.includes('internacional')) return 'Internacional';
    if (normalized.includes('credito') || normalized.includes('crédito')) return 'Credito';
    return 'Debito';
  };
  
  const parsedRows: ParsedCSVRow[] = [];
  
  for (const row of dataRows) {
    if (row.length < 5) continue; // Skip incomplete rows
    
    const transactionId = row[indices.transactionId] || '';
    if (!transactionId) continue; // Skip rows without transaction ID
    
    parsedRows.push({
      transactionId: transactionId.replace(/"/g, ''),
      dateTime: row[indices.dateTime]?.replace(/"/g, '') || '',
      device: row[indices.device]?.replace(/"/g, '') || '',
      cardNumber: row[indices.card]?.replace(/"/g, '') || '',
      cardType: normalizeCardType(row[indices.type] || ''),
      subtotal: parseNumber(row[indices.subtotal]),
      tip: parseNumber(row[indices.tip]),
      totalAmount: parseNumber(row[indices.totalAmount]),
      refundAmount: parseNumber(row[indices.refundAmount]),
      providerCommission: parseNumber(row[indices.commission]),
    });
  }
  
  return parsedRows;
}

// Calculate provider commission rate from actual values
function calculateProviderRate(commission: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((commission / total) * 10000) / 100; // Round to 2 decimals
}

// Process transactions with commission calculations
// Now uses TPVConfig for differentiated commission rates by card type
export function processTransactions(
  parsedRows: ParsedCSVRow[],
  config: ProcessingConfig
): TPVTransaction[] {
  // Get effective TPV config or fall back to legacy witbizCommissionRate
  const tpvConfig = config.tpvConfig || TPV_CONFIG_DEFAULTS['formato2'];
  const isFormato1 = tpvConfig.reportFormat === 'formato1';
  
  return parsedRows.map((row): TPVTransaction => {
    // Get commission rates based on card type
    const { billpocketRate, witbizRate } = getCommissionRateForCardType(row.cardType, tpvConfig);
    
    // Calculate commissions
    const providerCommission = row.providerCommission; // From CSV (actual Billpocket charge)
    const providerRate = calculateProviderRate(providerCommission, row.totalAmount);
    
    // WitBiz commission is always based on total amount
    const witbizCommission = Math.round((row.totalAmount * witbizRate / 100) * 100) / 100;
    
    // Client return depends on format:
    // Formato 1: Client pays both Billpocket + WitBiz separately
    // Formato 2: Client pays only WitBiz (which absorbs Billpocket)
    let clientReturn: number;
    if (isFormato1) {
      // Formato 1: Deduct both commissions
      clientReturn = Math.round((row.totalAmount - providerCommission - witbizCommission) * 100) / 100;
    } else {
      // Formato 2: Only deduct WitBiz commission (Billpocket absorbed)
      clientReturn = Math.round((row.totalAmount - witbizCommission) * 100) / 100;
    }
    
    return {
      id: generateId(),
      transactionId: row.transactionId,
      dateTime: row.dateTime,
      device: row.device,
      cardNumber: row.cardNumber,
      cardType: row.cardType,
      subtotal: row.subtotal,
      tip: row.tip,
      totalAmount: row.totalAmount,
      refundAmount: row.refundAmount,
      providerCommission,
      providerCommissionRate: providerRate,
      witbizCommission,
      witbizCommissionRate: witbizRate,
      clientReturn,
    };
  });
}

// Calculate commission distribution based on RevenueDistribution config
export function calculateCommissionDistribution(
  totalWitbizCommission: number,
  revenueDistribution: RevenueDistribution
): TPVCommissionDistribution[] {
  const distribution: TPVCommissionDistribution[] = [];
  
  if (!revenueDistribution.witbizDistribution || revenueDistribution.witbizDistribution.length === 0) {
    // If no distribution configured, all goes to WitBiz
    distribution.push({
      recipientId: 'witbiz',
      recipientName: 'WitBiz',
      recipientType: 'witbiz',
      percentage: 100,
      amount: totalWitbizCommission,
    });
    return distribution;
  }
  
  for (const recipient of revenueDistribution.witbizDistribution) {
    const amount = Math.round((totalWitbizCommission * recipient.percentage / 100) * 100) / 100;
    distribution.push({
      recipientId: recipient.entityId || recipient.id,
      recipientName: recipient.name,
      recipientType: recipient.type === 'team_member' ? 'team_member' : 
                     recipient.type === 'promoter' ? 'promoter' : 'witbiz',
      percentage: recipient.percentage,
      amount,
    });
  }
  
  return distribution;
}

// Generate summary from transactions
export function generateSummary(
  transactions: TPVTransaction[],
  revenueDistribution: RevenueDistribution,
  promoters?: PromoterInfo[]
): TPVReportSummary {
  const totalTransactions = transactions.length;
  const totalSales = transactions.reduce((sum, t) => sum + t.subtotal, 0);
  const totalTips = transactions.reduce((sum, t) => sum + t.tip, 0);
  const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalProviderCommission = transactions.reduce((sum, t) => sum + t.providerCommission, 0);
  const totalWitbizCommission = transactions.reduce((sum, t) => sum + t.witbizCommission, 0);
  const totalClientReturn = transactions.reduce((sum, t) => sum + t.clientReturn, 0);
  
  // By card type
  const byCardType = {
    debito: { count: 0, amount: 0 },
    credito: { count: 0, amount: 0 },
    internacional: { count: 0, amount: 0 },
  };
  
  for (const t of transactions) {
    const key = t.cardType.toLowerCase() as 'debito' | 'credito' | 'internacional';
    if (byCardType[key]) {
      byCardType[key].count++;
      byCardType[key].amount += t.totalAmount;
    }
  }
  
  // By day (applying 11 PM rule: transactions after 11 PM count for next day)
  const byDayMap = new Map<string, { sales: number; clientReturn: number }>();
  for (const t of transactions) {
    // Extract date and time from dateTime
    let dateKey = '';
    let hour = 0;
    
    if (t.dateTime.includes('/')) {
      // Format: DD/MM/YYYY HH:MM
      const [datePart, timePart] = t.dateTime.split(' ');
      const parts = datePart.split('/');
      if (parts.length === 3) {
        let day = parseInt(parts[0]);
        let month = parseInt(parts[1]);
        let year = parseInt(parts[2]);
        
        if (timePart) {
          hour = parseInt(timePart.split(':')[0]) || 0;
        }
        
        // If after 11 PM, move to next day
        if (hour >= 23) {
          const nextDay = new Date(year, month - 1, day + 1);
          day = nextDay.getDate();
          month = nextDay.getMonth() + 1;
          year = nextDay.getFullYear();
        }
        
        dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      }
    } else if (t.dateTime.includes('-')) {
      // Format: YYYY-MM-DD HH:MM:SS
      const [datePart, timePart] = t.dateTime.split(' ');
      const parts = datePart.split('-');
      let year = parseInt(parts[0]);
      let month = parseInt(parts[1]);
      let day = parseInt(parts[2]);
      
      if (timePart) {
        hour = parseInt(timePart.split(':')[0]) || 0;
      }
      
      // If after 11 PM, move to next day
      if (hour >= 23) {
        const nextDay = new Date(year, month - 1, day + 1);
        day = nextDay.getDate();
        month = nextDay.getMonth() + 1;
        year = nextDay.getFullYear();
      }
      
      dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
    
    if (dateKey) {
      const existing = byDayMap.get(dateKey) || { sales: 0, clientReturn: 0 };
      existing.sales += t.totalAmount;
      existing.clientReturn += t.clientReturn;
      byDayMap.set(dateKey, existing);
    }
  }
  
  // Get all dates from first to last, including days without transactions
  const sortedDates = Array.from(byDayMap.keys()).sort();
  const byDay: { date: string; sales: number; clientReturn: number }[] = [];
  
  if (sortedDates.length > 0) {
    const startDate = new Date(sortedDates[0] + 'T12:00:00');
    const endDate = new Date(sortedDates[sortedDates.length - 1] + 'T12:00:00');
    
    // Iterate through all dates in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const dayData = byDayMap.get(dateKey);
      
      byDay.push({
        date: dateKey,
        sales: dayData?.sales || 0,
        clientReturn: dayData?.clientReturn || 0,
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  // Commission distribution - start with revenue distribution config
  const commissionDistribution = calculateCommissionDistribution(
    totalWitbizCommission,
    revenueDistribution
  );
  
  // Add promoter commissions (from WitBiz's share)
  if (promoters && promoters.length > 0) {
    let totalPromoterPercentage = 0;
    for (const promoter of promoters) {
      const promoterAmount = Math.round((totalWitbizCommission * promoter.percentage / 100) * 100) / 100;
      totalPromoterPercentage += promoter.percentage;
      commissionDistribution.push({
        recipientId: promoter.promoterId,
        recipientName: promoter.promoterName,
        recipientType: 'promoter',
        percentage: promoter.percentage,
        amount: promoterAmount,
      });
    }
    
    // Adjust WitBiz's share to reflect promoter deductions
    const witbizEntry = commissionDistribution.find(d => d.recipientType === 'witbiz');
    if (witbizEntry) {
      witbizEntry.percentage = Math.max(0, witbizEntry.percentage - totalPromoterPercentage);
      witbizEntry.amount = Math.round((totalWitbizCommission * witbizEntry.percentage / 100) * 100) / 100;
    }
  }
  
  return {
    totalTransactions,
    totalSales: Math.round(totalSales * 100) / 100,
    totalTips: Math.round(totalTips * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalProviderCommission: Math.round(totalProviderCommission * 100) / 100,
    totalWitbizCommission: Math.round(totalWitbizCommission * 100) / 100,
    totalClientReturn: Math.round(totalClientReturn * 100) / 100,
    commissionDistribution,
    byCardType,
    byDay,
  };
}

// Get period dates from transactions
export function getPeriodDates(transactions: TPVTransaction[]): { start: string; end: string } {
  if (transactions.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    return { start: today, end: today };
  }
  
  const dates: Date[] = [];
  
  for (const t of transactions) {
    let date: Date | null = null;
    
    if (t.dateTime.includes('/')) {
      // Format: DD/MM/YYYY HH:MM
      const parts = t.dateTime.split(' ')[0].split('/');
      if (parts.length === 3) {
        date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    } else if (t.dateTime.includes('-')) {
      // Format: YYYY-MM-DD HH:MM:SS
      date = new Date(t.dateTime.split(' ')[0]);
    }
    
    if (date && !isNaN(date.getTime())) {
      dates.push(date);
    }
  }
  
  if (dates.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    return { start: today, end: today };
  }
  
  const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
  
  return {
    start: sortedDates[0].toISOString().split('T')[0],
    end: sortedDates[sortedDates.length - 1].toISOString().split('T')[0],
  };
}

// Main processing function - takes CSV and config, returns complete TPVReport
export function processTPVReport(
  csvContent: string,
  config: ProcessingConfig,
  originalFileName: string,
  originalFileURL: string,
  processedBy: string
): Omit<TPVReport, 'id' | 'createdAt' | 'processedAt'> {
  // Parse CSV
  const parsedRows = parseBillpocketCSV(csvContent);
  
  if (parsedRows.length === 0) {
    throw new Error('No se encontraron transacciones válidas en el archivo');
  }
  
  // Process transactions with commission calculations
  const transactions = processTransactions(parsedRows, config);
  
  // Generate summary (including promoter commissions)
  const summary = generateSummary(transactions, config.revenueDistribution, config.promoters);
  
  // Get period dates
  const { start, end } = getPeriodDates(transactions);
  
  // Get the effective TPV config
  const tpvConfig = config.tpvConfig || TPV_CONFIG_DEFAULTS['formato2'];
  
  return {
    clientId: config.clientId,
    clientName: config.clientName,
    serviceId: config.serviceId,
    serviceName: config.serviceName,
    supplierId: config.supplierId,
    supplierName: config.supplierName,
    periodStart: start,
    periodEnd: end,
    transactions,
    summary,
    originalFileURL,
    originalFileName,
    status: 'Procesado',
    processedBy,
    // Store the format used for this report
    reportFormat: tpvConfig.reportFormat,
    tpvConfig: tpvConfig,
  };
}

// Generate CSV content for the processed report (for download)
export function generateProcessedCSV(report: TPVReport): string {
  const headers = [
    'FECHA/HORA',
    'DISPOSITIVO', 
    'TARJETA',
    'TIPO',
    'SUBTOTAL',
    'PROPINA',
    'MONTO TOTAL',
    '% COMISION WITBIZ',
    'COMISION WITBIZ',
    'RETORNO CLIENTE'
  ];
  
  const rows = report.transactions.map(t => [
    t.dateTime,
    t.device,
    t.cardNumber,
    t.cardType,
    t.subtotal.toFixed(2),
    t.tip.toFixed(2),
    t.totalAmount.toFixed(2),
    `${t.witbizCommissionRate}%`,
    t.witbizCommission.toFixed(2),
    t.clientReturn.toFixed(2),
  ]);
  
  // Add totals row
  rows.push([
    'TOTAL',
    '',
    '',
    '',
    report.summary.totalSales.toFixed(2),
    report.summary.totalTips.toFixed(2),
    report.summary.totalAmount.toFixed(2),
    '',
    report.summary.totalWitbizCommission.toFixed(2),
    report.summary.totalClientReturn.toFixed(2),
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');
  
  return csvContent;
}

// Format currency for display
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

// Format date for display
export function formatReportDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Get Monday of the week for a given date
function getWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(d.setDate(diff));
}

// Parse date from transaction dateTime string
// Rule: Transactions after 11 PM (23:00) count for the next day
function parseTransactionDate(dateTime: string): Date | null {
  let date: Date | null = null;
  let hour = 0;
  
  if (dateTime.includes('/')) {
    // Format: DD/MM/YYYY HH:MM
    const [datePart, timePart] = dateTime.split(' ');
    const parts = datePart.split('/');
    if (parts.length === 3) {
      date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      if (timePart) {
        const timeParts = timePart.split(':');
        hour = parseInt(timeParts[0]) || 0;
      }
    }
  } else if (dateTime.includes('-')) {
    // Format: YYYY-MM-DD HH:MM:SS
    const [datePart, timePart] = dateTime.split(' ');
    date = new Date(datePart + 'T12:00:00');
    if (timePart) {
      const timeParts = timePart.split(':');
      hour = parseInt(timeParts[0]) || 0;
    }
  }
  
  // If transaction is after 11 PM (23:00), count it for the next day
  if (date && hour >= 23) {
    date.setDate(date.getDate() + 1);
  }
  
  return date;
}

// Weekly report structure
export interface WeeklyTPVReport {
  weekLabel: string; // e.g., "22-28 dic"
  weekStart: Date;
  weekEnd: Date;
  transactions: TPVTransaction[];
  summary: TPVReportSummary;
}

// Group transactions by week (Monday-Sunday)
export function groupTransactionsByWeek(
  transactions: TPVTransaction[],
  revenueDistribution: RevenueDistribution
): WeeklyTPVReport[] {
  const weekMap = new Map<string, TPVTransaction[]>();
  
  for (const tx of transactions) {
    const date = parseTransactionDate(tx.dateTime);
    if (!date) continue;
    
    const monday = getWeekMonday(date);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    // Create week key: "DD-DD mes"
    const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const weekKey = `${monday.getDate().toString().padStart(2, '0')}-${sunday.getDate().toString().padStart(2, '0')} ${monthNames[sunday.getMonth()]}`;
    
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }
    weekMap.get(weekKey)!.push(tx);
  }
  
  // Convert to array and sort by date
  const weeks: WeeklyTPVReport[] = [];
  
  for (const [weekLabel, txs] of weekMap.entries()) {
    // Sort transactions within week by date
    txs.sort((a, b) => {
      const dateA = parseTransactionDate(a.dateTime);
      const dateB = parseTransactionDate(b.dateTime);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime(); // Most recent first
    });
    
    // Get week dates
    const firstTxDate = parseTransactionDate(txs[0].dateTime);
    if (!firstTxDate) continue;
    
    const weekStart = getWeekMonday(firstTxDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // Generate summary for this week
    const summary = generateSummary(txs, revenueDistribution);
    
    weeks.push({
      weekLabel,
      weekStart,
      weekEnd,
      transactions: txs,
      summary,
    });
  }
  
  // Sort weeks by start date (oldest first - left to right chronological)
  weeks.sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
  
  return weeks;
}
