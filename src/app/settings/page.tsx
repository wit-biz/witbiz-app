
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Landmark, Briefcase, PlusCircle, ArrowRightLeft, DollarSign, BarChart as BarChartIcon, Settings, Edit, Trash2, KeyRound, Filter, ChevronsUpDown, Building, Loader2, Save, Calendar as CalendarIcon, ArrowUpCircle, ArrowDownCircle, TrendingUp, BookText, Users as UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddTransactionDialog } from "@/components/shared/AddTransactionDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isWithinInterval, startOfDay, endOfDay, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/header";
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCRMData } from "@/contexts/CRMDataContext";
import { Label } from "@/components/ui/label";

// --- Mock Data ---

const initialCompanies = [
  { id: 'emp1', name: 'WitBiz Core', totalBalance: 125000.75 },
  { id: 'emp2', name: 'WitBiz Servicios Digitales', totalBalance: 82500.50 },
  { id: 'emp3', name: 'WitBiz Consultoría', totalBalance: 210000.00 },
];

const initialBankAccounts = [
  { id: 'cta1', companyId: 'emp1', companyName: 'WitBiz Core', bankName: 'BBVA', balance: 75000.25, type: 'Débito' },
  { id: 'cta2', companyId: 'emp1', companyName: 'WitBiz Core', bankName: 'Santander', balance: 50000.50, type: 'Débito' },
  { id: 'cta3', companyId: 'emp2', companyName: 'WitBiz Servicios Digitales', bankName: 'Banorte', balance: 82500.50, type: 'Débito' },
  { id: 'cta4', companyId: 'emp3', companyName: 'WitBiz Consultoría', bankName: 'HSBC', balance: 110000.00, type: 'Crédito' },
  { id: 'cta5', companyId: 'emp3', companyName: 'WitBiz Consultoría', bankName: 'Inbursa', balance: 100000.00, type: 'Débito' },
];

const mockTransactions = [
    { id: 'trx1', date: '2024-07-20', description: 'Ingreso por consultoría - Proyecto Alpha', type: 'income', category: 'Ingreso por Consultoría', amount: 50000, companyId: 'emp3', accountId: 'cta4', clientId: '1' },
    { id: 'trx2', date: '2024-07-19', description: 'Pago de nómina Q1 Julio', type: 'expense', category: 'Sueldos', amount: -25000, companyId: 'emp1', accountId: 'cta1' },
    { id: 'trx3', date: '2024-07-18', description: 'Transferencia a WitBiz Servicios Digitales', type: 'expense', category: 'Transferencia Interna', amount: -10000, companyId: 'emp1', accountId: 'cta1' },
    { id: 'trx4', date: '2024-07-18', description: 'Recepción de transferencia de WitBiz Core', type: 'transfer_in', category: 'Transferencia Interna', amount: 10000, companyId: 'emp2', accountId: 'cta3' },
    { id: 'trx5', date: '2024-07-17', description: 'Pago de licencia de software (Adobe)', type: 'expense', category: 'Software', amount: -600, companyId: 'emp2', accountId: 'cta3' },
    { id: 'trx6', date: '2024-07-15', description: 'Ingreso por servicio web - Cliente Beta', type: 'income', category: 'Ingreso por Desarrollo', amount: 15000, companyId: 'emp2', accountId: 'cta3', clientId: '2' },
    { id: 'trx7', date: '2024-07-14', description: 'Pago de renta de oficina', type: 'expense', category: 'Renta', amount: -12000, companyId: 'emp1', accountId: 'cta2' },
];

const initialCategoryGroups = [
    { 
        id: 'group-income', 
        name: 'Fuentes de Ingreso',
        type: 'Ingreso',
        categories: [
            { id: 'cat-income-1', name: 'Ingreso por Desarrollo' },
            { id: 'cat-income-2', name: 'Ingreso por Consultoría' },
        ]
    },
    { 
        id: 'group-fixed',
        name: 'Gastos Fijos',
        type: 'Egreso',
        categories: [
            { id: 'cat-fixed-1', name: 'Sueldos' },
            { id: 'cat-fixed-2', name: 'Renta' },
        ]
    },
    {
        id: 'group-variable',
        name: 'Gastos Variables',
        type: 'Egreso',
        categories: [
             { id: 'cat-fixed-3', name: 'Software' },
            { id: 'cat-var-1', name: 'Publicidad' },
            { id: 'cat-var-2', name: 'Servicios (Luz, Agua)' },
            { id: 'cat-var-3', name: 'Comida y Viáticos' },
        ]
    },
    {
        id: 'group-transfer',
        name: 'Movimientos Internos',
        type: 'Transferencia',
        categories: [
            { id: 'cat-transfer-1', name: 'Transferencia Interna' },
        ]
    }
];

export default function SettingsPage() {
  const { toast } = useToast();
  const { clients, serviceWorkflows } = useCRMData();
  
  // State for mock data
  const [mockCompanies, setMockCompanies] = useState(initialCompanies);
  const [mockAccounts, setMockAccounts] = useState(initialBankAccounts);
  const [categoryGroups, setCategoryGroups] = useState(initialCategoryGroups);

  // State for dialogs
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  
  // -- General Filter States --
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  
  // -- Specific Filter States --
  const [selectedLedgerAccountId, setSelectedLedgerAccountId] = useState<string>("all");
  const [auxiliaryType, setAuxiliaryType] = useState<string>('banks');
  const [selectedAuxiliaryId, setSelectedAuxiliaryId] = useState<string>('all');


  const allCategories = useMemo(() => categoryGroups.flatMap(g => g.categories.map(c => ({...c, groupName: g.name, type: g.type}))), [categoryGroups]);

  const filteredTransactions = useMemo(() => {
    return mockTransactions.filter(item => {
        const itemDate = new Date(item.date);
        const isDateInRange = date?.from && date.to ? isWithinInterval(itemDate, { start: startOfDay(date.from), end: endOfDay(date.to) }) : true;
        const isCompanyMatch = selectedCompanyId === 'all' || item.companyId === selectedCompanyId;
        const isCategoryMatch = selectedCategoryId === 'all' || allCategories.find(c => c.name === item.category)?.id === selectedCategoryId;
        
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
  }, [date, selectedCompanyId, selectedCategoryId, selectedType, allCategories]);
  
  const generalLedgerData = useMemo(() => {
    if (selectedLedgerAccountId === 'all') return [];
    const categoryName = allCategories.find(c => c.id === selectedLedgerAccountId)?.name;
    return filteredTransactions.filter(t => t.category === categoryName);
  }, [selectedLedgerAccountId, allCategories, filteredTransactions]);

  const trialBalanceData = useMemo(() => {
    const balances = allCategories.reduce((acc, category) => {
        if(category.type === 'Transferencia') return acc; // Ignore internal transfers for trial balance
        const total = filteredTransactions
            .filter(t => t.category === category.name)
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
  
  const auxiliaryLedgerData = useMemo(() => {
      if (selectedAuxiliaryId === 'all') return [];
      if (auxiliaryType === 'banks') {
          return filteredTransactions.filter(t => t.accountId === selectedAuxiliaryId);
      }
      if (auxiliaryType === 'clients') {
          return filteredTransactions.filter(t => t.clientId === selectedAuxiliaryId && t.type === 'income');
      }
      return [];
  }, [auxiliaryType, selectedAuxiliaryId, filteredTransactions]);

  const generalSummary = useMemo(() => {
    const totalBalance = mockAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    return {
      totalBalance,
      companyCount: mockCompanies.length,
      accountCount: mockAccounts.length,
    }
  }, [mockAccounts, mockCompanies]);

  const incomeStatementData = useMemo(() => {
      const revenueByCategory = filteredTransactions
          .filter(t => t.type === 'income')
          .reduce((acc, t) => {
              acc[t.category] = (acc[t.category] || 0) + t.amount;
              return acc;
          }, {} as Record<string, number>);
      
      const totalRevenue = Object.values(revenueByCategory).reduce((sum, amount) => sum + amount, 0);

      const expensesByCategory = filteredTransactions
          .filter(t => t.type === 'expense' && !t.category.includes('Transferencia'))
          .reduce((acc, t) => {
              acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
              return acc;
          }, {} as Record<string, number>);

      const totalExpenses = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);

      // For this model, COGS is not explicitly tracked, so Gross Profit = Total Revenue.
      const grossProfit = totalRevenue;
      const operatingIncome = grossProfit - totalExpenses;
      const netIncome = operatingIncome; // Assuming no taxes or other non-operating items for now

      return {
          revenueByCategory,
          totalRevenue,
          grossProfit,
          expensesByCategory,
          totalExpenses,
          operatingIncome,
          netIncome,
      };
  }, [filteredTransactions]);

  const { balanceSheetData, cashFlowData } = useMemo(() => {
    const fromDate = date?.from ? startOfDay(date.from) : new Date(0);
    const toDate = date?.to ? endOfDay(date.to) : new Date();

    const priorTransactions = mockTransactions.filter(t => new Date(t.date) < fromDate);
    const retainedEarnings = priorTransactions
      .filter(t => t.type === 'income' || t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const initialCash = mockAccounts.reduce((sum, acc) => sum + acc.balance, 0) - mockTransactions.filter(t => new Date(t.date) >= fromDate).reduce((sum, t) => sum + t.amount, 0);
    
    const cashFromOperations = filteredTransactions
        .filter(t => t.type === 'income' || t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const finalCash = initialCash + cashFromOperations;
    
    const bsData = {
        assets: { cash: finalCash },
        liabilities: { accountsPayable: 0 }, // Placeholder
        equity: {
            retainedEarnings: retainedEarnings,
            netIncome: incomeStatementData.netIncome,
        },
        totalAssets: finalCash,
        totalLiabilitiesAndEquity: retainedEarnings + incomeStatementData.netIncome,
    };
    
    const cfData = {
        operating: cashFromOperations,
        investing: 0, // Placeholder
        financing: 0, // Placeholder
        netCashFlow: cashFromOperations,
        initialCash,
        finalCash
    }

    return { balanceSheetData: bsData, cashFlowData: cfData };
  }, [date, incomeStatementData.netIncome, mockAccounts, mockTransactions, filteredTransactions]);
  
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header
          title="Contabilidad"
          description="Centro de operaciones financieras y análisis de rentabilidad."
        >
            <Button variant="outline" onClick={() => setIsTransactionDialogOpen(true)}>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Registrar Movimiento
            </Button>
            <Button asChild variant="outline">
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
                    <CardDescription>Balance consolidado de todas las cuentas y empresas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="p-4 rounded-lg bg-secondary">
                            <h3 className="text-sm font-medium text-muted-foreground">Balance Total Consolidado</h3>
                            <p className="text-2xl font-bold">{generalSummary.totalBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-secondary">
                            <h3 className="text-sm font-medium text-muted-foreground">Empresas</h3>
                            <p className="text-2xl font-bold">{generalSummary.companyCount}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-secondary">
                            <h3 className="text-sm font-medium text-muted-foreground">Cuentas Bancarias</h3>
                            <p className="text-2xl font-bold">{generalSummary.accountCount}</p>
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
                    <div className="flex flex-col md:flex-row gap-2">
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button id="date" variant={"outline"} className={cn("w-full md:w-auto justify-start text-left font-normal", !date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (date.to ? (<>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</>) : (format(date.from, "LLL dd, y"))) : (<span>Calendario</span>)}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} locale={es} />
                        </PopoverContent>
                        </Popover>
                        <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                        <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Filtrar por empresa..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las Empresas</SelectItem>
                            {mockCompanies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                        <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Filtrar por categoría..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las Categorías</SelectItem>
                            {allCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filtrar por tipo..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los Tipos</SelectItem>
                            <SelectItem value="income">Ingreso</SelectItem>
                            <SelectItem value="expense">Egreso</SelectItem>
                            <SelectItem value="transfer">Transferencia</SelectItem>
                        </SelectContent>
                        </Select>
                        <Button variant="ghost" onClick={() => { setDate(undefined); setSelectedCompanyId("all"); setSelectedCategoryId("all"); setSelectedType("all");}}>Limpiar</Button>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="ledger">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="ledger"><BookText className="mr-2 h-4 w-4"/>Libros y Registros Contables</TabsTrigger>
                    <TabsTrigger value="pnl"><BarChartIcon className="mr-2 h-4 w-4"/>Estados Financieros Fundamentales</TabsTrigger>
                </TabsList>
                <TabsContent value="ledger" className="space-y-4">
                    <Card>
                        <Tabs defaultValue="daily-journal" className="w-full">
                            <TabsList className="grid w-full grid-cols-4 rounded-t-lg rounded-b-none">
                                <TabsTrigger value="daily-journal">Libro Diario</TabsTrigger>
                                <TabsTrigger value="general-ledger">Libro Mayor</TabsTrigger>
                                <TabsTrigger value="trial-balance">Balanza de Comprobación</TabsTrigger>
                                <TabsTrigger value="auxiliaries">Auxiliares Contables</TabsTrigger>
                            </TabsList>
                            <TabsContent value="daily-journal" className="p-6">
                                <CardTitle>Libro Diario</CardTitle>
                                <CardDescription className="mb-4">Registro cronológico de todas las operaciones financieras de la empresa.</CardDescription>
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
                                        {filteredTransactions.map((trx) => (
                                            <TableRow key={trx.id}>
                                                <TableCell>{format(new Date(trx.date), "dd/MM/yyyy")}</TableCell>
                                                <TableCell className="font-medium">{trx.description}</TableCell>
                                                <TableCell>{trx.category}</TableCell>
                                                <TableCell>
                                                    <Badge variant={trx.type === 'income' ? 'default' : trx.type === 'expense' ? 'destructive' : 'secondary'}>
                                                        {trx.type === 'income' ? 'Ingreso' : trx.type.startsWith('transfer') ? 'Transferencia' : 'Egreso'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className={`text-right font-semibold ${trx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {trx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TabsContent>
                            <TabsContent value="general-ledger" className="p-6">
                                    <CardTitle>Libro Mayor</CardTitle>
                                    <CardDescription className="mb-4">Concentración de movimientos por cuenta contable (categoría).</CardDescription>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Label htmlFor="ledger-account-filter">Cuenta Contable</Label>
                                        <Select value={selectedLedgerAccountId} onValueChange={setSelectedLedgerAccountId}>
                                            <SelectTrigger id="ledger-account-filter" className="w-[300px]"><SelectValue placeholder="Seleccione una cuenta..."/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Ver todas las transacciones</SelectItem>
                                                {allCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
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
                                                <TableRow><TableCell colSpan={3} className="text-center">Seleccione una cuenta para ver sus movimientos.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                        <TableFooter>
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-right font-bold">Saldo Total de la Cuenta:</TableCell>
                                                <TableCell className="text-right font-bold">{generalLedgerData.reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    </Table>
                            </TabsContent>
                            <TabsContent value="trial-balance" className="p-6">
                                <CardTitle>Balanza de Comprobación</CardTitle>
                                <CardDescription className="mb-4">Verificación de la suma de saldos deudores y acreedores.</CardDescription>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cuenta Contable</TableHead>
                                            <TableHead className="text-right">Debe (Cargos)</TableHead>
                                            <TableHead className="text-right">Haber (Abonos)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {trialBalanceData.map(item => (
                                            <TableRow key={item.account}>
                                                <TableCell className="font-medium">{item.account}</TableCell>
                                                <TableCell className="text-right text-red-600">{item.debit > 0 ? item.debit.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '-'}</TableCell>
                                                <TableCell className="text-right text-green-600">{item.credit > 0 ? item.credit.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '-'}</TableCell>
                                            </TableRow>
                                        ))}
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
                                    <CardTitle>Auxiliares Contables</CardTitle>
                                    <CardDescription className="mb-4">Detalle de movimientos a nivel de subcuentas (Bancos, Clientes, etc.).</CardDescription>
                                    <div className="flex items-center gap-4 mb-4">
                                        <Select value={auxiliaryType} onValueChange={setAuxiliaryType}>
                                            <SelectTrigger className="w-[200px]"><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="banks">Auxiliar de Bancos</SelectItem>
                                                <SelectItem value="clients">Auxiliar de Clientes</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {auxiliaryType === 'banks' && (
                                            <Select value={selectedAuxiliaryId} onValueChange={setSelectedAuxiliaryId}>
                                                <SelectTrigger className="w-[300px]"><SelectValue placeholder="Seleccione una cuenta bancaria..."/></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todas las Cuentas</SelectItem>
                                                    {mockAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.bankName} ({acc.companyName})</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )}
                                        {auxiliaryType === 'clients' && (
                                            <Select value={selectedAuxiliaryId} onValueChange={setSelectedAuxiliaryId}>
                                                <SelectTrigger className="w-[300px]"><SelectValue placeholder="Seleccione un cliente..."/></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos los Clientes</SelectItem>
                                                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )}
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
                                            {auxiliaryLedgerData.length > 0 ? auxiliaryLedgerData.map(trx => (
                                                <TableRow key={trx.id}>
                                                    <TableCell>{format(new Date(trx.date), "dd/MM/yyyy")}</TableCell>
                                                    <TableCell className="font-medium">{trx.description}</TableCell>
                                                    <TableCell className={`text-right font-semibold ${trx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {trx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow><TableCell colSpan={3} className="text-center">Seleccione un auxiliar para ver su detalle.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                        <TableFooter>
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-right font-bold">Saldo Total del Auxiliar:</TableCell>
                                                <TableCell className="text-right font-bold">{auxiliaryLedgerData.reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    </Table>
                            </TabsContent>
                        </Tabs>
                    </Card>
                </TabsContent>
                 <TabsContent value="pnl" className="space-y-4">
                     <Card>
                        <Tabs defaultValue="income-statement" className="w-full">
                            <TabsList className="grid w-full grid-cols-4 rounded-t-lg rounded-b-none">
                                <TabsTrigger value="balance-sheet">Balance General</TabsTrigger>
                                <TabsTrigger value="income-statement">Estado de Resultados</TabsTrigger>
                                <TabsTrigger value="cash-flow">Flujo de Efectivo</TabsTrigger>
                                <TabsTrigger value="equity-changes">Cambios en el Capital</TabsTrigger>
                            </TabsList>
                            <TabsContent value="balance-sheet" className="p-6">
                                <CardTitle>Balance General (al {date?.to ? format(date.to, "dd/MM/yyyy") : 'hoy'})</CardTitle>
                                <CardDescription className="mb-4">Presenta activos, pasivos y capital contable en una fecha específica.</CardDescription>
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
                            <TabsContent value="income-statement" className="p-6">
                                <CardTitle>Estado de Resultados (Pérdidas y Ganancias)</CardTitle>
                                <CardDescription className="mb-4">Muestra ingresos, costos y gastos para determinar la utilidad o pérdida neta.</CardDescription>
                                <Table>
                                    <TableBody>
                                        <TableRow className="font-semibold text-secondary-foreground"><TableCell>Ingresos</TableCell><TableCell></TableCell></TableRow>
                                        {Object.entries(incomeStatementData.revenueByCategory).map(([category, amount]) => (
                                            <TableRow key={category}><TableCell className="pl-8">{category}</TableCell><TableCell className="text-right">{amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>
                                        ))}
                                        <TableRow className="font-semibold border-t"><TableCell>Total de Ingresos</TableCell><TableCell className="text-right">{incomeStatementData.totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>
                                        
                                        <TableRow className="font-semibold text-secondary-foreground"><TableCell>Utilidad Bruta</TableCell><TableCell className="text-right">{incomeStatementData.grossProfit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>
                                        
                                        <TableRow className="font-semibold text-secondary-foreground"><TableCell>Gastos Operativos</TableCell><TableCell></TableCell></TableRow>
                                        {Object.entries(incomeStatementData.expensesByCategory).map(([category, amount]) => (
                                            <TableRow key={category}><TableCell className="pl-8">{category}</TableCell><TableCell className="text-right text-red-600">({amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })})</TableCell></TableRow>
                                        ))}
                                        <TableRow className="font-semibold border-t"><TableCell>Total de Gastos Operativos</TableCell><TableCell className="text-right text-red-600">({incomeStatementData.totalExpenses.toLocaleString('en-US', { style: 'currency', currency: 'USD' })})</TableCell></TableRow>
                                        
                                        <TableRow className="font-bold text-lg bg-muted"><TableCell>Utilidad Operativa</TableCell><TableCell className={cn("text-right", incomeStatementData.operatingIncome >= 0 ? "text-blue-600" : "text-orange-600")}>{incomeStatementData.operatingIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="font-bold text-xl bg-muted/80">
                                            <TableCell>Utilidad Neta</TableCell>
                                            <TableCell className={cn("text-right", incomeStatementData.netIncome >= 0 ? "text-blue-600" : "text-orange-600")}>
                                                {incomeStatementData.netIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                            </TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </TabsContent>
                            <TabsContent value="cash-flow" className="p-6">
                                <CardTitle>Estado de Flujo de Efectivo</CardTitle>
                                <CardDescription className="mb-4">Detalla entradas y salidas de efectivo por actividades.</CardDescription>
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
                                <CardTitle>Estado de Cambios en el Capital Contable</CardTitle>
                                <CardDescription className="mb-4">Refleja variaciones en el patrimonio de los socios.</CardDescription>
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
            </Tabs>
        </main>
      </div>
      <AddTransactionDialog 
        isOpen={isTransactionDialogOpen}
        onOpenChange={setIsTransactionDialogOpen}
        companies={mockCompanies}
        accounts={mockAccounts}
        categories={allCategories}
        onTransactionAdd={(data) => {
            console.log("Nueva transacción:", data);
        }}
      />
    </>
  );
}
