"use client";

import React, { useRef, useMemo, useState } from 'react';
import { type TPVReport, type TPVReportSummary, type TPVTransaction, type TPVReportFormat } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileSpreadsheet, Printer, Calendar } from 'lucide-react';
import { formatCurrency, groupTransactionsByWeek, type WeeklyTPVReport } from '@/lib/tpvProcessor';

interface TPVWitBizDocumentProps {
  report: TPVReport;
}

// Component for a single week's content
function WeekContent({ 
  weekLabel, 
  transactions, 
  summary, 
  clientName,
  commissionRate,
  reportFormat = 'formato2'
}: { 
  weekLabel: string;
  transactions: TPVTransaction[];
  summary: TPVReportSummary;
  clientName: string;
  commissionRate: number;
  reportFormat?: TPVReportFormat;
}) {
  const isFormato1 = reportFormat === 'formato1';
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-t-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{clientName}</h2>
            <p className="text-blue-200 text-sm">Semana: {weekLabel}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{formatCurrency(summary.totalAmount)}</p>
            <p className="text-blue-200 text-sm">{transactions.length} transacciones</p>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="p-4">
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-900 hover:bg-blue-900">
                <TableHead className="text-white font-semibold text-xs">FECHA/HORA</TableHead>
                <TableHead className="text-white font-semibold text-xs">DISPOSITIVO</TableHead>
                <TableHead className="text-white font-semibold text-xs">TARJETA</TableHead>
                <TableHead className="text-white font-semibold text-xs">TIPO</TableHead>
                <TableHead className="text-white font-semibold text-xs text-right">MONTO TOTAL</TableHead>
                {isFormato1 && (
                  <>
                    <TableHead className="text-white font-semibold text-xs text-center">% TERM</TableHead>
                    <TableHead className="text-white font-semibold text-xs text-right">COSTO TERM</TableHead>
                  </>
                )}
                <TableHead className="text-white font-semibold text-xs text-center">% {isFormato1 ? 'WITBIZ' : 'COM'}</TableHead>
                <TableHead className="text-white font-semibold text-xs text-right">IMPORTE</TableHead>
                <TableHead className="text-white font-semibold text-xs text-right">VENTA - COM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx, idx) => (
                <TableRow key={tx.id} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                  <TableCell className="text-xs py-2">{tx.dateTime}</TableCell>
                  <TableCell className="text-xs py-2">{tx.device}</TableCell>
                  <TableCell className="text-xs py-2 font-mono">{tx.cardNumber}</TableCell>
                  <TableCell className="text-xs py-2">
                    <Badge variant={tx.cardType === 'Debito' ? 'default' : tx.cardType === 'Credito' ? 'secondary' : 'outline'} className="text-xs">
                      {tx.cardType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs py-2 text-right font-medium">{formatCurrency(tx.totalAmount)}</TableCell>
                  {isFormato1 && (
                    <>
                      <TableCell className="text-xs py-2 text-center text-sky-600">{tx.providerCommissionRate.toFixed(1)}%</TableCell>
                      <TableCell className="text-xs py-2 text-right text-sky-600">{formatCurrency(tx.providerCommission)}</TableCell>
                    </>
                  )}
                  <TableCell className="text-xs py-2 text-center text-emerald-600">{tx.witbizCommissionRate}%</TableCell>
                  <TableCell className="text-xs py-2 text-right text-emerald-600 font-medium">{formatCurrency(tx.witbizCommission)}</TableCell>
                  <TableCell className="text-xs py-2 text-right text-purple-600 font-medium">{formatCurrency(tx.clientReturn)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-blue-900 hover:bg-blue-900 font-bold">
                <TableCell className="text-white text-xs" colSpan={4}>TOTALES ({transactions.length} txs)</TableCell>
                <TableCell className="text-white text-xs text-right">{formatCurrency(summary.totalAmount)}</TableCell>
                {isFormato1 && (
                  <>
                    <TableCell className="text-white text-xs text-center">-</TableCell>
                    <TableCell className="text-white text-xs text-right">{formatCurrency(summary.totalProviderCommission)}</TableCell>
                  </>
                )}
                <TableCell className="text-white text-xs text-center">{commissionRate}%</TableCell>
                <TableCell className="text-white text-xs text-right">{formatCurrency(summary.totalWitbizCommission)}</TableCell>
                <TableCell className="text-white text-xs text-right">{formatCurrency(summary.totalClientReturn)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Daily Breakdown */}
      {summary.byDay && summary.byDay.length > 0 && (
        <div className="p-4 border-t">
          <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Reporte por Día
          </h3>
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-emerald-700 hover:bg-emerald-700">
                  <TableHead className="text-white font-semibold text-sm">FECHA</TableHead>
                  <TableHead className="text-white font-semibold text-sm text-right">VENTAS TPV</TableHead>
                  <TableHead className="text-white font-semibold text-sm text-right">RETORNO CLIENTE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.byDay.map((day, idx) => {
                  const dateObj = new Date(day.date + 'T12:00:00');
                  const formattedDate = dateObj.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                  const hasOperations = day.sales > 0;
                  return (
                    <TableRow 
                      key={day.date} 
                      className={`${idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'} ${!hasOperations ? 'opacity-50' : ''}`}
                    >
                      <TableCell className="text-sm py-2 capitalize">
                        {formattedDate}
                        {!hasOperations && <span className="ml-2 text-xs text-muted-foreground italic">(Sin operaciones)</span>}
                      </TableCell>
                      <TableCell className={`text-sm py-2 text-right font-medium ${!hasOperations ? 'text-muted-foreground' : ''}`}>
                        {hasOperations ? formatCurrency(day.sales) : '-'}
                      </TableCell>
                      <TableCell className={`text-sm py-2 text-right font-medium ${hasOperations ? 'text-purple-600' : 'text-muted-foreground'}`}>
                        {hasOperations ? formatCurrency(day.clientReturn) : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-emerald-700 hover:bg-emerald-700 font-bold">
                  <TableCell className="text-white text-sm">TOTAL</TableCell>
                  <TableCell className="text-white text-sm text-right">{formatCurrency(summary.totalAmount)}</TableCell>
                  <TableCell className="text-white text-sm text-right">{formatCurrency(summary.totalClientReturn)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

export function TPVWitBizDocument({ report }: TPVWitBizDocumentProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { summary, transactions, reportFormat = 'formato2' } = report;
  const commissionRate = transactions[0]?.witbizCommissionRate || 10;
  const isFormato1 = reportFormat === 'formato1';
  
  // Group transactions by week
  const weeklyReports = useMemo(() => {
    return groupTransactionsByWeek(transactions, { 
      supplierPercentage: 0, 
      witbizPercentage: 100, 
      witbizDistribution: [] 
    });
  }, [transactions]);
  
  const [activeWeek, setActiveWeek] = useState(weeklyReports[0]?.weekLabel || '');

  // Generate Excel file
  const handleDownloadExcel = () => {
    // Create CSV content that Excel can open
    const headers = [
      'FECHA/HORA',
      'DISPOSITIVO', 
      'TARJETA',
      'TIPO',
      'SUBTOTAL',
      'PROPINA',
      'MONTO TOTAL',
      '% COMISION',
      'IMPORTE COMISION',
      'VENTA - COMISIONES'
    ];

    const rows = transactions.map(tx => [
      tx.dateTime,
      tx.device,
      tx.cardNumber,
      tx.cardType,
      tx.subtotal.toFixed(2),
      tx.tip.toFixed(2),
      tx.totalAmount.toFixed(2),
      `${commissionRate}%`,
      tx.witbizCommission.toFixed(2),
      tx.clientReturn.toFixed(2)
    ]);

    // Add summary rows
    rows.push([]);
    rows.push(['', '', '', '', '', '', '', '', '', '']);
    rows.push(['RESUMEN', '', '', '', '', '', '', '', '', '']);
    rows.push(['Total Transacciones:', summary.totalTransactions.toString(), '', '', '', '', '', '', '', '']);
    rows.push(['Total Ventas:', '', '', '', '', '', formatCurrency(summary.totalSales), '', '', '']);
    rows.push(['Total Propinas:', '', '', '', '', '', formatCurrency(summary.totalTips), '', '', '']);
    rows.push(['Total Monto:', '', '', '', '', '', formatCurrency(summary.totalAmount), '', '', '']);
    rows.push(['', '', '', '', '', '', '', '', '', '']);
    rows.push(['COMISIONES', '', '', '', '', '', '', '', '', '']);
    rows.push(['Comision Proveedor (Billpocket):', '', '', '', '', '', formatCurrency(summary.totalProviderCommission), `${((summary.totalProviderCommission / summary.totalAmount) * 100).toFixed(2)}%`, '', '']);
    rows.push([`Comision WitBiz (${commissionRate}%):`, '', '', '', '', '', formatCurrency(summary.totalWitbizCommission), '', '', '']);
    
    // Add commission distribution (including promoters)
    if (summary.commissionDistribution && summary.commissionDistribution.length > 0) {
      rows.push(['', '', '', '', '', '', '', '', '', '']);
      rows.push(['DISTRIBUCION DE COMISION WITBIZ', '', '', '', '', '', '', '', '', '']);
      for (const dist of summary.commissionDistribution) {
        const typeLabel = dist.recipientType === 'promoter' ? '(Promotor)' : 
                          dist.recipientType === 'witbiz' ? '(WitBiz Neto)' : '';
        rows.push([`${dist.recipientName} ${typeLabel}:`, '', '', '', '', '', formatCurrency(dist.amount), `${dist.percentage}%`, '', '']);
      }
    }
    
    rows.push(['Ganancia Neta WitBiz:', '', '', '', '', '', formatCurrency(summary.totalWitbizCommission - summary.totalProviderCommission), '', '', '']);
    rows.push(['', '', '', '', '', '', '', '', '', '']);
    rows.push(['DEVOLUCION AL CLIENTE', '', '', '', '', '', '', '', '', '']);
    rows.push(['Total a Entregar:', '', '', '', '', '', formatCurrency(summary.totalClientReturn), '', '', '']);
    
    // Add daily breakdown
    rows.push(['', '', '', '', '', '', '', '', '', '']);
    rows.push(['', '', '', '', '', '', '', '', '', '']);
    rows.push(['REPORTE POR DIA', '', '', '', '', '', '', '', '', '']);
    rows.push(['FECHA', 'VENTAS TPV', 'RETORNO CLIENTE', '', '', '', '', '', '', '']);
    
    if (summary.byDay && summary.byDay.length > 0) {
      for (const day of summary.byDay) {
        const dateObj = new Date(day.date + 'T12:00:00');
        const formattedDate = dateObj.toLocaleDateString('es-MX', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        rows.push([formattedDate, formatCurrency(day.sales), formatCurrency(day.clientReturn), '', '', '', '', '', '', '']);
      }
      rows.push(['TOTAL', formatCurrency(summary.totalAmount), formatCurrency(summary.totalClientReturn), '', '', '', '', '', '', '']);
    }

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Add BOM for Excel to recognize UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WitBiz_${report.clientName}_${report.periodStart}_${report.periodEnd}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Print function
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte WitBiz - ${report.clientName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #1e3a5f; color: white; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .summary-row { background-color: #f5f5f5; }
            .total-row { background-color: #1e3a5f; color: white; font-weight: bold; }
            h1 { color: #1e3a5f; }
            h2 { color: #333; margin-top: 20px; }
            .header-info { margin-bottom: 20px; }
            .commission-box { display: inline-block; padding: 10px 20px; margin: 5px; border-radius: 5px; }
            .provider { background-color: #fee2e2; }
            .witbiz { background-color: #e0e7ff; }
            .client { background-color: #d1fae5; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2 justify-end print:hidden">
        <Button variant="outline" size="sm" onClick={handleDownloadExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Descargar Excel
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
      </div>

      {/* Main Header */}
      <div ref={printRef} className="space-y-4">
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">REPORTE DE COMISIONES TPV</h1>
              <p className="text-blue-200 text-sm">Documento generado por WitBiz</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{report.clientName}</p>
              <p className="text-blue-200 text-sm">Período: {report.periodStart} - {report.periodEnd}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards - Total Period */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border shadow-sm">
            <p className="text-xs text-muted-foreground">Total Período</p>
            <p className="text-xl font-bold">{formatCurrency(summary.totalAmount)}</p>
            <p className="text-xs text-muted-foreground">{transactions.length} transacciones</p>
          </div>
          <div className="bg-sky-50 dark:bg-sky-950 p-3 rounded-lg border border-sky-200 dark:border-sky-800 shadow-sm">
            <p className="text-xs text-sky-600">Comisión Billpocket</p>
            <p className="text-xl font-bold text-sky-700">{formatCurrency(summary.totalProviderCommission)}</p>
            <p className="text-xs text-muted-foreground">{((summary.totalProviderCommission / summary.totalAmount) * 100).toFixed(2)}%</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-sm">
            <p className="text-xs text-emerald-600">Comisión WitBiz ({commissionRate}%)</p>
            <p className="text-xl font-bold text-emerald-700">{formatCurrency(summary.totalWitbizCommission)}</p>
            <p className="text-xs text-emerald-500">Ganancia: {formatCurrency(summary.totalWitbizCommission - summary.totalProviderCommission)}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg border border-purple-200 dark:border-purple-800 shadow-sm">
            <p className="text-xs text-purple-600">Devolución Cliente</p>
            <p className="text-xl font-bold text-purple-700">{formatCurrency(summary.totalClientReturn)}</p>
          </div>
        </div>

        {/* Commission Distribution - Show if there are promoters */}
        {summary.commissionDistribution && summary.commissionDistribution.length > 1 && (
          <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">Distribución de Comisión WitBiz</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {summary.commissionDistribution.map((dist) => (
                <div key={dist.recipientId} className={`p-2 rounded border ${
                  dist.recipientType === 'promoter' 
                    ? 'bg-orange-100 dark:bg-orange-900 border-orange-300' 
                    : 'bg-white dark:bg-gray-900 border-gray-200'
                }`}>
                  <p className="text-xs text-muted-foreground">
                    {dist.recipientType === 'promoter' ? '👤 Promotor' : '🏢 WitBiz'}
                  </p>
                  <p className="text-sm font-medium">{dist.recipientName}</p>
                  <p className="text-lg font-bold">{formatCurrency(dist.amount)}</p>
                  <p className="text-xs text-muted-foreground">{dist.percentage}% de comisión</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Tabs */}
        {weeklyReports.length > 0 && (
          <Tabs value={activeWeek} onValueChange={setActiveWeek} className="w-full">
            <TabsList className="w-full flex-wrap h-auto gap-1 bg-gray-100 dark:bg-gray-800 p-1">
              {weeklyReports.map((week) => (
                <TabsTrigger 
                  key={week.weekLabel} 
                  value={week.weekLabel}
                  className="text-xs px-3 py-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  {week.weekLabel}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {weeklyReports.map((week) => (
              <TabsContent key={week.weekLabel} value={week.weekLabel} className="mt-4">
                <WeekContent
                  weekLabel={week.weekLabel}
                  transactions={week.transactions}
                  summary={week.summary}
                  clientName={report.clientName}
                  commissionRate={commissionRate}
                  reportFormat={reportFormat}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Formula Explanation */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
          <h3 className="font-semibold mb-3">Fórmulas Aplicadas ({isFormato1 ? 'Formato 1' : 'Formato 2'})</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {isFormato1 && (
              <div className="bg-white dark:bg-gray-900 p-3 rounded border">
                <p className="font-medium text-sky-600">Costo Terminal (Billpocket):</p>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  Comisión real cobrada por Billpocket
                </code>
              </div>
            )}
            <div className="bg-white dark:bg-gray-900 p-3 rounded border">
              <p className="font-medium text-emerald-600">Importe Comisión WitBiz:</p>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                MONTO TOTAL × {commissionRate}%
              </code>
            </div>
            <div className="bg-white dark:bg-gray-900 p-3 rounded border">
              <p className="font-medium text-purple-600">Retorno Cliente:</p>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {isFormato1 
                  ? 'MONTO - BILLPOCKET - WITBIZ' 
                  : 'MONTO - COMISIÓN WITBIZ'}
              </code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Documento generado automáticamente por WitBiz • {new Date().toLocaleDateString('es-MX')}</p>
          <p>Servicio: {report.serviceName} • Proveedor: {report.supplierName || 'Billpocket'}</p>
        </div>
      </div>
    </div>
  );
}
