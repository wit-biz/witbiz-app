"use client";

import React, { useState } from 'react';
import { type TPVReport, type TPVTransaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  Trash2,
  Building2,
  Percent,
  FileSpreadsheet,
  LayoutDashboard
} from 'lucide-react';
import { formatCurrency, formatReportDate, generateProcessedCSV } from '@/lib/tpvProcessor';
import { cn } from '@/lib/utils';
import { TPVWitBizDocument } from './TPVWitBizDocument';

interface TPVReportViewProps {
  report: TPVReport;
  onDelete?: (reportId: string) => void;
  compact?: boolean;
}

export function TPVReportView({ report, onDelete, compact = false }: TPVReportViewProps) {
  const [showTransactions, setShowTransactions] = useState(false);
  const { summary } = report;

  const handleDownloadOriginal = () => {
    if (report.originalFileURL) {
      window.open(report.originalFileURL, '_blank');
    }
  };

  const handleDownloadProcessed = () => {
    const csvContent = generateProcessedCSV(report);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_${report.clientName}_${report.periodStart}_${report.periodEnd}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (compact) {
    return (
      <div className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer"
           onClick={() => setShowTransactions(!showTransactions)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{report.periodStart} - {report.periodEnd}</p>
              <p className="text-sm text-muted-foreground">
                {summary.totalTransactions} transacciones
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{formatCurrency(summary.totalAmount)}</p>
            <p className="text-sm text-green-600">
              Comisión: {formatCurrency(summary.totalWitbizCommission)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Reporte TPV - {report.clientName}</h3>
          <p className="text-muted-foreground">
            Período: {formatReportDate(report.periodStart)} - {formatReportDate(report.periodEnd)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadOriginal}>
            <FileText className="h-4 w-4 mr-2" />
            Original (Billpocket)
          </Button>
          {onDelete && (
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(report.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs for Summary vs Document */}
      <Tabs defaultValue="document" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="document" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Documento WitBiz
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Resumen
          </TabsTrigger>
        </TabsList>

        {/* WitBiz Document Tab */}
        <TabsContent value="document" className="mt-4">
          <TPVWitBizDocument report={report} />
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="mt-4 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Transacciones</p>
                <p className="text-2xl font-bold">{summary.totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Venta Total</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Retorno Cliente</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalClientReturn)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Percent className="h-5 w-5" />
            Desglose de Comisiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">Comisión Proveedor (Billpocket)</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(summary.totalProviderCommission)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {((summary.totalProviderCommission / summary.totalAmount) * 100).toFixed(2)}% promedio
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Comisión WitBiz ({report.transactions[0]?.witbizCommissionRate || 7}%)</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(summary.totalWitbizCommission)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ganancia WitBiz: {formatCurrency(summary.totalWitbizCommission - summary.totalProviderCommission)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Distribution */}
      {summary.commissionDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Distribución de Comisiones
            </CardTitle>
            <CardDescription>
              Reparto del {formatCurrency(summary.totalWitbizCommission)} de comisión WitBiz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.commissionDistribution.map((dist, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      dist.recipientType === 'witbiz' && "bg-blue-100 text-blue-600",
                      dist.recipientType === 'team_member' && "bg-green-100 text-green-600",
                      dist.recipientType === 'promoter' && "bg-purple-100 text-purple-600"
                    )}>
                      {dist.recipientType === 'witbiz' && <Building2 className="h-4 w-4" />}
                      {dist.recipientType === 'team_member' && <Users className="h-4 w-4" />}
                      {dist.recipientType === 'promoter' && <TrendingUp className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium">{dist.recipientName}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        {dist.percentage}% del total
                      </p>
                    </div>
                  </div>
                  <p className="text-xl font-bold">{formatCurrency(dist.amount)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* By Card Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Desglose por Tipo de Tarjeta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Débito</p>
              <p className="text-xl font-bold">{summary.byCardType.debito.count}</p>
              <p className="text-sm text-blue-600">{formatCurrency(summary.byCardType.debito.amount)}</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Crédito</p>
              <p className="text-xl font-bold">{summary.byCardType.credito.count}</p>
              <p className="text-sm text-green-600">{formatCurrency(summary.byCardType.credito.amount)}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Internacional</p>
              <p className="text-xl font-bold">{summary.byCardType.internacional.count}</p>
              <p className="text-sm text-purple-600">{formatCurrency(summary.byCardType.internacional.amount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transacciones ({summary.totalTransactions})
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowTransactions(!showTransactions)}
            >
              {showTransactions ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Ocultar
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Mostrar
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {showTransactions && (
          <CardContent>
            <div className="rounded-md border overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">Comisión</TableHead>
                    <TableHead className="text-right">Retorno</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">{tx.dateTime}</TableCell>
                      <TableCell className="text-sm">{tx.device}</TableCell>
                      <TableCell>
                        <Badge variant={
                          tx.cardType === 'Debito' ? 'default' :
                          tx.cardType === 'Credito' ? 'secondary' : 'outline'
                        }>
                          {tx.cardType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(tx.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right text-purple-600">
                        {formatCurrency(tx.witbizCommission)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(tx.clientReturn)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// List view for multiple reports
interface TPVReportListProps {
  reports: TPVReport[];
  onSelectReport?: (report: TPVReport) => void;
  onDeleteReport?: (reportId: string) => void;
}

export function TPVReportList({ reports, onSelectReport, onDeleteReport }: TPVReportListProps) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay reportes TPV para este cliente</p>
        <p className="text-sm">Sube un archivo CSV de Billpocket para comenzar</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div 
          key={report.id}
          className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer"
          onClick={() => onSelectReport?.(report)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {report.periodStart} - {report.periodEnd}
                </p>
                <p className="text-sm text-muted-foreground">
                  {report.summary.totalTransactions} transacciones • {report.serviceName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold text-lg">{formatCurrency(report.summary.totalAmount)}</p>
                <p className="text-sm text-green-600">
                  Comisión: {formatCurrency(report.summary.totalWitbizCommission)}
                </p>
              </div>
              {onDeleteReport && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteReport(report.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
