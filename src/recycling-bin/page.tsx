
"use client";

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Trash2, Users, ListTodo, FileText, History, Briefcase, StickyNote } from 'lucide-react';
import { useCRMData } from '@/contexts/CRMDataContext';
import { formatDateString } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { subDays, isBefore } from 'date-fns';
import { Task, ServiceWorkflow, Note, AppUser, Client, Promoter, Supplier } from '@/lib/types';
import { Badge } from '@/components/ui/badge';


type EntityType = 'client' | 'task' | 'document' | 'promoter' | 'supplier' | 'service' | 'note' | 'user';

type ContactEntityType = 'client' | 'user' | 'promoter' | 'supplier';

type EntityToDelete = {
  id: string;
  name: string;
  type: EntityType;
};

type ArchivedContact = (Client | AppUser | Promoter | Supplier) & { contactType: ContactEntityType };


export default function RecyclingBinPage() {
  const { toast } = useToast();
  const {
    clients, isLoadingClients, restoreClient, deleteClient,
    tasks, isLoadingTasks, restoreTask, deleteTask,
    documents, isLoadingDocuments, restoreDocument, deleteDocument,
    promoters, isLoadingPromoters, restorePromoter, deletePromoter,
    suppliers, isLoadingSuppliers, restoreSupplier, deleteSupplier,
    serviceWorkflows, isLoadingWorkflows, restoreService, deleteService,
    notes, isLoadingNotes, restoreNote, deleteNote,
    teamMembers, isLoadingTeamMembers, restoreUser, deleteUser,
  } = useCRMData();

  const [entityToDelete, setEntityToDelete] = useState<EntityToDelete | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const archivedContacts = useMemo(() => {
    const allContacts: ArchivedContact[] = [];
    (clients || []).filter(c => c.status === 'Archivado').forEach(c => allContacts.push({ ...c, contactType: 'client' }));
    (teamMembers || []).filter(u => u.status === 'Archivado').forEach(u => allContacts.push({ ...u, contactType: 'user' }));
    (promoters || []).filter(p => p.status === 'Archivado').forEach(p => allContacts.push({ ...p, contactType: 'promoter' }));
    (suppliers || []).filter(s => s.status === 'Archivado').forEach(s => allContacts.push({ ...s, contactType: 'supplier' }));
    return allContacts.sort((a,b) => (b.archivedAt?.toMillis() || 0) - (a.archivedAt?.toMillis() || 0));
  }, [clients, teamMembers, promoters, suppliers]);

  const isLoadingContacts = isLoadingClients || isLoadingTeamMembers || isLoadingPromoters || isLoadingSuppliers;
  
  const archivedTasks = useMemo(() => (tasks || []).filter(t => t.status === 'Archivado'), [tasks]);
  const archivedDocuments = useMemo(() => (documents || []).filter(d => d.status === 'Archivado'), [documents]);
  const archivedServices = useMemo(() => (serviceWorkflows || []).filter(s => s.status === 'Archivado'), [serviceWorkflows]);
  const archivedNotes = useMemo(() => (notes || []).filter(n => n.status === 'Archivado'), [notes]);
  
  const oneMonthAgo = subDays(new Date(), 30);

  const handleRestore = async (id: string, type: EntityType) => {
    setIsProcessing(true);
    let success = false;
    if (type === 'client') success = await restoreClient(id);
    else if (type === 'task') success = await restoreTask(id);
    else if (type === 'document') success = await restoreDocument(id);
    else if (type === 'promoter') success = await restorePromoter(id);
    else if (type === 'supplier') success = await restoreSupplier(id);
    else if (type === 'service') success = await restoreService(id);
    else if (type === 'note') success = await restoreNote(id);
    else if (type === 'user') success = await restoreUser(id);
    
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
    else if (type === 'service') success = await deleteService(id, true);
    else if (type === 'note') success = await deleteNote(id, true);
    else if (type === 'user') success = await deleteUser(id, true);


    if (success) {
      toast({ title: "Elemento Eliminado", description: "El elemento ha sido eliminado permanentemente." });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el elemento.' });
    }
    setEntityToDelete(null);
    setIsProcessing(false);
  };
  
  const getContactTypeLabel = (type: ContactEntityType) => {
      switch(type) {
          case 'client': return 'Cliente';
          case 'user': return 'Usuario';
          case 'promoter': return 'Promotor';
          case 'supplier': return 'Proveedor';
          default: return 'Contacto';
      }
  }

  const tabs = [
    { type: 'contact' as const, icon: Users, label: 'Contactos', data: archivedContacts, isLoading: isLoadingContacts },
    { type: 'task' as const, icon: ListTodo, label: 'Tareas', data: archivedTasks, isLoading: isLoadingTasks },
    { type: 'document' as const, icon: FileText, label: 'Documentos', data: archivedDocuments, isLoading: isLoadingDocuments },
    { type: 'service' as const, icon: Briefcase, label: 'Servicios', data: archivedServices, isLoading: isLoadingWorkflows },
    { type: 'note' as const, icon: StickyNote, label: 'Notas', data: archivedNotes, isLoading: isLoadingNotes },
  ];
  
  const getItemName = (item: any, type: EntityType) => {
    if (type === 'task') return (item as Task).title;
    if (type === 'note') return (item as Note).text.substring(0, 50) + '...';
    if (type === 'user') return (item as AppUser).name;
    return item.name;
  }

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
                    <Tabs defaultValue="contact" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-6">
                            {tabs.map(tab => (
                                <TabsTrigger key={tab.type} value={tab.type}>
                                    <tab.icon className="mr-2 h-4 w-4"/>
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <TabsContent value="contact">
                             {isLoadingContacts ? (
                                <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead>Fecha de Archivado</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {archivedContacts.length > 0 ? archivedContacts.map(item => {
                                            const archivedDate = item.archivedAt?.toDate();
                                            const isExpired = archivedDate ? isBefore(archivedDate, oneMonthAgo) : false;
                                            return (
                                            <TableRow key={`${item.contactType}-${item.id}`} className={isExpired ? 'bg-destructive/10' : ''}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell><Badge variant="secondary">{getContactTypeLabel(item.contactType)}</Badge></TableCell>
                                                <TableCell>{archivedDate ? formatDateString(archivedDate) : 'N/A'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleRestore(item.id, item.contactType)} disabled={isProcessing}>
                                                        <History className="mr-2 h-4 w-4"/> Restaurar
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setEntityToDelete({ id: item.id, name: item.name, type: item.contactType })} disabled={isProcessing}>
                                                        <Trash2 className="mr-2 h-4 w-4"/> Borrar
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )}) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center h-24">La papelera para contactos está vacía.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </TabsContent>

                        {tabs.filter(t => t.type !== 'contact').map(tab => (
                             <TabsContent key={tab.type} value={tab.type}>
                                {tab.isLoading ? (
                                    <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nombre / Título / Contenido</TableHead>
                                                <TableHead>Fecha de Archivado</TableHead>
                                                <TableHead className="text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tab.data && tab.data.length > 0 ? tab.data.map(item => {
                                                const archivedDate = item.archivedAt?.toDate();
                                                const isExpired = archivedDate ? isBefore(archivedDate, oneMonthAgo) : false;
                                                const name = getItemName(item, tab.type);
                                                return (
                                                <TableRow key={item.id} className={isExpired ? 'bg-destructive/10' : ''}>
                                                    <TableCell className="font-medium">{name}</TableCell>
                                                    <TableCell>{archivedDate ? formatDateString(archivedDate) : 'N/A'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => handleRestore(item.id, tab.type)} disabled={isProcessing}>
                                                          <History className="mr-2 h-4 w-4"/> Restaurar
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setEntityToDelete({ id: item.id, name: name, type: tab.type as EntityType })} disabled={isProcessing}>
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
