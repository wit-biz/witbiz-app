
"use client";

import React, { useState, useMemo } from "react";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Landmark, Briefcase, PlusCircle, ArrowRightLeft, DollarSign, BarChart as BarChartIcon, Settings, Edit, Trash2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

const mockCategories = [
    { id: 'cat1', name: 'Ingreso por Consultoría', type: 'Ingreso', nature: 'N/A' },
    { id: 'cat2', name: 'Ingreso por Desarrollo', type: 'Ingreso', nature: 'N/A' },
    { id: 'cat3', name: 'Sueldos', type: 'Egreso', nature: 'Fijo' },
    { id: 'cat4', name: 'Renta', type: 'Egreso', nature: 'Fijo' },
    { id: 'cat5', name: 'Software', type: 'Egreso', nature: 'Fijo' },
    { id: 'cat6', name: 'Publicidad', type: 'Egreso', nature: 'Variable' },
    { id: 'cat7', name: 'Servicios (Luz, Agua)', type: 'Egreso', nature: 'Variable' },
    { id: 'cat8', name: 'Transferencia Interna', type: 'Transferencia', nature: 'N/A' },
];

const mockAccounts = [
    { id: 'acc1', name: 'Principal', company: 'WitBiz Core', type: 'Débito' },
    { id: 'acc2', name: 'Operativa', company: 'WitBiz Servicios Digitales', type: 'Débito' },
    { id: 'acc3', name: 'Consultoría', company: 'WitBiz Consultoría', type: 'Débito' },
    { id: 'acc4', name: 'Tarjeta de Crédito Corporativa', company: 'WitBiz Core', type: 'Crédito' },
];

export default function SettingsPage() {
  const totalBalance = useMemo(() => mockCompanies.reduce((sum, comp) => sum + comp.totalBalance, 0), []);
  const totalIncome = useMemo(() => mockTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0), []);
  const totalExpense = useMemo(() => mockTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0), []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Contabilidad"
        description="Centro de operaciones financieras y gestión de cuentas."
      >
        <div className="flex flex-col sm:flex-row gap-2">
            <Button><PlusCircle className="mr-2 h-4 w-4" />Añadir Empresa</Button>
            <Button variant="outline"><ArrowRightLeft className="mr-2 h-4 w-4" />Registrar Transacción</Button>
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
                <CardContent>
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
                            {mockTransactions.map((trx) => (
                                <TableRow key={trx.id}>
                                    <TableCell>{trx.date}</TableCell>
                                    <TableCell className="font-medium">{trx.description}</TableCell>
                                    <TableCell>{trx.category}</TableCell>
                                    <TableCell>
                                        <Badge variant={trx.type === 'income' ? 'default' : trx.type === 'expense' ? 'destructive' : 'secondary'}>
                                            {trx.type === 'income' ? 'Ingreso' : trx.type === 'expense' ? 'Egreso' : 'Transferencia'}
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
            <Accordion type="single" collapsible defaultValue="item-1" className="w-full space-y-4">
              <AccordionItem value="item-1">
                <Card>
                  <AccordionTrigger className="w-full p-0 [&_svg]:ml-auto [&_svg]:mr-4">
                    <CardHeader className="flex-1 text-left">
                      <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-accent"/>Gestión de Cuentas</CardTitle>
                      <CardDescription>Añada o edite las cuentas bancarias de sus empresas.</CardDescription>
                    </CardHeader>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 pt-0">
                    <div className="flex justify-end mb-4">
                        <Button><PlusCircle className="mr-2 h-4 w-4"/>Añadir Cuenta</Button>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre de Cuenta</TableHead>
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
                  </AccordionContent>
                </Card>
              </AccordionItem>
              <AccordionItem value="item-2">
                <Card>
                   <AccordionTrigger className="w-full p-0 [&_svg]:ml-auto [&_svg]:mr-4">
                    <CardHeader className="flex-1 text-left">
                      <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-accent"/>Gestión de Categorías</CardTitle>
                      <CardDescription>Defina las categorías para clasificar sus transacciones.</CardDescription>
                    </CardHeader>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 pt-0">
                    <div className="flex justify-end mb-4">
                        <Button><PlusCircle className="mr-2 h-4 w-4"/>Añadir Categoría</Button>
                    </div>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Naturaleza del Gasto</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockCategories.map(cat => (
                                <TableRow key={cat.id}>
                                    <TableCell className="font-medium">{cat.name}</TableCell>
                                    <TableCell><Badge variant={cat.type === 'Ingreso' ? 'default' : 'secondary'}>{cat.type}</Badge></TableCell>
                                    <TableCell>
                                        {cat.nature !== 'N/A' && <Badge variant="outline">{cat.nature}</Badge>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
