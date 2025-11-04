
"use client";

import React, { useState, useMemo } from "react";
import { Landmark, Briefcase, PlusCircle, ArrowRightLeft, DollarSign, BarChart, Settings, Edit, Trash2, KeyRound, Filter, ChevronsUpDown, Building, Loader2, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from "next/link";

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

const initialCategoryGroups = [
    { 
        id: 'group-income', 
        name: 'Fuentes de Ingreso',
        type: 'Ingreso',
        categories: [
            { id: 'cat-income-1', name: 'Ingreso por Desarrollo' },
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

export default function AccountingConfigPage() {
  const { toast } = useToast();
  
  // State for mock data
  const [mockCompanies, setMockCompanies] = useState(initialCompanies);
  const [mockAccounts, setMockAccounts] = useState(initialBankAccounts);
  const [categoryGroups, setCategoryGroups] = useState(initialCategoryGroups);

  // State for dialogs
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddCategoryGroupOpen, setIsAddCategoryGroupOpen] = useState(false);
  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
  const [currentCategoryGroupId, setCurrentCategoryGroupId] = useState<string | null>(null);

  const [newCompanyName, setNewCompanyName] = useState('');
  const [newAccountData, setNewAccountData] = useState({ name: '', companyId: '', type: 'Débito' });
  const [newCategoryGroupName, setNewCategoryGroupName] = useState('');
  const [newTypeName, setNewTypeName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  // --- Handlers for adding new entities ---

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
        const newCompany = { id: `emp-${Date.now()}`, name: newCompanyName, totalBalance: 0 };
        setMockCompanies(prev => [...prev, newCompany]);
        toast({ title: "Empresa Añadida", description: `La empresa "${newCompanyName}" ha sido creada.` });
        setIsSubmitting(false);
        setNewCompanyName('');
        setIsAddCompanyOpen(false);
    }, 500);
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountData.name.trim() || !newAccountData.companyId) return;
    setIsSubmitting(true);
    setTimeout(() => {
        const company = mockCompanies.find(c => c.id === newAccountData.companyId);
        const newAccount = { id: `cta-${Date.now()}`, companyId: newAccountData.companyId, companyName: company?.name || '', bankName: newAccountData.name, balance: 0, type: newAccountData.type };
        setMockAccounts(prev => [...prev, newAccount]);
        toast({ title: "Cuenta Añadida", description: `La cuenta "${newAccountData.name}" ha sido creada.` });
        setIsSubmitting(false);
        setNewAccountData({ name: '', companyId: '', type: 'Débito' });
        setIsAddAccountOpen(false);
    }, 500);
  };

  const handleAddCategoryGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryGroupName.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
        const newGroup = { id: `group-${Date.now()}`, name: newCategoryGroupName, type: 'Egreso', categories: [] };
        setCategoryGroups(prev => [...prev, newGroup]);
        toast({ title: "Categoría Añadida", description: `La categoría "${newCategoryGroupName}" ha sido creada.` });
        setIsSubmitting(false);
        setNewCategoryGroupName('');
        setIsAddCategoryGroupOpen(false);
    }, 500);
  };
  
  const openAddTypeDialog = (groupId: string) => {
    setCurrentCategoryGroupId(groupId);
    setIsAddTypeOpen(true);
  };

  const handleAddType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim() || !currentCategoryGroupId) return;
    setIsSubmitting(true);
    setTimeout(() => {
        const newType = { id: `cat-${Date.now()}`, name: newTypeName };
        setCategoryGroups(prev => prev.map(group => {
            if (group.id === currentCategoryGroupId) {
                return { ...group, categories: [...group.categories, newType] };
            }
            return group;
        }));
        toast({ title: "Tipo Añadido", description: `El tipo "${newTypeName}" ha sido creado.` });
        setIsSubmitting(false);
        setNewTypeName('');
        setIsAddTypeOpen(false);
        setCurrentCategoryGroupId(null);
    }, 500);
  };
  
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header
          title="Configuración de Contabilidad"
          description="Gestione las empresas, cuentas bancarias y categorías que estructuran su contabilidad."
        >
             <Button variant="outline" asChild>
                <Link href="/settings">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Contabilidad
                </Link>
            </Button>
        </Header>
        <main className="flex-1 p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Gestión de Entidades Contables</CardTitle>
                    <CardDescription>
                        Añada, edite o elimine las entidades que usa para organizar sus finanzas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="categorias" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="empresas"><Building className="mr-2 h-4 w-4"/>Empresas</TabsTrigger>
                            <TabsTrigger value="cuentas"><Landmark className="mr-2 h-4 w-4"/>Cuentas Bancarias</TabsTrigger>
                            <TabsTrigger value="categorias"><KeyRound className="mr-2 h-4 w-4"/>Categorías y Tipos</TabsTrigger>
                        </TabsList>
                        <TabsContent value="empresas" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>Listado de Empresas</span>
                                        <Button size="sm" onClick={() => setIsAddCompanyOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/>Añadir Empresa</Button>
                                    </CardTitle>
                                    <CardDescription>Entidades de negocio principales.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nombre de la Empresa</TableHead>
                                                <TableHead className="text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {mockCompanies.map(company => (
                                                <TableRow key={company.id}>
                                                    <TableCell className="font-medium">{company.name}</TableCell>
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
                        </TabsContent>
                        <TabsContent value="cuentas" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>Cuentas Bancarias</span>
                                        <Button size="sm" onClick={() => setIsAddAccountOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/>Añadir Cuenta</Button>
                                    </CardTitle>
                                    <CardDescription>Añada o edite las cuentas bancarias de sus empresas.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nombre / Banco</TableHead>
                                                <TableHead>Empresa</TableHead>
                                                <TableHead>Tipo</TableHead>
                                                <TableHead className="text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {mockAccounts.map(account => (
                                                <TableRow key={account.id}>
                                                    <TableCell className="font-medium">{account.bankName}</TableCell>
                                                    <TableCell>{account.companyName}</TableCell>
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
                        </TabsContent>
                        <TabsContent value="categorias" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>Listado de Categorías</span>
                                        <Button size="sm" onClick={() => setIsAddCategoryGroupOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/>Añadir Categoría</Button>
                                    </CardTitle>
                                    <CardDescription>Organice sus transacciones creando categorías y asignando tipos específicos.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="single" collapsible className="w-full space-y-4">
                                        {categoryGroups.map((group) => (
                                            <AccordionItem value={group.id} key={group.id} className="border-none">
                                                <Card className="overflow-hidden">
                                                    <div className="flex items-center justify-between p-4 bg-muted/50 hover:bg-muted/60">
                                                        <CardTitle className="text-base flex-grow text-left">
                                                            {group.name}
                                                        </CardTitle>
                                                        <div className="flex items-center gap-1 ml-auto mr-2">
                                                            <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-4 w-4"/></Button>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                                        </div>
                                                        <AccordionTrigger className="p-0 w-auto hover:no-underline" />
                                                    </div>
                                                    <AccordionContent className="p-4 pt-0">
                                                        <div className="flex justify-end mb-2">
                                                            <Button variant="outline" size="sm" onClick={() => openAddTypeDialog(group.id)}><PlusCircle className="mr-2 h-4 w-4"/>Añadir Tipo</Button>
                                                        </div>
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Nombre del Tipo</TableHead>
                                                                    <TableHead className="text-right">Acciones</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {group.categories.length > 0 ? group.categories.map(cat => (
                                                                    <TableRow key={cat.id}>
                                                                        <TableCell className="font-medium">{cat.name}</TableCell>
                                                                        <TableCell className="text-right">
                                                                            <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-4 w-4"/></Button>
                                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )) : (
                                                                    <TableRow>
                                                                        <TableCell colSpan={2} className="text-center text-muted-foreground">No hay tipos en esta categoría.</TableCell>
                                                                    </TableRow>
                                                                )}
                                                            </TableBody>
                                                        </Table>
                                                    </AccordionContent>
                                                </Card>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </main>
      </div>

      {/* Add Company Dialog */}
      <Dialog open={isAddCompanyOpen} onOpenChange={setIsAddCompanyOpen}>
          <DialogContent>
              <form onSubmit={handleAddCompany}>
                  <DialogHeader>
                      <DialogTitle>Añadir Nueva Empresa</DialogTitle>
                      <DialogDescription>
                          Cree una nueva entidad de negocio en su sistema de contabilidad.
                      </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                      <Label htmlFor="new-company-name">Nombre de la Empresa</Label>
                      <Input id="new-company-name" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} placeholder="Ej. WitBiz Inversiones" required />
                  </div>
                  <DialogFooter>
                      <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                      <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          Guardar Empresa
                      </Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>

      {/* Add Account Dialog */}
      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
          <DialogContent>
              <form onSubmit={handleAddAccount}>
                  <DialogHeader>
                      <DialogTitle>Añadir Nueva Cuenta Bancaria</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                      <div>
                          <Label htmlFor="new-account-name">Nombre del Banco</Label>
                          <Input id="new-account-name" value={newAccountData.name} onChange={(e) => setNewAccountData(prev => ({ ...prev, name: e.target.value }))} placeholder="Ej. BBVA, Santander" required />
                      </div>
                      <div>
                          <Label htmlFor="account-company">Empresa</Label>
                          <Select value={newAccountData.companyId} onValueChange={(value) => setNewAccountData(prev => ({...prev, companyId: value}))} required>
                              <SelectTrigger id="account-company"><SelectValue placeholder="Seleccione una empresa..." /></SelectTrigger>
                              <SelectContent>
                                  {mockCompanies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                              </SelectContent>
                          </Select>
                      </div>
                       <div>
                          <Label htmlFor="account-type">Tipo de Cuenta</Label>
                          <Select value={newAccountData.type} onValueChange={(value) => setNewAccountData(prev => ({...prev, type: value}))} required>
                              <SelectTrigger id="account-type"><SelectValue/></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="Débito">Débito</SelectItem>
                                  <SelectItem value="Crédito">Crédito</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                  </div>
                  <DialogFooter>
                      <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                      <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          Guardar Cuenta
                      </Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
      
        {/* Add Category Group Dialog */}
      <Dialog open={isAddCategoryGroupOpen} onOpenChange={setIsAddCategoryGroupOpen}>
          <DialogContent>
              <form onSubmit={handleAddCategoryGroup}>
                  <DialogHeader><DialogTitle>Añadir Nueva Categoría</DialogTitle></DialogHeader>
                  <div className="py-4">
                      <Label htmlFor="new-group-name">Nombre de la Categoría</Label>
                      <Input id="new-group-name" value={newCategoryGroupName} onChange={(e) => setNewCategoryGroupName(e.target.value)} placeholder="Ej. Gastos de Oficina" required />
                  </div>
                  <DialogFooter>
                      <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                      <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          Guardar Categoría
                      </Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>

      {/* Add Type Dialog */}
      <Dialog open={isAddTypeOpen} onOpenChange={setIsAddTypeOpen}>
          <DialogContent>
              <form onSubmit={handleAddType}>
                  <DialogHeader><DialogTitle>Añadir Nuevo Tipo</DialogTitle></DialogHeader>
                  <div className="py-4">
                      <Label htmlFor="new-type-name">Nombre del Tipo</Label>
                      <Input id="new-type-name" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} placeholder="Ej. Papelería" required />
                  </div>
                  <DialogFooter>
                      <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                      <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          Guardar Tipo
                      </Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    </>
  );
}
