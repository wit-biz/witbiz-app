
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Landmark, Briefcase, PlusCircle, ArrowRightLeft, DollarSign, BarChart as BarChartIcon, Settings, Edit, Trash2, KeyRound, Filter, ChevronsUpDown, Building, Loader2, Save, Calendar as CalendarIcon, ArrowUpCircle, ArrowDownCircle, TrendingUp, BookText, Users as UsersIcon, FilterX, Download, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddTransactionDialog } from "@/components/shared/AddTransactionDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isWithinInterval, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/header";
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCRMData } from "@/contexts/CRMDataContext";
import { Label } from "@/components/ui/label";
import { type Transaction, type Company, type Tax, type InterCompanyLoan, BankAccount } from '@/lib/types';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";


// --- Inter-Company Loan Components ---

const loanSchema = z.object({
  lenderCompanyId: z.string().min(1, "Debe seleccionar la empresa prestamista."),
  borrowerCompanyId: z.string().min(1, "Debe seleccionar la empresa prestataria."),
  amount: z.coerce.number().positive("El monto debe ser mayor a cero."),
  terms: z.string().optional(),
}).refine(data => data.lenderCompanyId !== data.borrowerCompanyId, {
    message: "La empresa prestamista y prestataria no pueden ser la misma.",
    path: ["borrowerCompanyId"],
});


function LoanForm({ companies, onAddLoan }: { companies: Company[], onAddLoan: (data: Omit<InterCompanyLoan, 'id' | 'date' | 'status'>) => Promise<void> }) {
    const form = useForm<z.infer<typeof loanSchema>>({
        resolver: zodResolver(loanSchema),
        defaultValues: { lenderCompanyId: '', borrowerCompanyId: '', amount: 0, terms: '' },
    });
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const onSubmit = async (data: z.infer<typeof loanSchema>) => {
        setIsSubmitting(true);
        await onAddLoan(data);
        form.reset();
        setIsSubmitting(false);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <div className="grid sm:grid-cols-2 gap-4">
                     <FormField control={form.control} name="lenderCompanyId" render={({ field }) => (
                      <FormItem>
                        <Label>Empresa que Presta</Label>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger></FormControl>
                          <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name="borrowerCompanyId" render={({ field }) => (
                      <FormItem>
                        <Label>Empresa que Recibe</Label>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger></FormControl>
                          <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <Label>Monto del Préstamo</Label>
                    <FormControl><Input type="number" {...field} disabled={isSubmitting}/></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="terms" render={({ field }) => (
                  <FormItem>
                    <Label>Términos y Acuerdo de Pago (Opcional)</Label>
                    <FormControl><Textarea {...field} placeholder="Describa cómo y cuándo se pagará el préstamo..." disabled={isSubmitting}/></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                    Registrar Préstamo
                </Button>
            </form>
        </Form>
    );
}



export default function SettingsPage() {
  const { toast } = useToast();
  const { 
      clients, 
      companies, bankAccounts, categories, transactions, loans, 
      isLoadingCompanies, isLoadingBankAccounts, isLoadingCategories, isLoadingTransactions, isLoadingLoans,
      addTransaction, addLoan
  } = useCRMData();
  
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(subDays(new Date(), 30)),
    to: new Date()
  });
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  
  const [auxiliaryType, setAuxiliaryType] = useState('clients');
  const [selectedAuxiliaryId, setSelectedAuxiliaryId] = useState('all');

  const handleDownloadReport = (reportName: string) => {
    toast({
      title: "Descarga Simulada",
      description: `Se ha iniciado la descarga de "${reportName}".`
    })
  }

  const allCategories = useMemo(() => categories.map(c => ({...c, groupName: c.type})), [categories]);

  const filteredTransactions = useMemo(() => {
    if (isLoadingTransactions) return [];
    return transactions.filter(item => {
        const itemDate = new Date(item.date);
        const isDateInRange = date?.from && date.to ? isWithinInterval(itemDate, { start: startOfDay(date.from), end: endOfDay(date.to) }) : true;
        const isCompanyMatch = selectedCompanyId === 'all' || item.companyId === selectedCompanyId;
        
        const categoryObject = allCategories.find(c => c.id === item.categoryId);
        const isCategoryMatch = selectedCategoryId === 'all' || (categoryObject && categoryObject.id === selectedCategoryId);
        
        let typeMatch = false;
        if (selectedType === 'all') {
            typeMatch = true;
        } else if (selectedType === 'income') {
            typeMatch = item.type === 'income';
        } else if (selectedType === 'expense') {
            typeMatch = item.type === 'expense';
        } else if (selectedType === 'transfer') {
            typeMatch = item.type.startsWith('transfer');
        }
        
        return isDateInRange && isCompanyMatch && isCategoryMatch && typeMatch;
    });
  }, [date, selectedCompanyId, selectedCategoryId, selectedType, allCategories, transactions, isLoadingTransactions]);
  
  const generalLedgerData = useMemo(() => {
    if (selectedAuxiliaryId === 'all') return [];
    
    if (auxiliaryType === 'clients') {
        return filteredTransactions.filter(t => t.clientId === selectedAuxiliaryId);
    }
    
    if (auxiliaryType === 'banks') {
        return filteredTransactions.filter(t => t.accountId === selectedAuxiliaryId);
    }

    return [];
  }, [auxiliaryType, selectedAuxiliaryId, filteredTransactions]);

  const trialBalanceData = useMemo(() => {
    const balances = allCategories.reduce((acc, category) => {
        if(category.type === 'Transferencia') return acc; // Ignore internal transfers for trial balance
        const total = filteredTransactions
            .filter(t => t.categoryId === category.id)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        if (total > 0) {
            acc[category.name] = {
                debit: category.type === 'Egreso' ? total : 0,
                credit: category.type === 'Ingreso' ? total : 0,
            };
        }
        return acc;
    }, {} as Record<string, {debit: number, credit: number}>);

    return Object.entries(balances).map(([account, {debit, credit}]) => ({ account, debit, credit }));
  }, [allCategories, filteredTransactions]);

  const totalTrialBalance = useMemo(() => {
      return trialBalanceData.reduce((acc, row) => {
          acc.debit += row.debit;
          acc.credit += row.credit;
          return acc;
      }, {debit: 0, credit: 0});
  }, [trialBalanceData]);
  
  const generalSummary = useMemo(() => {
    const totalBalance = bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    return {
      totalBalance,
      companyCount: companies.length,
      accountCount: bankAccounts.length,
    }
  }, [bankAccounts, companies]);

  const incomeStatementData = useMemo(() => {
      const revenueByCategory = filteredTransactions
          .filter(t => t.type === 'income')
          .reduce((acc, t) => {
              const categoryName = categories.find(c => c.id === t.categoryId)?.name || 'Desconocido';
              acc[categoryName] = (acc[categoryName] || 0) + t.amount;
              return acc;
          }, {} as Record<string, number>);
      
      const totalRevenue = Object.values(revenueByCategory).reduce((sum, amount) => sum + amount, 0);

      const expensesByCategory = filteredTransactions
          .filter(t => t.type === 'expense' && categories.find(c => c.id === t.categoryId)?.type !== 'Transferencia')
          .reduce((acc, t) => {
              const categoryName = categories.find(c => c.id === t.categoryId)?.name || 'Desconocido';
              acc[categoryName] = (acc[categoryName] || 0) + Math.abs(t.amount);
              return acc;
          }, {} as Record<string, number>);

      const totalExpenses = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);
      const grossProfit = totalRevenue; 
      const incomeBeforeTax = grossProfit - totalExpenses;

      const selectedCompany = companies.find(c => c.id === selectedCompanyId);
      let calculatedTaxes: { name: string; rate: number; amount: number }[] = [];
      let totalTaxes = 0;

      if (selectedCompany && selectedCompany.taxes && incomeBeforeTax > 0) {
          calculatedTaxes = selectedCompany.taxes.map(tax => {
              const taxAmount = incomeBeforeTax * (tax.rate / 100);
              return { name: tax.name, rate: tax.rate, amount: taxAmount };
          });
          totalTaxes = calculatedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
      }

      const netIncome = incomeBeforeTax - totalTaxes;

      return {
          revenueByCategory,
          totalRevenue,
          grossProfit,
          expensesByCategory,
          totalExpenses,
          incomeBeforeTax,
          calculatedTaxes,
          totalTaxes,
          netIncome,
          isTaxable: !!selectedCompany?.taxes?.length
      };
  }, [filteredTransactions, selectedCompanyId, companies, categories]);
  
   const periodSummary = useMemo(() => {
    return {
      totalIncome: incomeStatementData.totalRevenue,
      totalExpenses: incomeStatementData.totalExpenses,
    };
  }, [incomeStatementData]);

  const { balanceSheetData, cashFlowData } = useMemo(() => {
    const fromDate = date?.from ? startOfDay(date.from) : new Date(0);
    
    const priorTransactions = transactions.filter(t => new Date(t.date) < fromDate);
    const initialRetainedEarnings = priorTransactions
      .filter(t => t.type === 'income' || t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const initialCash = bankAccounts.reduce((sum, acc) => sum + (acc.initialBalance || 0), 0) + priorTransactions.reduce((sum, t) => sum + t.amount, 0);

    const cashFromOperations = filteredTransactions
        .filter(t => t.type === 'income' || t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const cashFromTransfers = filteredTransactions
        .filter(t => t.type.startsWith('transfer'))
        .reduce((sum,t) => sum + t.amount, 0);

    const netCashFlow = cashFromOperations + cashFromTransfers;
    const finalCash = initialCash + netCashFlow;
    
    const bsData = {
        assets: { cash: finalCash },
        liabilities: { accountsPayable: 0 }, // Placeholder
        equity: {
            retainedEarnings: initialRetainedEarnings,
            netIncome: incomeStatementData.netIncome,
        },
        get totalAssets() { return this.assets.cash; },
        get totalLiabilitiesAndEquity() { return this.liabilities.accountsPayable + this.equity.retainedEarnings + this.equity.netIncome; },
    };
    
    const cfData = {
        operating: cashFromOperations,
        investing: 0, // Placeholder
        financing: 0, // Placeholder for dividends, etc.
        netCashFlow: cashFromOperations,
        initialCash,
        finalCash
    };

    return { balanceSheetData: bsData, cashFlowData: cfData };
  }, [date, incomeStatementData.netIncome, bankAccounts, transactions, filteredTransactions]);

  const getCompanyName = (id: string) => companies.find(c => c.id === id)?.name || 'Desconocido';
  
  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen">
        <Header
          title="Contabilidad"
          description="Centro de operaciones financieras y análisis de rentabilidad."
        >
            <Button onClick={() => handleDownloadReport('Contabilidad General')}>
                <Download className="mr-2 h-4 w-4" />
                Descarga General
            </Button>
            <Button variant="outline" onClick={() => setIsTransactionDialogOpen(true)}>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Registrar Movimiento
            </Button>
            <Button asChild>
                <Link href="/accounting/config">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar Entidades
                </Link>
            </Button>
        </Header>
        <main className="flex-1 p-4 md:p-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Resumen General</CardTitle>
                    <CardDescription>
                        Balance consolidado actual e información clave del período seleccionado.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1 p-4 rounded-lg bg-secondary flex flex-col justify-center">
                            <h3 className="text-sm font-medium text-muted-foreground">Balance Total Consolidado (Actual)</h3>
                            <p className="text-3xl font-bold">{generalSummary.totalBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                        </div>
                        <div className="md:col-span-2 grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-200">
                                <h3 className="text-sm font-medium flex items-center gap-2"><ArrowUpCircle className="h-4 w-4"/> Ingresos del Período</h3>
                                <p className="text-2xl font-bold">{periodSummary.totalIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                            </div>
                             <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-200">
                                <h3 className="text-sm font-medium flex items-center gap-2"><ArrowDownCircle className="h-4 w-4"/> Egresos del Período</h3>
                                <p className="text-2xl font-bold">{periodSummary.totalExpenses.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Filtros Globales</CardTitle>
                    <CardDescription>Estos filtros se aplican a todos los libros y estados financieros.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-center gap-2">
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button id="date" variant={"outline"} className={cn("w-full sm:w-auto justify-start text-left font-normal", !date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (date.to ? (<>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</>) : (format(date.from, "LLL dd, y"))) : (<span>Calendario</span>)}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} locale={es} />
                        </PopoverContent>
                        </Popover>
                        <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                        <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Filtrar por empresa..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las Empresas</SelectItem>
                            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                        <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Filtrar por categoría..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las Categorías</SelectItem>
                            {allCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filtrar por tipo..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los Tipos</SelectItem>
                            <SelectItem value="income">Ingreso</SelectItem>
                            <SelectItem value="expense">Egreso</SelectItem>
                            <SelectItem value="transfer">Transferencia</SelectItem>
                        </SelectContent>
                        </Select>
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => { setDate(undefined); setSelectedCompanyId("all"); setSelectedCategoryId("all"); setSelectedType("all");}}>
                                    <FilterX className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Limpiar filtros</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="ledger">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="ledger"><BookText className="mr-2 h-4 w-4"/>Libros Contables</TabsTrigger>
                    <TabsTrigger value="pnl"><BarChartIcon className="mr-2 h-4 w-4"/>Estados Financieros</TabsTrigger>
                    <TabsTrigger value="loans"><Handshake className="mr-2 h-4 w-4"/>Préstamos entre Empresas</TabsTrigger>
                </TabsList>
                <TabsContent value="ledger" className="mt-4">
                     <Card>
                        <Tabs defaultValue="daily-journal" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 rounded-t-lg rounded-b-none">
                                <TabsTrigger value="daily-journal">Libro de Transacciones</TabsTrigger>
                                <TabsTrigger value="trial-balance">Balanza de Comprobación</TabsTrigger>
                                <TabsTrigger value="auxiliaries">Auxiliares Contables</TabsTrigger>
                            </TabsList>
                            <TabsContent value="daily-journal" className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <CardTitle>Libro de Transacciones</CardTitle>
                                        <CardDescription>Registro detallado de todas las operaciones financieras. Utilice los filtros globales para explorar.</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleDownloadReport('Libro de Transacciones')}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Descargar
                                    </Button>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead>Categoría</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead className="text-right">Monto</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingTransactions ? <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin"/></TableCell></TableRow> :
                                        filteredTransactions.length > 0 ? filteredTransactions.map((trx) => (
                                            <TableRow key={trx.id}>
                                                <TableCell>{format(new Date(trx.date), "dd/MM/yyyy")}</TableCell>
                                                <TableCell className="font-medium">{trx.description}</TableCell>
                                                <TableCell>{categories.find(c => c.id === trx.categoryId)?.name || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Badge variant={trx.type === 'income' ? 'default' : trx.type === 'expense' ? 'destructive' : 'secondary'}>
                                                        {trx.type === 'income' ? 'Ingreso' : trx.type.startsWith('transfer') ? 'Transferencia' : 'Egreso'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className={`text-right font-semibold ${trx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {trx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                          <TableRow><TableCell colSpan={5} className="text-center h-24">No hay transacciones que mostrar.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TabsContent>
                            <TabsContent value="trial-balance" className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <CardTitle>Balanza de Comprobación</CardTitle>
                                        <CardDescription>Verificación de la suma de saldos deudores y acreedores.</CardDescription>
                                    </div>
                                     <Button variant="outline" size="sm" onClick={() => handleDownloadReport('Balanza de Comprobación')}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Descargar
                                    </Button>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cuenta Contable</TableHead>
                                            <TableHead className="text-right">Debe (Cargos)</TableHead>
                                            <TableHead className="text-right">Haber (Abonos)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {trialBalanceData.length > 0 ? trialBalanceData.map(item => (
                                            <TableRow key={item.account}>
                                                <TableCell className="font-medium">{item.account}</TableCell>
                                                <TableCell className="text-right text-red-600">{item.debit > 0 ? item.debit.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '-'}</TableCell>
                                                <TableCell className="text-right text-green-600">{item.credit > 0 ? item.credit.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '-'}</TableCell>
                                            </TableRow>
                                        )) : (
                                          <TableRow><TableCell colSpan={3} className="text-center h-24">No hay datos para la balanza.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="font-bold bg-muted">
                                            <TableCell>Sumas Iguales</TableCell>
                                            <TableCell className="text-right">{totalTrialBalance.debit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                            <TableCell className="text-right">{totalTrialBalance.credit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </TabsContent>
                            <TabsContent value="auxiliaries" className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <CardTitle>Auxiliares Contables</CardTitle>
                                        <CardDescription>Detalle de movimientos a nivel de subcuentas (Bancos, Clientes, etc.).</CardDescription>
                                    </div>
                                     <Button variant="outline" size="sm" onClick={() => handleDownloadReport('Auxiliares Contables')}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Descargar
                                    </Button>
                                </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <Select value={auxiliaryType} onValueChange={(value) => { setAuxiliaryType(value); setSelectedAuxiliaryId('all'); }}>
                                            <SelectTrigger className="w-[200px]"><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="banks">Auxiliar de Bancos</SelectItem>
                                                <SelectItem value="clients">Auxiliar de Clientes</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={selectedAuxiliaryId} onValueChange={setSelectedAuxiliaryId}>
                                            <SelectTrigger className="w-[300px]">
                                                <SelectValue placeholder={`Seleccione un ${auxiliaryType === 'clients' ? 'cliente' : 'banco'}...`}/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {auxiliaryType === 'clients' ? 
                                                    (clients && clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)) : 
                                                    (bankAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.bankName} - {companies.find(c=>c.id === a.companyId)?.name}</SelectItem>))
                                                }
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>Descripción</TableHead>
                                                <TableHead className="text-right">Monto</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {generalLedgerData.length > 0 ? generalLedgerData.map(trx => (
                                                <TableRow key={trx.id}>
                                                    <TableCell>{format(new Date(trx.date), "dd/MM/yyyy")}</TableCell>
                                                    <TableCell className="font-medium">{trx.description}</TableCell>
                                                    <TableCell className={`text-right font-semibold ${trx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {trx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow><TableCell colSpan={3} className="text-center h-24">Seleccione una opción para ver su detalle.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                        <TableFooter>
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-right font-bold">Saldo Total del Auxiliar:</TableCell>
                                                <TableCell className="text-right font-bold">{generalLedgerData.reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    </Table>
                            </TabsContent>
                        </Tabs>
                    </Card>
                </TabsContent>
                 <TabsContent value="pnl" className="mt-4">
                    <Card>
                        <Tabs defaultValue="income-statement" className="w-full">
                             <TabsList className="grid w-full grid-cols-4 rounded-t-lg rounded-b-none">
                                <TabsTrigger value="income-statement">Estado de Resultados</TabsTrigger>
                                <TabsTrigger value="balance-sheet">Balance General</TabsTrigger>
                                <TabsTrigger value="cash-flow">Flujo de Efectivo</TabsTrigger>
                                <TabsTrigger value="equity-changes">Cambios en el Capital</TabsTrigger>
                            </TabsList>
                             <TabsContent value="income-statement" className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <CardTitle>Estado de Resultados (Pérdidas y Ganancias)</CardTitle>
                                        <CardDescription>Muestra ingresos, costos y gastos para determinar la utilidad o pérdida neta.</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleDownloadReport('Estado de Resultados')}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Descargar
                                    </Button>
                                </div>
                                <Table>
                                    <TableBody>
                                        <TableRow className="font-semibold text-secondary-foreground"><TableCell>Ingresos</TableCell><TableCell></TableCell></TableRow>
                                        {Object.entries(incomeStatementData.revenueByCategory).length > 0 ? Object.entries(incomeStatementData.revenueByCategory).map(([category, amount]) => (
                                            <TableRow key={category}><TableCell className="pl-8">{category}</TableCell><TableCell className="text-right">{amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>
                                        )) : <TableRow><TableCell className="pl-8 text-muted-foreground">No hay ingresos registrados</TableCell><TableCell></TableCell></TableRow>}
                                        <TableRow className="font-semibold border-t"><TableCell>Total de Ingresos</TableCell><TableCell className="text-right">{incomeStatementData.totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>
                                        
                                        <TableRow className="font-semibold text-secondary-foreground"><TableCell>Utilidad Bruta</TableCell><TableCell className="text-right">{incomeStatementData.grossProfit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>
                                        
                                        <TableRow className="font-semibold text-secondary-foreground"><TableCell>Gastos Operativos</TableCell><TableCell></TableCell></TableRow>
                                        {Object.entries(incomeStatementData.expensesByCategory).length > 0 ? Object.entries(incomeStatementData.expensesByCategory).map(([category, amount]) => (
                                            <TableRow key={category}><TableCell className="pl-8">{category}</TableCell><TableCell className="text-right text-red-600">({amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })})</TableCell></TableRow>
                                        )) : <TableRow><TableCell className="pl-8 text-muted-foreground">No hay gastos registrados</TableCell><TableCell></TableCell></TableRow>}
                                        <TableRow className="font-semibold border-t"><TableCell>Total de Gastos Operativos</TableCell><TableCell className="text-right text-red-600">({incomeStatementData.totalExpenses.toLocaleString('en-US', { style: 'currency', currency: 'USD' })})</TableCell></TableRow>
                                        
                                        <TableRow className="font-bold text-lg bg-muted/50"><TableCell>Utilidad antes de Impuestos</TableCell><TableCell className={cn("text-right", incomeStatementData.incomeBeforeTax >= 0 ? "text-blue-600" : "text-orange-600")}>{incomeStatementData.incomeBeforeTax.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>
                                        
                                        {selectedCompanyId !== 'all' && incomeStatementData.isTaxable && incomeStatementData.calculatedTaxes.map(tax => (
                                            <TableRow key={tax.name}>
                                                <TableCell className="pl-8">Impuesto: {tax.name} ({tax.rate}%)</TableCell>
                                                <TableCell className="text-right text-red-600">({tax.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })})</TableCell>
                                            </TableRow>
                                        ))}
                                        {selectedCompanyId === 'all' && <TableRow><TableCell colSpan={2} className="text-center text-xs text-muted-foreground">Seleccione una empresa específica para ver el cálculo de impuestos.</TableCell></TableRow>}

                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="font-bold text-xl bg-muted">
                                            <TableCell>Utilidad Neta</TableCell>
                                            <TableCell className={cn("text-right", incomeStatementData.netIncome >= 0 ? "text-blue-600" : "text-orange-600")}>
                                                {incomeStatementData.netIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                            </TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </TabsContent>
                            <TabsContent value="balance-sheet" className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <CardTitle>Balance General (al {date?.to ? format(date.to, "dd/MM/yyyy") : format(new Date(), "dd/MM/yyyy")})</CardTitle>
                                        <CardDescription>Presenta activos, pasivos y capital contable en una fecha específica.</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleDownloadReport('Balance General')}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Descargar
                                    </Button>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow><TableHead colSpan={2}>Activos</TableHead></TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow><TableCell>Efectivo y Equivalentes</TableCell><TableCell className="text-right">{balanceSheetData.assets.cash.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="font-bold bg-muted/50"><TableCell>Total de Activos</TableCell><TableCell className="text-right">{balanceSheetData.totalAssets.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>
                                    </TableFooter>
                                </Table>
                                <Table className="mt-4">
                                    <TableHeader>
                                        <TableRow><TableHead colSpan={2}>Pasivos y Capital Contable</TableHead></TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow><TableCell>Cuentas por Pagar (Pasivo)</TableCell><TableCell className="text-right">{balanceSheetData.liabilities.accountsPayable.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>
                                        <TableRow><TableCell>Utilidades Retenidas</TableCell><TableCell className="text-right">{balanceSheetData.equity.retainedEarnings.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>
                                        <TableRow><TableCell>Utilidad del Ejercicio</TableCell><TableCell className="text-right">{balanceSheetData.equity.netIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="font-bold bg-muted/50"><TableCell>Total Pasivo y Capital</TableCell><TableCell className="text-right">{balanceSheetData.totalLiabilitiesAndEquity.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>
                                    </TableFooter>
                                </Table>
                            </TabsContent>
                            <TabsContent value="cash-flow" className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <CardTitle>Estado de Flujo de Efectivo</CardTitle>
                                        <CardDescription>Detalla entradas y salidas de efectivo por actividades.</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleDownloadReport('Estado de Flujo de Efectivo')}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Descargar
                                    </Button>
                                </div>
                                <Table>
                                    <TableBody>
                                        <TableRow><TableCell>Efectivo al inicio del período</TableCell><TableCell className="text-right">{cashFlowData.initialCash.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>
                                        <TableRow><TableCell>Flujo de Efectivo por Actividades de Operación</TableCell><TableCell className="text-right">{cashFlowData.operating.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>
                                        <TableRow><TableCell>Flujo de Efectivo por Actividades de Inversión</TableCell><TableCell className="text-right text-red-600">({cashFlowData.investing.toLocaleString('en-US', { style: 'currency', currency: 'USD' })})</TableCell></TableRow>
                                        <TableRow><TableCell>Flujo de Efectivo por Actividades de Financiación</TableCell><TableCell className="text-right">{cashFlowData.financing.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="font-bold bg-muted">
                                            <TableCell>Flujo Neto de Efectivo</TableCell>
                                            <TableCell className="text-right">{cashFlowData.netCashFlow.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                        </TableRow>
                                        <TableRow className="font-bold bg-muted/80">
                                            <TableCell>Efectivo al final del período</TableCell>
                                            <TableCell className="text-right">{cashFlowData.finalCash.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </TabsContent>
                            <TabsContent value="equity-changes" className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <CardTitle>Estado de Cambios en el Capital Contable</CardTitle>
                                        <CardDescription>Refleja variaciones en el patrimonio de los socios.</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleDownloadReport('Estado de Cambios en el Capital Contable')}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Descargar
                                    </Button>
                                </div>
                                <Table>
                                     <TableBody>
                                        <TableRow><TableCell>Capital Inicial (Utilidades Retenidas)</TableCell><TableCell className="text-right">{balanceSheetData.equity.retainedEarnings.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>
                                        <TableRow><TableCell>+ Utilidad Neta del Ejercicio</TableCell><TableCell className="text-right">{balanceSheetData.equity.netIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>
                                         <TableRow><TableCell>- Dividendos o Retiros</TableCell><TableCell className="text-right text-red-600">($0.00)</TableCell></TableRow>
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="font-bold bg-muted">
                                            <TableCell>Capital Final</TableCell>
                                            <TableCell className="text-right">{balanceSheetData.totalLiabilitiesAndEquity.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </TabsContent>
                        </Tabs>
                    </Card>
                </TabsContent>
                 <TabsContent value="loans" className="mt-4">
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="md:col-span-1">
                            <CardHeader>
                                <CardTitle>Registrar Nuevo Préstamo</CardTitle>
                                <CardDescription>Cree un registro de un préstamo entre dos de sus empresas.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <LoanForm companies={companies} onAddLoan={addLoan} />
                            </CardContent>
                        </Card>
                         <Card className="md:col-span-2">
                             <CardHeader>
                                <CardTitle>Historial de Préstamos</CardTitle>
                                <CardDescription>Listado de todos los préstamos internos registrados.</CardDescription>
                            </CardHeader>
                            <CardContent>
                               <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Prestamista</TableHead>
                                            <TableHead>Prestatario</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead className="text-right">Monto</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {isLoadingLoans ? <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin"/></TableCell></TableRow> :
                                    loans.length > 0 ? loans.map(loan => (
                                        <TableRow key={loan.id}>
                                            <TableCell className="font-medium">{getCompanyName(loan.lenderCompanyId)}</TableCell>
                                            <TableCell className="font-medium">{getCompanyName(loan.borrowerCompanyId)}</TableCell>
                                            <TableCell>{format(loan.date.toDate(), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell><Badge variant={loan.status === 'Pagado' ? 'default' : 'secondary'}>{loan.status}</Badge></TableCell>
                                            <TableCell className="text-right font-semibold">{loan.amount.toLocaleString('en-US', {style: 'currency', currency: 'USD'})}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">No hay préstamos registrados.</TableCell>
                                        </TableRow>
                                    )}
                                    </TableBody>
                               </Table>
                            </CardContent>
                         </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </main>
      </div>
      <AddTransactionDialog 
        isOpen={isTransactionDialogOpen}
        onOpenChange={setIsTransactionDialogOpen}
        companies={companies}
        accounts={bankAccounts}
        categories={allCategories}
        clients={clients}
        onTransactionAdd={addTransaction}
      />
    </TooltipProvider>
  );
}

    