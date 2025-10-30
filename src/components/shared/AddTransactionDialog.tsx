
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useDropzone } from 'react-dropzone';
import { Loader2, Save, Calendar as CalendarIcon, UploadCloud, File as FileIcon, X, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const transactionSchema = z.object({
    type: z.enum(['income', 'expense', 'transfer']),
    description: z.string().min(3, "La descripción es requerida."),
    amount: z.coerce.number().positive("El monto debe ser un número positivo."),
    date: z.date({ required_error: "La fecha es requerida." }),
    categoryId: z.string().min(1, "La categoría es requerida."),
    companyId: z.string().min(1, "La empresa es requerida."),
    accountId: z.string().min(1, "La cuenta de origen es requerida."),
    destinationAccountId: z.string().optional(),
    attachment: z.instanceof(File).optional(),
}).refine(data => {
    if (data.type === 'transfer') {
        return !!data.destinationAccountId;
    }
    return true;
}, {
    message: "La cuenta de destino es requerida para transferencias.",
    path: ["destinationAccountId"],
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface AddTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  companies: { id: string; name: string }[];
  accounts: { id: string; companyId: string; bankName: string }[];
  categories: { id: string; name: string, type: string }[];
  onTransactionAdd: (data: TransactionFormValues) => void;
}

export function AddTransactionDialog({
  isOpen,
  onOpenChange,
  companies,
  accounts,
  categories,
  onTransactionAdd,
}: AddTransactionDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      date: new Date(),
    },
  });

  const transactionType = form.watch('type');
  const selectedCompanyId = form.watch('companyId');

  const filteredAccounts = accounts.filter(acc => acc.companyId === selectedCompanyId);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      form.setValue('attachment', acceptedFiles[0]);
    }
  }, [form]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: { 'application/pdf': [], 'image/*': [] },
  });
  
  const attachment = form.watch('attachment');

  const onSubmit = (data: TransactionFormValues) => {
    setIsSubmitting(true);
    console.log(data);
    // Simulate API call
    setTimeout(() => {
      onTransactionAdd(data);
      toast({
        title: "Transacción Registrada",
        description: "El movimiento ha sido guardado correctamente.",
      });
      setIsSubmitting(false);
      onOpenChange(false);
      form.reset({ type: 'expense', date: new Date() });
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ArrowRightLeft className="h-5 w-5 text-accent"/>Registrar Transacción</DialogTitle>
          <DialogDescription>
            Añada un nuevo ingreso, egreso o transferencia interna.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-grow overflow-y-auto pr-2 pl-1 space-y-4">
            <Controller
                name="type"
                control={form.control}
                render={({ field }) => (
                     <div>
                        <Label>Tipo de Transacción</Label>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="expense">Egreso</SelectItem>
                                <SelectItem value="income">Ingreso</SelectItem>
                                <SelectItem value="transfer">Transferencia Interna</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            />
            
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" {...form.register('description')} />
              {form.formState.errors.description && <p className="text-sm text-red-500 mt-1">{form.formState.errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Monto</Label>
                <Input id="amount" type="number" step="0.01" {...form.register('amount')} />
                {form.formState.errors.amount && <p className="text-sm text-red-500 mt-1">{form.formState.errors.amount.message}</p>}
              </div>
              <div>
                <Label>Fecha</Label>
                 <Controller
                    name="date"
                    control={form.control}
                    render={({ field }) => (
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Seleccione fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                        </Popover>
                    )}
                 />
              </div>
            </div>

            <div>
                <Label>Empresa</Label>
                 <Controller
                    name="companyId"
                    control={form.control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger><SelectValue placeholder="Seleccione una empresa..." /></SelectTrigger>
                            <SelectContent>
                                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                />
                 {form.formState.errors.companyId && <p className="text-sm text-red-500 mt-1">{form.formState.errors.companyId.message}</p>}
            </div>

            <div className={cn("grid gap-4", transactionType === 'transfer' ? 'grid-cols-2' : 'grid-cols-1')}>
                 <div>
                    <Label>{transactionType === 'transfer' ? 'Cuenta de Origen' : 'Cuenta'}</Label>
                     <Controller
                        name="accountId"
                        control={form.control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCompanyId}>
                                <SelectTrigger><SelectValue placeholder="Seleccione una cuenta..." /></SelectTrigger>
                                <SelectContent>
                                    {filteredAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.bankName}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    />
                     {form.formState.errors.accountId && <p className="text-sm text-red-500 mt-1">{form.formState.errors.accountId.message}</p>}
                </div>
                {transactionType === 'transfer' && (
                    <div>
                        <Label>Cuenta de Destino</Label>
                         <Controller
                            name="destinationAccountId"
                            control={form.control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Seleccione cuenta destino..." /></SelectTrigger>
                                    <SelectContent>
                                        {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{`${acc.companyName} - ${acc.bankName}`}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {form.formState.errors.destinationAccountId && <p className="text-sm text-red-500 mt-1">{form.formState.errors.destinationAccountId.message}</p>}
                    </div>
                )}
            </div>

            {transactionType !== 'transfer' && (
                <div>
                    <Label>Categoría</Label>
                     <Controller
                        name="categoryId"
                        control={form.control}
                        render={({ field }) => (
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger><SelectValue placeholder="Seleccione una categoría..." /></SelectTrigger>
                                <SelectContent>
                                    {categories.filter(c => c.type === (transactionType === 'income' ? 'Ingreso' : 'Egreso')).map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {form.formState.errors.categoryId && <p className="text-sm text-red-500 mt-1">{form.formState.errors.categoryId.message}</p>}
                </div>
            )}
            
            <div>
              <Label>Comprobante (Opcional)</Label>
              {!attachment ? (
              <div {...getRootProps()} className={`mt-1 w-full h-28 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                <input {...getInputProps()} />
                <UploadCloud className="h-8 w-8 text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">{isDragActive ? 'Suelte el archivo aquí...' : 'Arrastre un archivo o haga clic para seleccionar'}</p>
              </div>
            ) : (
              <div className="mt-1 p-2 border rounded-md bg-secondary/50 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <FileIcon className="h-5 w-5 text-accent flex-shrink-0" />
                  <span className="truncate font-medium text-xs">{attachment.name}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => form.setValue('attachment', undefined)}><X className="h-4 w-4" /></Button>
              </div>
            )}
            </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
          </DialogClose>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
            Guardar Transacción
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    