
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Company, BankAccount, Category, CreditDetails, Tax } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";


// --- Mock Data ---
const initialCompanies: Company[] = [];
const initialBankAccounts: BankAccount[] = [];
const initialCategories: Category[] = [];

// --- Zod Schemas ---
const taxSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre del impuesto es requerido."),
  rate: z.coerce.number().min(0, "La tasa debe ser positiva.").max(100, "La tasa no puede exceder 100."),
});

const companySchema = z.object({
  name: z.string().min(2, "El nombre de la empresa es requerido."),
  taxes: z.array(taxSchema).optional(),
});


const creditDetailsSchema = z.object({
    hasCredit: z.boolean().default(false),
    status: z.enum(['No Ofrecido', 'Pendiente', 'Aceptado', 'Rechazado']).default('No Ofrecido'),
    creditAmount: z.coerce.number().optional(),
    paymentPlan: z.string().optional(),
});

const bankAccountSchema = z.object({
  companyId: z.string().min(1, "Debe seleccionar una empresa."),
  bankName: z.string().min(2, "El nombre del banco es requerido."),
  currency: z.enum(['MXN', 'USD', 'EUR'], { required_error: "La divisa es requerida." }),
  initialBalance: z.coerce.number().default(0),
  creditDetails: creditDetailsSchema.optional(),
}).refine(data => {
    if (data.creditDetails?.hasCredit && (data.creditDetails.status === 'Aceptado' || data.creditDetails.status === 'Pendiente')) {
        return data.creditDetails.creditAmount !== undefined && data.creditDetails.creditAmount > 0;
    }
    return true;
}, {
    message: "El monto del crédito es requerido si el crédito está aceptado o pendiente.",
    path: ["creditDetails.creditAmount"],
});


const categorySchema = z.object({
  name: z.string().min(2, "El nombre de la categoría es requerido."),
  type: z.enum(['Ingreso', 'Egreso'], { required_error: "El tipo es requerido." }),
});

const currencies = ['MXN', 'USD', 'EUR'];

// --- Form Components ---
function CompanyForm({ onAddCompany }: { onAddCompany: (data: Company) => void }) {
  const form = useForm<z.infer<typeof companySchema>>({ 
      resolver: zodResolver(companySchema), 
      defaultValues: { name: '', taxes: [] } 
  });
  const { toast } = useToast();

  const { fields: taxFields, append: appendTax, remove: removeTax } = useFieldArray({
    control: form.control,
    name: "taxes",
  });

  const onSubmit = (data: z.infer<typeof companySchema>) => {
    onAddCompany({ 
        id: `comp-${Date.now()}`, 
        name: data.name,
        taxes: data.taxes || [],
    });
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
        
        <div>
            <FormLabel>Impuestos Aplicables</FormLabel>
            <FormDescription className="text-xs mb-2">Añada los impuestos que esta empresa debe pagar.</FormDescription>
            <div className="space-y-3">
              {taxFields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md">
                    <FormField
                        control={form.control}
                        name={`taxes.${index}.name`}
                        render={({ field }) => (
                            <FormItem className="flex-grow">
                                <FormLabel className="text-xs">Nombre</FormLabel>
                                <FormControl><Input placeholder="Ej. ISR" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name={`taxes.${index}.rate`}
                        render={({ field }) => (
                           <FormItem>
                               <FormLabel className="text-xs">Tasa (%)</FormLabel>
                               <FormControl><Input type="number" placeholder="30" {...field} /></FormControl>
                               <FormMessage />
                           </FormItem>
                        )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeTax(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendTax({ id: `tax-${Date.now()}`, name: '', rate: 0 })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Impuesto
              </Button>
            </div>
        </div>

        <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" />Añadir Empresa</Button>
      </form>
    </Form>
  );
}

function BankAccountForm({ companies, onAddAccount }: { companies: Company[], onAddAccount: (data: BankAccount) => void }) {
  const form = useForm<z.infer<typeof bankAccountSchema>>({ 
      resolver: zodResolver(bankAccountSchema), 
      defaultValues: { 
          companyId: '', 
          bankName: '', 
          currency: undefined, 
          initialBalance: 0,
          creditDetails: {
              hasCredit: false,
              status: 'No Ofrecido',
          }
      } 
  });
  const { toast } = useToast();
  const hasCredit = form.watch("creditDetails.hasCredit");

  const onSubmit = (data: z.infer<typeof bankAccountSchema>) => {
    onAddAccount({ 
        id: `acc-${Date.now()}`, 
        companyId: data.companyId, 
        bankName: data.bankName, 
        currency: data.currency,
        balance: data.initialBalance,
        creditDetails: data.creditDetails
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
                  {currencies.map((currencyCode) => (
                    <SelectItem key={currencyCode} value={currencyCode}>
                      {currencyCode}
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
        
        <FormField
            control={form.control}
            name="creditDetails.hasCredit"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>¿Se ofreció un crédito?</FormLabel>
                    </div>
                    <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                </FormItem>
            )}
        />
        {hasCredit && (
            <div className="space-y-4 rounded-md border p-4">
                 <FormField
                    control={form.control}
                    name="creditDetails.status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Estado del Crédito</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                                    <SelectItem value="Aceptado">Aceptado</SelectItem>
                                    <SelectItem value="Rechazado">Rechazado</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField control={form.control} name="creditDetails.creditAmount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto del Crédito</FormLabel>
                    <FormControl><Input type="number" {...field} placeholder="50000" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="creditDetails.paymentPlan" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan de Pago</FormLabel>
                    <FormControl><Textarea {...field} placeholder="Describa cómo se pagará el crédito..." /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
            </div>
        )}

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

const CreditStatusBadge = ({ status }: { status: CreditDetails['status'] | undefined }) => {
    if (!status || status === 'No Ofrecido') {
        return <span className="text-muted-foreground">N/A</span>;
    }
    const variants = {
        'Pendiente': 'secondary',
        'Aceptado': 'default',
        'Rechazado': 'destructive',
    } as const;

    return <Badge variant={variants[status]}>{status}</Badge>;
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
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Impuestos</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.length > 0 ? companies.map(c => (
                        <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell>
                                {c.taxes && c.taxes.length > 0
                                    ? c.taxes.map(t => `${t.name} (${t.rate}%)`).join(', ')
                                    : 'N/A'
                                }
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => deleteCompany(c.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                      )) : <TableRow><TableCell colSpan={3} className="text-center h-24">No hay empresas registradas.</TableCell></TableRow>}
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
                            <TableHeader><TableRow><TableHead>Banco</TableHead><TableHead>Empresa</TableHead><TableHead>Divisa</TableHead><TableHead>Crédito</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {bankAccounts.length > 0 ? bankAccounts.map(a => (
                                    <TableRow key={a.id}>
                                        <TableCell>{a.bankName}</TableCell>
                                        <TableCell>{companies.find(c => c.id === a.companyId)?.name}</TableCell>
                                        <TableCell>{a.currency}</TableCell>
                                        <TableCell>
                                            <CreditStatusBadge status={a.creditDetails?.status} />
                                        </TableCell>
                                        <TableCell className="text-right">{a.balance.toLocaleString('en-US', { style: 'currency', currency: a.currency })}</TableCell>
                                        <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => deleteAccount(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={6} className="text-center h-24">No hay cuentas registradas.</TableCell></TableRow>}
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
