
"use client";

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Trash2, Users, ListTodo, FileText, UserCheck, Truck, History } from 'lucide-react';
import { useCRMData } from '@/contexts/CRMDataContext';
import { formatDateString } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { subDays, isBefore } from 'date-fns';

type EntityType = 'client' | 'task' | 'document' | 'promoter' | 'supplier';

type EntityToDelete = {
  id: string;
  name: string;
  type: EntityType;
};

export default function RecyclingBinPage() {
  const { toast } = useToast();
  const {
    clients, isLoadingClients, restoreClient, deleteClient,
    tasks, isLoadingTasks, restoreTask, deleteTask,
    documents, isLoadingDocuments, restoreDocument, deleteDocument,
    promoters, isLoadingPromoters, restorePromoter, deletePromoter,
    suppliers, isLoadingSuppliers, restoreSupplier, deleteSupplier,
  } = useCRMData();

  const [entityToDelete, setEntityToDelete] = useState<EntityToDelete | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const archivedClients = useMemo(() => clients.filter(c => c.status === 'Archivado'), [clients]);
  const archivedTasks = useMemo(() => tasks.filter(t => t.status === 'Archivado'), [tasks]);
  const archivedDocuments = useMemo(() => documents.filter(d => d.status === 'Archivado'), [documents]);
  const archivedPromoters = useMemo(() => promoters.filter(p => p.status === 'Archivado'), [promoters]);
  const archivedSuppliers = useMemo(() => suppliers.filter(s => s.status === 'Archivado'), [suppliers]);
  
  const oneMonthAgo = subDays(new Date(), 30);

  const handleRestore = async (id: string, type: EntityType) => {
    setIsProcessing(true);
    let success = false;
    if (type === 'client') success = await restoreClient(id);
    else if (type === 'task') success = await restoreTask(id);
    else if (type === 'document') success = await restoreDocument(id);
    else if (type === 'promoter') success = await restorePromoter(id);
    else if (type === 'supplier') success = await restoreSupplier(id);
    
    if (success) {
        toast({ title: "Elemento Restaurado", description: "El elemento ha vuelto a su estado activo." });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo restaurar el elemento.' });
    }
    setIsProcessing(false);
  };
  
  const confirmDelete = async () => {
    if (!entityToDelete) return;
    setIsProcessing(true);
    let success = false;
    const { id, type } = entityToDelete;
    
    if (type === 'client') success = await deleteClient(id, true);
    else if (type === 'task') success = await deleteTask(id, true);
    else if (type === 'document') success = await deleteDocument(id, true);
    else if (type === 'promoter') success = await deletePromoter(id, true);
    else if (type === 'supplier') success = await deleteSupplier(id, true);

    if (success) {
      toast({ title: "Elemento Eliminado", description: "El elemento ha sido eliminado permanentemente." });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el elemento.' });
    }
    setEntityToDelete(null);
    setIsProcessing(false);
  };

  const tabs = [
    { type: 'client' as EntityType, icon: Users, label: 'Clientes', data: archivedClients, isLoading: isLoadingClients },
    { type: 'promoter' as EntityType, icon: UserCheck, label: 'Promotores', data: archivedPromoters, isLoading: isLoadingPromoters },
    { type: 'supplier' as EntityType, icon: Truck, label: 'Proveedores', data: archivedSuppliers, isLoading: isLoadingSuppliers },
    { type: 'task' as EntityType, icon: ListTodo, label: 'Tareas', data: archivedTasks, isLoading: isLoadingTasks },
    { type: 'document' as EntityType, icon: FileText, label: 'Documentos', data: archivedDocuments, isLoading: isLoadingDocuments },
  ];

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header 
          title="Papelera de Reciclaje"
          description="Elementos eliminados que pueden ser restaurados o borrados permanentemente."
        />
        <main className="flex-1 p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Contenido Archivado</CardTitle>
                    <CardDescription>
                        Los elementos se eliminarán permanentemente después de 30 días en la papelera.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="client" className="w-full">
                        <TabsList className="grid w-full grid-cols-5 mb-6">
                            {tabs.map(tab => (
                                <TabsTrigger key={tab.type} value={tab.type}>
                                    <tab.icon className="mr-2 h-4 w-4"/>
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {tabs.map(tab => (
                             <TabsContent key={tab.type} value={tab.type}>
                                {tab.isLoading ? (
                                    <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nombre / Título</TableHead>
                                                <TableHead>Fecha de Archivado</TableHead>
                                                <TableHead className="text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tab.data.length > 0 ? tab.data.map(item => {
                                                const archivedDate = item.archivedAt?.toDate();
                                                const isExpired = archivedDate ? isBefore(archivedDate, oneMonthAgo) : false;
                                                return (
                                                <TableRow key={item.id} className={isExpired ? 'bg-destructive/10' : ''}>
                                                    <TableCell className="font-medium">{item.name || (item as Task).title}</TableCell>
                                                    <TableCell>{archivedDate ? formatDateString(archivedDate) : 'N/A'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => handleRestore(item.id, tab.type)} disabled={isProcessing}>
                                                          <History className="mr-2 h-4 w-4"/> Restaurar
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setEntityToDelete({ id: item.id, name: item.name || (item as Task).title, type: tab.type })} disabled={isProcessing}>
                                                          <Trash2 className="mr-2 h-4 w-4"/> Borrar
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )}) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center h-24">La papelera para {tab.label.toLowerCase()} está vacía.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>
        </main>
      </div>

       <AlertDialog open={!!entityToDelete} onOpenChange={() => setEntityToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar Permanentemente?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. ¿Está seguro de que desea eliminar permanentemente "{entityToDelete?.name}"?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setEntityToDelete(null)} disabled={isProcessing}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} disabled={isProcessing} className="bg-destructive hover:bg-destructive/90">
                {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...</> : "Eliminar Permanentemente"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
