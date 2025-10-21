
"use client";

import React, { useState, type FormEvent } from "react";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlusCircle,
  Landmark,
  Receipt,
  DollarSign,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

type Transaction = {
    id: string;
    type: 'income' | 'expense';
    description: string;
    amount: number;
    date: string;
};

type Bank = {
    id: string;
    name: string;
    balance: number;
    transactions: Transaction[];
};

type Payable = {
    id: string;
    description: string;
    amount: number;
    status: 'pending' | 'paid';
};


export default function SettingsPage() {
    const [banks, setBanks] = useState<Bank[]>([]);
    const [newBankName, setNewBankName] = useState("");
    const [newBankBalance, setNewBankBalance] = useState("");
    const [bankToDelete, setBankToDelete] = useState<Bank | null>(null);

    const [payables, setPayables] = useState<Payable[]>([]);
    const [newPayableDesc, setNewPayableDesc] = useState("");
    const [newPayableAmount, setNewPayableAmount] = useState("");
    
    const [generalTransactions, setGeneralTransactions] = useState<Transaction[]>([]);
    const [newGeneralTransaction, setNewGeneralTransaction] = useState({ description: '', amount: '', type: 'income' as 'income' | 'expense' });


    const handleAddBank = (e: FormEvent) => {
        e.preventDefault();
        if (newBankName.trim() && newBankBalance) {
            const newBank: Bank = {
                id: `bank-${Date.now()}`,
                name: newBankName.trim(),
                balance: parseFloat(newBankBalance),
                transactions: [],
            };
            setBanks([...banks, newBank]);
            setNewBankName("");
            setNewBankBalance("");
        }
    };
    
    const handleAddTransactionToBank = (bankId: string, type: 'income' | 'expense') => {
        const amount = parseFloat(prompt(`Ingrese el monto del ${type === 'income' ? 'ingreso' : 'egreso'}:`) || '0');
        const description = prompt(`Descripción del ${type === 'income' ? 'ingreso' : 'egreso'}:`) || 'Sin descripción';
        
        if (amount > 0 && description) {
            setBanks(banks.map(bank => {
                if (bank.id === bankId) {
                    const newTransaction: Transaction = {
                        id: `tx-${Date.now()}`,
                        type,
                        description,
                        amount,
                        date: new Date().toLocaleDateString('es-ES')
                    };
                    const newBalance = type === 'income' ? bank.balance + amount : bank.balance - amount;
                    return {
                        ...bank,
                        balance: newBalance,
                        transactions: [...bank.transactions, newTransaction],
                    };
                }
                return bank;
            }));
        }
    };

    const handleDeleteBank = () => {
        if (bankToDelete) {
            setBanks(banks.filter(bank => bank.id !== bankToDelete.id));
            setBankToDelete(null);
        }
    };
    
    const handleAddPayable = (e: FormEvent) => {
        e.preventDefault();
        if (newPayableDesc.trim() && newPayableAmount) {
            const newPayable: Payable = {
                id: `payable-${Date.now()}`,
                description: newPayableDesc,
                amount: parseFloat(newPayableAmount),
                status: 'pending',
            };
            setPayables([...payables, newPayable]);
            setNewPayableDesc("");
            setNewPayableAmount("");
        }
    };

    const handleMarkAsPaid = (payableId: string) => {
        setPayables(payables.map(p => p.id === payableId ? { ...p, status: 'paid' } : p));
    };

    const handleAddGeneralTransaction = (e: FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(newGeneralTransaction.amount);
        if (newGeneralTransaction.description && amount > 0) {
            const newTx: Transaction = {
                id: `gen-tx-${Date.now()}`,
                type: newGeneralTransaction.type,
                description: newGeneralTransaction.description,
                amount: amount,
                date: new Date().toLocaleDateString('es-ES')
            };
            setGeneralTransactions([newTx, ...generalTransactions]);
            setNewGeneralTransaction({ description: '', amount: '', type: 'income' });
        }
    };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Finanzas"
        description="Gestiona la configuración financiera y los recursos del sistema."
      />
      <main className="flex-1 p-4 md:p-8">
        <Tabs defaultValue="banks" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="banks">
                    <Landmark className="mr-2 h-4 w-4" />
                    Gestión de Bancos
                </TabsTrigger>
                <TabsTrigger value="expenses">
                    <Receipt className="mr-2 h-4 w-4" />
                    Registro de Gastos
                </TabsTrigger>
            </TabsList>

            <TabsContent value="banks" className="mt-6">
                <div className="grid lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Añadir Nuevo Banco</CardTitle>
                            <CardDescription>Registre una nueva cuenta bancaria para gestionar sus fondos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddBank} className="space-y-4">
                                <div>
                                    <Label htmlFor="bank-name">Nombre del Banco</Label>
                                    <Input id="bank-name" value={newBankName} onChange={e => setNewBankName(e.target.value)} placeholder="Ej. Banco Principal" />
                                </div>
                                <div>
                                    <Label htmlFor="bank-balance">Saldo Inicial</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="bank-balance" type="number" value={newBankBalance} onChange={e => setNewBankBalance(e.target.value)} placeholder="0.00" className="pl-8" />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full"><PlusCircle className="mr-2 h-4 w-4" />Añadir Banco</Button>
                            </form>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Bancos Registrados</CardTitle>
                            <CardDescription>Resumen de sus cuentas bancarias y saldos.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                            {banks.length > 0 ? banks.map(bank => (
                                <div key={bank.id} className="p-4 border rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-semibold flex items-center gap-2"><Banknote className="h-5 w-5 text-accent"/>{bank.name}</h4>
                                            <p className="text-2xl font-bold">${bank.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setBankToDelete(bank)}><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleAddTransactionToBank(bank.id, 'income')}><ArrowUpCircle className="mr-2"/>Ingreso</Button>
                                        <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleAddTransactionToBank(bank.id, 'expense')}><ArrowDownCircle className="mr-2"/>Egreso</Button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-muted-foreground text-center py-8">No hay bancos registrados.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="expenses" className="mt-6">
               <div className="grid lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cuentas por Pagar</CardTitle>
                            <CardDescription>Añada y gestione sus gastos recurrentes o fijos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddPayable} className="space-y-4">
                                <div>
                                    <Label htmlFor="payable-desc">Descripción del Gasto</Label>
                                    <Input id="payable-desc" value={newPayableDesc} onChange={e => setNewPayableDesc(e.target.value)} placeholder="Ej. Renta, Salarios, Luz" />
                                </div>
                                <div>
                                    <Label htmlFor="payable-amount">Monto</Label>
                                     <div className="relative">
                                         <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                         <Input id="payable-amount" type="number" value={newPayableAmount} onChange={e => setNewPayableAmount(e.target.value)} placeholder="0.00" className="pl-8" />
                                     </div>
                                </div>
                                <Button type="submit" className="w-full"><PlusCircle className="mr-2 h-4 w-4"/>Añadir Gasto a Pagar</Button>
                            </form>
                            <div className="space-y-2 pt-4 mt-4 border-t">
                                <h4 className="text-sm font-medium">Lista de Gastos</h4>
                                <div className="border rounded-md p-2 space-y-2 max-h-48 overflow-y-auto">
                                    {payables.length > 0 ? payables.map(p => (
                                        <div key={p.id} className="text-sm flex justify-between items-center p-2 bg-background rounded-md">
                                            <div>
                                                <p className="font-medium">{p.description}</p>
                                                <p className="text-muted-foreground">${p.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            </div>
                                            {p.status === 'pending' ? (
                                                <Button size="xs" variant="outline" onClick={() => handleMarkAsPaid(p.id)}>Marcar como Pagado</Button>
                                            ) : (
                                                <Badge variant="default" className="bg-green-100 text-green-800">Pagado</Badge>
                                            )}
                                        </div>
                                    )) : <p className="text-muted-foreground text-center py-4">No hay gastos por pagar.</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Ingresos y Egresos Generales</CardTitle>
                            <CardDescription>Registre transacciones que no están asociadas a un banco específico.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddGeneralTransaction} className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                     <Button type="button" variant={newGeneralTransaction.type === 'income' ? 'default' : 'outline'} onClick={() => setNewGeneralTransaction(prev => ({...prev, type: 'income'}))}>Ingreso</Button>
                                     <Button type="button" variant={newGeneralTransaction.type === 'expense' ? 'destructive' : 'outline'} onClick={() => setNewGeneralTransaction(prev => ({...prev, type: 'expense'}))}>Egreso</Button>
                                </div>
                                <div>
                                    <Label htmlFor="gen-tx-desc">Descripción</Label>
                                    <Input id="gen-tx-desc" value={newGeneralTransaction.description} onChange={e => setNewGeneralTransaction(prev => ({...prev, description: e.target.value}))} placeholder="Ej. Venta de activos" />
                                </div>
                                <div>
                                    <Label htmlFor="gen-tx-amount">Monto</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="gen-tx-amount" type="number" value={newGeneralTransaction.amount} onChange={e => setNewGeneralTransaction(prev => ({...prev, amount: e.target.value}))} placeholder="0.00" className="pl-8" />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full"><PlusCircle className="mr-2"/>Registrar Transacción</Button>
                            </form>
                             <div className="space-y-2 pt-4 mt-4 border-t">
                                <h4 className="text-sm font-medium">Historial General</h4>
                                <div className="border rounded-md p-2 space-y-2 max-h-48 overflow-y-auto">
                                   {generalTransactions.length > 0 ? generalTransactions.map(tx => (
                                        <div key={tx.id} className="text-xs flex justify-between items-center p-1 bg-background rounded">
                                            <div>
                                                <p className="text-muted-foreground">{tx.description}</p>
                                                <p className="text-xs text-muted-foreground/80">{tx.date}</p>
                                            </div>
                                            <p className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    )) : <p className="text-muted-foreground text-center py-4">No hay transacciones generales.</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
               </div>
            </TabsContent>
        </Tabs>

        <AlertDialog open={!!bankToDelete} onOpenChange={() => setBankToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. ¿Está seguro de que desea eliminar el banco "{bankToDelete?.name}"? Se perderá el saldo y el historial de transacciones.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteBank} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
