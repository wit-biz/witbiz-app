
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { Loader2, Save, FileText, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCRMData } from '@/contexts/CRMDataContext';
import { type Document, type DocumentType } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AIProposalModal } from './AIProposalModal';

const documentTypes: DocumentType[] = ["Contrato", "Factura", "Propuesta", "Informe", "Otro", "Descargable"];

const documentSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  type: z.enum(documentTypes as [DocumentType, ...DocumentType[]]),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

interface EditDocumentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document;
}

export function EditDocumentDialog({ isOpen, onOpenChange, document }: EditDocumentDialogProps) {
  const { toast } = useToast();
  const { updateDocument, clients } = useCRMData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
  });

  useEffect(() => {
    if (document && isOpen) {
      form.reset({
        name: document.name,
        type: document.type,
      });
    }
  }, [document, isOpen, form]);

  const onSubmit = async (values: DocumentFormValues) => {
    setIsSubmitting(true);
    const success = await updateDocument(document.id, values as any);
    setIsSubmitting(false);

    if (success) {
      toast({ title: "Documento Actualizado", description: "La información del documento ha sido actualizada." });
      onOpenChange(false);
    }
    // Error toast is handled inside updateDocument
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  Editar Información del Documento
                </DialogTitle>
                <DialogDescription>
                  Modifique el nombre y el tipo del documento.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Documento</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Documento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                          <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              {documentTypes.map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isSubmitting}>
                    Cancelar
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSubmitting}
                  onClick={() => setIsAIModalOpen(true)}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analizar con IA
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AIProposalModal
        isOpen={isAIModalOpen}
        onOpenChange={setIsAIModalOpen}
        documents={[{ id: document.id, name: document.name }]}
        clients={clients}
        onProposalApplied={() => {
          setIsAIModalOpen(false);
        }}
      />
    </>
  );
}
