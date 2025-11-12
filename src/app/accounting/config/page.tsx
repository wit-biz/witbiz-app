
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { ArrowLeft, Building, Landmark, ListPlus, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Company, BankAccount, Category } from "@/lib/types";


// --- Mock Data ---
const initialCompanies: Company[] = [];
const initialBankAccounts: BankAccount[] = [];
const initialCategories: Category[] = [];

// --- Zod Schemas ---
const companySchema = z.object({
  name: z.string().min(2, "El nombre de la empresa es requerido."),
});

const bankAccountSchema = z.object({
  companyId: z.string().min(1, "Debe seleccionar una empresa."),
  bankName: z.string().min(2, "El nombre del banco es requerido."),
  currency: z.enum(['MXN', 'USD', 'EUR'], { required_error: "La divisa es requerida." }),
  initialBalance: z.coerce.number().default(0),
});

const categorySchema = z.object({
  name: z.string().min(2, "El nombre de la categoría es requerido."),
  type: z.enum(['Ingreso', 'Egreso'], { required_error: "El tipo es requerido." }),
});

const currencyFlags: Record<BankAccount['currency'], string> = {
    MXN: '🇲🇽',
    USD: '🇺🇸',
    EUR: '🇪🇺',
};

// --- Form Components ---
function CompanyForm({ onAddCompany }: { onAddCompany: (data: Company) => void }) {
  const form = useForm({ resolver: zodResolver(companySchema), defaultValues: { name: '' } });
  const { toast } = useToast();

  const onSubmit = (data: z.infer<typeof companySchema>) => {
    onAddCompany({ id: `comp-${Date.now()}`, name: data.name });
    toast({ title: "Empresa Añadida", description: `Se ha añadido la empresa "${data.name}".` });
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre de la Empresa</FormLabel>
            <FormControl><Input {...field} placeholder="Ej. Mi Empresa S.A. de C.V." /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" />Añadir Empresa</Button>
      </form>
    </Form>
  );
}

function BankAccountForm({ companies, onAddAccount }: { companies: Company[], onAddAccount: (data: BankAccount) => void }) {
  const form = useForm({ resolver: zodResolver(bankAccountSchema), defaultValues: { companyId: '', bankName: '', currency: undefined, initialBalance: 0 } });
  const { toast } = useToast();

  const onSubmit = (data: z.infer<typeof bankAccountSchema>) => {
    onAddAccount({ 
        id: `acc-${Date.now()}`, 
        companyId: data.companyId, 
        bankName: data.bankName, 
        currency: data.currency,
        balance: data.initialBalance
    });
    toast({ title: "Cuenta Añadida", description: `Se ha añadido la cuenta en ${data.bankName}.` });
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="companyId" render={({ field }) => (
          <FormItem>
            <FormLabel>Empresa</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una empresa..." /></SelectTrigger></FormControl>
              <SelectContent>
                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="bankName" render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre del Banco</FormLabel>
            <FormControl><Input {...field} placeholder="Ej. BBVA, Santander" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="currency" render={({ field }) => (
          <FormItem>
            <FormLabel>Divisa</FormLabel>
             <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una divisa..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(currencyFlags).map(([code, flag]) => (
                    <SelectItem key={code} value={code}>
                      <span className="flex items-center gap-2">{flag} {code}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            <FormMessage />
          </FormItem>
        )} />
         <FormField control={form.control} name="initialBalance" render={({ field }) => (
          <FormItem>
            <FormLabel>Saldo Inicial (Opcional)</FormLabel>
            <FormControl><Input type="number" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" />Añadir Cuenta</Button>
      </form>
    </Form>
  );
}

function CategoryForm({ onAddCategory }: { onAddCategory: (data: Category) => void }) {
  const form = useForm({ resolver: zodResolver(categorySchema), defaultValues: { name: '', type: undefined } });
  const { toast } = useToast();

  const onSubmit = (data: z.infer<typeof categorySchema>) => {
    onAddCategory({ id: `cat-${Date.now()}`, name: data.name, type: data.type });
    toast({ title: "Categoría Añadida", description: `Se ha añadido la categoría "${data.name}".` });
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre de la Categoría</FormLabel>
            <FormControl><Input {...field} placeholder="Ej. Venta de Servicios, Nómina" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de Categoría</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un tipo..." /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="Ingreso">Ingreso</SelectItem>
                <SelectItem value="Egreso">Egreso</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" />Añadir Categoría</Button>
      </form>
    </Form>
  );
}

export default function AccountingConfigPage() {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(initialBankAccounts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  const addCompany = (company: Company) => setCompanies(prev => [...prev, company]);
  const addAccount = (account: BankAccount) => setBankAccounts(prev => [...prev, account]);
  const addCategory = (category: Category) => setCategories(prev => [...prev, category]);

  const deleteCompany = (id: string) => setCompanies(prev => prev.filter(c => c.id !== id));
  const deleteAccount = (id: string) => setBankAccounts(prev => prev.filter(a => a.id !== id));
  const deleteCategory = (id: string) => setCategories(prev => prev.filter(c => c.id !== id));

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Configuración Contable" description="Gestione las entidades base de su sistema contable.">
        <Button variant="outline" asChild>
          <Link href="/settings"><ArrowLeft className="mr-2 h-4 w-4" />Volver a Contabilidad</Link>
        </Button>
      </Header>
      <main className="flex-1 p-4 md:p-8">
        <Tabs defaultValue="companies">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="companies"><Building className="mr-2 h-4 w-4" />Empresas</TabsTrigger>
            <TabsTrigger value="accounts"><Landmark className="mr-2 h-4 w-4" />Cuentas Bancarias</TabsTrigger>
            <TabsTrigger value="categories"><ListPlus className="mr-2 h-4 w-4" />Categorías</TabsTrigger>
          </TabsList>

          <TabsContent value="companies" className="mt-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="md:col-span-1"><CardHeader><CardTitle>Añadir Empresa</CardTitle></CardHeader><CardContent><CompanyForm onAddCompany={addCompany} /></CardContent></Card>
              <Card className="md:col-span-2">
                <CardHeader><CardTitle>Empresas Registradas</CardTitle><CardDescription>Listado de todas sus entidades fiscales.</CardDescription></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {companies.length > 0 ? companies.map(c => (
                        <TableRow key={c.id}><TableCell>{c.name}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => deleteCompany(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>
                      )) : <TableRow><TableCell colSpan={2} className="text-center h-24">No hay empresas registradas.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="accounts" className="mt-6">
             <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-1"><CardHeader><CardTitle>Añadir Cuenta Bancaria</CardTitle></CardHeader><CardContent><BankAccountForm companies={companies} onAddAccount={addAccount} /></CardContent></Card>
                <Card className="md:col-span-2">
                    <CardHeader><CardTitle>Cuentas Registradas</CardTitle><CardDescription>Listado de sus cuentas bancarias.</CardDescription></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Banco</TableHead><TableHead>Empresa</TableHead><TableHead>Divisa</TableHead><TableHead className="text-right">Saldo Inicial</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {bankAccounts.length > 0 ? bankAccounts.map(a => (
                                    <TableRow key={a.id}>
                                        <TableCell>{a.bankName}</TableCell>
                                        <TableCell>{companies.find(c => c.id === a.companyId)?.name}</TableCell>
                                        <TableCell><span className="flex items-center gap-2">{currencyFlags[a.currency]} {a.currency}</span></TableCell>
                                        <TableCell className="text-right">{a.balance.toLocaleString('en-US', { style: 'currency', currency: a.currency })}</TableCell>
                                        <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => deleteAccount(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={5} className="text-center h-24">No hay cuentas registradas.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
             <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-1"><CardHeader><CardTitle>Añadir Categoría</CardTitle></CardHeader><CardContent><CategoryForm onAddCategory={addCategory} /></CardContent></Card>
                <Card className="md:col-span-2">
                    <CardHeader><CardTitle>Categorías de Transacción</CardTitle><CardDescription>Clasifique sus ingresos y egresos.</CardDescription></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {categories.length > 0 ? categories.map(c => (
                                    <TableRow key={c.id}><TableCell>{c.name}</TableCell><TableCell>{c.type}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => deleteCategory(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>
                                )) : <TableRow><TableCell colSpan={3} className="text-center h-24">No hay categorías registradas.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
