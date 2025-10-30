
"use client";

import React, { useState, useMemo } from "react";
import { Landmark, Briefcase, PlusCircle, ArrowRightLeft, DollarSign, BarChart as BarChartIcon, Settings, Edit, Trash2, KeyRound, Filter, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, BarChart } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AddTransactionDialog } from "@/components/shared/AddTransactionDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon } from "lucide-react";
import { Header } from "@/components/header";

// --- Mock Data ---

const mockCompanies = [
  { id: 'emp1', name: 'WitBiz Core', totalBalance: 125000.75 },
  { id: 'emp2', name: 'WitBiz Servicios Digitales', totalBalance: 82500.50 },
  { id: 'emp3', name: 'WitBiz Consultoría', totalBalance: 210000.00 },
];

const mockBankAccounts = [
  { id: 'cta1', companyId: 'emp1', companyName: 'WitBiz Core', bankName: 'BBVA', balance: 75000.25 },
  { id: 'cta2', companyId: 'emp1', companyName: 'WitBiz Core', bankName: 'Santander', balance: 50000.50 },
  { id: 'cta3', companyId: 'emp2', companyName: 'WitBiz Servicios Digitales', bankName: 'Banorte', balance: 82500.50 },
  { id: 'cta4', companyId: 'emp3', companyName: 'WitBiz Consultoría', bankName: 'HSBC', balance: 110000.00 },
  { id: 'cta5', companyId: 'emp3', companyName: 'WitBiz Consultoría', bankName: 'Inbursa', balance: 100000.00 },
];

const mockTransactions = [
    { id: 'trx1', date: '2024-07-20', description: 'Ingreso por consultoría - Proyecto Alpha', type: 'income', category: 'Ingreso por Consultoría', amount: 50000, companyId: 'emp3', accountId: 'cta4' },
    { id: 'trx2', date: '2024-07-19', description: 'Pago de nómina Q1 Julio', type: 'expense', category: 'Sueldos', amount: -25000, companyId: 'emp1', accountId: 'cta1' },
    { id: 'trx3', date: '2024-07-18', description: 'Transferencia a WitBiz Servicios Digitales', type: 'transfer_out', category: 'Transferencia Interna', amount: -10000, companyId: 'emp1', accountId: 'cta1' },
    { id: 'trx4', date: '2024-07-18', description: 'Recepción de transferencia de WitBiz Core', type: 'transfer_in', category: 'Transferencia Interna', amount: 10000, companyId: 'emp2', accountId: 'cta3' },
    { id: 'trx5', date: '2024-07-17', description: 'Pago de licencia de software (Adobe)', type: 'expense', category: 'Software', amount: -600, companyId: 'emp2', accountId: 'cta3' },
    { id: 'trx6', date: '2024-07-15', description: 'Ingreso por servicio web - Cliente Beta', type: 'income', category: 'Ingreso por Desarrollo', amount: 15000, companyId: 'emp2', accountId: 'cta3' },
    { id: 'trx7', date: '2024-07-14', description: 'Pago de renta de oficina', type: 'expense', category: 'Renta', amount: -12000, companyId: 'emp1', accountId: 'cta2' },
];

const mockChartData = [
  { month: "Feb", Ingresos: 186000, Egresos: 80000 },
  { month: "Mar", Ingresos: 305000, Egresos: 120000 },
  { month: "Abr", Ingresos: 237000, Egresos: 95000 },
  { month: "May", Ingresos: 273000, Egresos: 140000 },
  { month: "Jun", Ingresos: 209000, Egresos: 110000 },
  { month: "Jul", Ingresos: 214000, Egresos: 130000 },
];

const chartConfig = {
  Egresos: { label: "Egresos", color: "hsl(var(--destructive))" },
  Ingresos: { label: "Ingresos", color: "hsl(var(--primary))" },
};

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
            { id: 'cat-fixed-3', name: 'Software' },
        ]
    },
    {
        id: 'group-variable',
        name: 'Gastos Variables',
        type: 'Egreso',
        categories: [
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


const mockAccounts = [
    { id: 'acc1', name: 'Principal', company: 'WitBiz Core', type: 'Débito' },
    { id: 'acc2', name: 'Operativa', company: 'WitBiz Servicios Digitales', type: 'Débito' },
    { id: 'acc3', name: 'Consultoría', company: 'WitBiz Consultoría', type: 'Débito' },
    { id: 'acc4', name: 'Tarjeta de Crédito Corporativa', company: 'WitBiz Core', type: 'Crédito' },
];

export default function SettingsPage() {
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const totalBalance = useMemo(() => mockCompanies.reduce((sum, comp) => sum + comp.totalBalance, 0), []);
  const totalIncome = useMemo(() => mockTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0), []);
  const totalExpense = useMemo(() => mockTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0), []);
  
  const [date, setDate] = useState<DateRange | undefined>();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const [categoryGroups, setCategoryGroups] = useState(initialCategoryGroups);

  const allCategories = useMemo(() => categoryGroups.flatMap(g => g.categories.map(c => ({...c, groupName: g.name}))), [categoryGroups]);


  const filteredTransactions = useMemo(() => {
    return mockTransactions.filter(item => {
        const itemDate = new Date(item.date);
        const isDateInRange = date?.from && date.to ? isWithinInterval(itemDate, { start: startOfDay(date.from), end: endOfDay(date.to) }) : true;
        const isCompanyMatch = selectedCompanyId === 'all' || item.companyId === selectedCompanyId;
        const isCategoryMatch = selectedCategoryId === 'all' || item.category === selectedCategoryId;
        const isTypeMatch = selectedType === 'all' || item.type.startsWith(selectedType);
        return isDateInRange && isCompanyMatch && isCategoryMatch && isTypeMatch;
    });
  }, [date, selectedCompanyId, selectedCategoryId, selectedType, allCategories]);
  
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header
          title="Contabilidad"
          description="Centro de operaciones financieras y gestión de cuentas."
        >
          <div className="flex flex-col sm:flex-row gap-2">
              <Button><PlusCircle className="mr-2 h-4 w-4" />Añadir Empresa</Button>
              <Button variant="outline" onClick={() => setIsTransactionDialogOpen(true)}>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Registrar Transacción
              </Button>
          </div>
        </Header>
        <main className="flex-1 p-4 md:p-8">
          <Tabs defaultValue="resumen">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="resumen"><BarChartIcon className="mr-2 h-4 w-4"/>Resumen</TabsTrigger>
              <TabsTrigger value="transacciones"><DollarSign className="mr-2 h-4 w-4"/>Transacciones</TabsTrigger>
              <TabsTrigger value="configuracion"><Settings className="mr-2 h-4 w-4"/>Configuración</TabsTrigger>
            </TabsList>

            <TabsContent value="resumen" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                  <Card>
                      <CardHeader><CardTitle>Ingresos del Mes</CardTitle></CardHeader>
                      <CardContent>
                          <p className="text-3xl font-bold text-green-600">${totalIncome.toLocaleString('en-US')}</p>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader><CardTitle>Egresos del Mes</CardTitle></CardHeader>
                      <CardContent>
                          <p className="text-3xl font-bold text-red-600">${Math.abs(totalExpense).toLocaleString('en-US')}</p>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader><CardTitle>Beneficio Neto</CardTitle></CardHeader>
                      <CardContent>
                          <p className="text-3xl font-bold">${(totalIncome + totalExpense).toLocaleString('en-US')}</p>
                      </CardContent>
                  </Card>
              </div>
              <Card>
                  <CardHeader>
                      <CardTitle>Flujo de Efectivo (Últimos 6 meses)</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                      <ChartContainer config={chartConfig} className="h-[250px] w-full">
                          <BarChart data={mockChartData} accessibilityLayer>
                              <CartesianGrid vertical={false} />
                              <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} />
                              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                              <Bar dataKey="Ingresos" fill="var(--color-Ingresos)" radius={4} />
                              <Bar dataKey="Egresos" fill="var(--color-Egresos)" radius={4} />
                          </BarChart>
                      </ChartContainer>
                  </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transacciones">
               <Card>
                  <CardHeader>
                      <CardTitle>Registro de Movimientos</CardTitle>
                      <CardDescription>Listado completo de todas las transacciones financieras.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                       <div className="flex flex-col md:flex-row gap-2 border p-4 rounded-lg">
                           <Popover>
                            <PopoverTrigger asChild>
                              <Button id="date" variant={"outline"} className={cn("w-full md:w-auto justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (date.to ? (<>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</>) : (format(date.from, "LLL dd, y"))) : (<span>Seleccione un rango</span>)}
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
                              {allCategories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
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
                                      <TableCell>{trx.date}</TableCell>
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
                  </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="configuracion">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Grupos y Categorías</span>
                                <Button size="sm"><PlusCircle className="mr-2 h-4 w-4"/>Añadir Grupo</Button>
                            </CardTitle>
                            <CardDescription>Organice sus transacciones creando grupos y asignando categorías específicas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Accordion type="multiple" className="w-full space-y-4">
                                {categoryGroups.map((group) => (
                                    <AccordionItem value={group.id} key={group.id} className="border-none">
                                     <Card className="overflow-hidden">
                                        <AccordionTrigger className="w-full p-0 bg-muted/50 hover:no-underline [&_svg]:ml-auto [&_svg]:mr-4">
                                            <CardHeader className="flex-1 text-left p-4">
                                                 <CardTitle className="text-base flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                      <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                                                      {group.name}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                      <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-4 w-4"/></Button>
                                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                                    </div>
                                                </CardTitle>
                                            </CardHeader>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 pt-0">
                                            <div className="flex justify-end mb-2">
                                                <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4"/>Añadir Categoría</Button>
                                            </div>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Nombre de Categoría</TableHead>
                                                        <TableHead className="text-right">Acciones</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {group.categories.map(cat => (
                                                        <TableRow key={cat.id}>
                                                            <TableCell className="font-medium">{cat.name}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-4 w-4"/></Button>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </AccordionContent>
                                      </Card>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Cuentas Bancarias</span>
                                <Button size="sm"><PlusCircle className="mr-2 h-4 w-4"/>Añadir Cuenta</Button>
                            </CardTitle>
                            <CardDescription>Añada o edite las cuentas bancarias de sus empresas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Nombre</TableHead>
                                      <TableHead>Empresa</TableHead>
                                      <TableHead>Tipo</TableHead>
                                      <TableHead className="text-right">Acciones</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {mockAccounts.map(account => (
                                      <TableRow key={account.id}>
                                          <TableCell className="font-medium">{account.name}</TableCell>
                                          <TableCell>{account.company}</TableCell>
                                          <TableCell><Badge variant="outline">{account.type}</Badge></TableCell>
                                          <TableCell className="text-right">
                                              <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                                              <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                          </TableCell>
                                      </TableRow>
                                  ))}
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
        companies={mockCompanies}
        accounts={mockBankAccounts}
        categories={allCategories}
        onTransactionAdd={(data) => {
            console.log("Nueva transacción:", data);
            // Aquí iría la lógica para añadir la transacción al estado
        }}
      />
    </>
  );
}
