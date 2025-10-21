
"use client";

import React, { useState, useMemo, type ChangeEvent, type FormEvent, useEffect, useCallback, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Button, buttonVariants } from "@/components/ui/button";
import { PlusCircle, Users, Save, UserCircle, Briefcase, Mail, Phone, FileText as FileTextIcon, FolderOpen, Edit3, Trash2, Loader2, Download, ListChecks, MessageSquare, CalendarDays, Workflow, Globe, Target, Check, AlertCircle, UploadCloud } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import type { Client, Task, Document, Note, Booking, WorkflowStage, WorkflowStageObjective } from '@/lib/types';
import { useGlobalNotification } from "@/contexts/NotificationContext";
import { useDialogs } from "@/contexts/DialogsContext";
import { useCRMData } from "@/contexts/CRMDataContext";

const documentTypes = ["Contrato", "Factura", "Propuesta", "Informe", "Otro"];

const DetailItem = ({ icon: Icon, label, value, children }: { icon?: React.ElementType; label: string; value?: string | null | undefined; children?: ReactNode }) => {
  if (!value && !children && value !== "") return null;
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="h-3 w-3 text-muted-foreground mt-1 flex-shrink-0" />}
      <div className={!Icon ? "ml-[calc(0.75rem+0.75rem)]" : ""}>
        <p className="text-sm text-muted-foreground">{label}</p>
        {value !== undefined && value !== null && <p className="font-medium break-words">{value || "N/A"}</p>}
        {children}
      </div>
    </div>
  );
};

export default function ClientsPage() {
  const { showNotification } = useGlobalNotification();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
      clients, isLoadingClients, updateClient, deleteClient, getClientById,
      tasks, getTasksByClientId,
      documents, getDocumentsByClientId,
      notes, isLoadingNotes, addNote,
      currentUser
  } = useCRMData();

  const { isAddClientDialogOpen, setIsAddClientDialogOpen } = useDialogs();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isClientDetailDialogOpen, setIsClientDetailDialogOpen] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editableClientData, setEditableClientData] = useState<Partial<Client>>({});
  const [isSubmittingClient, setIsSubmittingClient] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  
  const [activeTab, setActiveTab] = useState("details");

  const sortedClients = useMemo(() => { if (!clients) return []; return [...clients].sort((a, b) => a.name.localeCompare(b.name)); }, [clients]);
  
  const handleRowClick = useCallback((client: Client) => { setSelectedClient(client); setEditableClientData({ ...client }); setIsEditingClient(false); setActiveTab("details"); setIsClientDetailDialogOpen(true); }, []);

  useEffect(() => { const clientIdToOpen = searchParams.get('openClient'); if (clientIdToOpen && clients && clients.length > 0 && getClientById) { const client = getClientById(clientIdToOpen); if (client) { handleRowClick(client); } } }, [searchParams, clients, getClientById, router, handleRowClick]);
  
  const clientDocuments = useMemo(() => { if (!selectedClient) return []; return getDocumentsByClientId(selectedClient.id); }, [selectedClient, getDocumentsByClientId]);
  const clientTasks = useMemo(() => { if (!selectedClient) return []; return getTasksByClientId(selectedClient.id); }, [selectedClient, getTasksByClientId]);
  const clientNotes = useMemo(() => { if (!selectedClient) return []; return notes.filter(n => n.clientId === selectedClient.id); }, [selectedClient, notes]);
  
  const groupedClientDocuments = useMemo(() => { if (!clientDocuments) return {}; return clientDocuments.reduce((acc, doc) => { const typeKey = doc.type || "Otro"; if (!acc[typeKey]) { acc[typeKey] = []; } acc[typeKey].push(doc); return acc; }, {} as Record<string, Document[]>); }, [clientDocuments]);
  
  const handleEditableClientChange = useCallback((e: ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target; setEditableClientData(prev => prev ? { ...prev, [name]: value } : {}); }, []);

  const handleSaveChangesClient = useCallback(async () => {
    if (!editableClientData || !editableClientData.id || !editableClientData.name?.trim()) { showNotification("error", "Error", "Nombre de usuario inválido."); return; }
    setIsSubmittingClient(true);
    await updateClient(editableClientData.id, editableClientData);
    if (selectedClient && selectedClient.id === editableClientData.id) { setSelectedClient(prev => prev ? { ...prev, ...editableClientData } as Client : null); }
    setIsSubmittingClient(false);
    setIsEditingClient(false);
  }, [editableClientData, updateClient, selectedClient, showNotification]);

  const handleCancelEditClient = useCallback(() => { if (selectedClient) setEditableClientData({ ...selectedClient }); setIsEditingClient(false); }, [selectedClient]);
  const openDeleteClientConfirmation = useCallback((client: Client) => { setClientToDelete(client); setIsDeletingClient(true); }, []);

  const confirmDeleteClient = useCallback(async () => {
    if (!clientToDelete) return;
    setIsSubmittingClient(true);
    await deleteClient(clientToDelete.id);
    setIsSubmittingClient(false);
    setIsClientDetailDialogOpen(false); setSelectedClient(null); setIsDeletingClient(false); setClientToDelete(null);
  }, [clientToDelete, deleteClient]);

  const canCreateClient = currentUser?.permissions.donna.clients_create ?? false;
  const canEditClient = currentUser?.permissions.donna.clients_edit ?? false;
  const canDeleteClient = currentUser?.permissions.donna.clients_delete ?? false;
  const canCreateDocument = currentUser?.permissions.donna.documents_create ?? false;
  const canEditDocument = currentUser?.permissions.donna.documents_edit ?? false;
  const canDeleteDocument = currentUser?.permissions.donna.documents_delete ?? false;
  const canCreateTask = currentUser?.permissions.donna.tasks_create ?? false;
  const canCreateNote = currentUser?.permissions.donna.clients_edit ?? false; // Assuming notes are part of client editing
  const canEditNote = currentUser?.permissions.donna.clients_edit ?? false;
  const canDeleteNote = currentUser?.permissions.donna.clients_edit ?? false;
  
  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen">
      <Header title="Directorio de usuarios">
        {canCreateClient ? (
              <Button
                onClick={() => setIsAddClientDialogOpen(true)}
                className="w-full sm:w-auto"
                size="default"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Nuevo Usuario
              </Button>
            ) : null}
        </Header>
      <main className="flex-1 p-4 md:p-8">
      <Card>
        <CardHeader className="px-2 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-6">
            <CardTitle>Listado de Usuarios</CardTitle>
            <CardDescription>{(sortedClients && sortedClients.length > 0) ? `Mostrando ${sortedClients.length} usuario(s). Haga clic en una fila para ver los detalles.` : "Actualmente no hay usuarios registrados en el sistema."}</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pt-0 pb-2 sm:px-6 sm:pt-0 sm:pb-6">
            {isLoadingClients ? (
                <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
            ) : (sortedClients && sortedClients.length > 0) ? (
                <div className="relative w-full overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-full sm:w-1/2 px-2 py-3 sm:px-4">Nombre del Usuario</TableHead>
                                <TableHead className="hidden sm:table-cell w-1/4 px-2 py-3 sm:px-4">Propietario Asignado</TableHead>
                                <TableHead className="hidden sm:table-cell w-1/4 px-2 py-3 sm:px-4">Categoría Principal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedClients.map((client) => ( 
                                <TableRow key={client.id} onClick={() => handleRowClick(client)} className="cursor-pointer hover:bg-muted/50" role="link" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleRowClick(client); }} aria-label={`Ver detalles de ${client.name}`}>
                                    <TableCell className="font-medium truncate px-2 py-4 sm:px-4">{client.name}</TableCell>
                                    <TableCell className="hidden sm:table-cell truncate px-2 py-4 sm:px-4">{client.owner || "N/A"}</TableCell>
                                    <TableCell className="hidden sm:table-cell truncate px-2 py-4 sm:px-4">{client.category || "N/A"}</TableCell>
                                </TableRow> 
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : ( 
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12"> 
                    <Users className="h-16 w-16 mb-4 text-gray-400" /> 
                    <p className="text-lg font-semibold">No se encontraron usuarios.</p> 
                    {canCreateClient && ( <p className="text-sm mt-1"> Intente añadir un nuevo usuario utilizando el botón <span className="italic">"Añadir Nuevo Usuario"</span> de arriba. </p> )} 
                </div> 
            )}
        </CardContent>
      </Card>
      
      {selectedClient && editableClientData && (
        <Dialog open={isClientDetailDialogOpen} onOpenChange={(open) => { setIsClientDetailDialogOpen(open); if (!open) { setSelectedClient(null); setIsEditingClient(false); } }}>
          <DialogContent className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-4 pb-0 sm:p-6 sm:pb-0 flex-shrink-0"> 
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl break-words"> 
                <UserCircle className="h-5 w-5 text-accent" />
                Perfil del Usuario: {isEditingClient ? editableClientData.name : selectedClient.name} 
              </DialogTitle> 
            </DialogHeader>
            
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full px-2 pt-2 sm:px-4 flex-grow flex flex-col overflow-hidden min-h-0"
            >
              <ScrollArea className="w-full rounded-md flex-shrink-0" orientation="horizontal">
                <TabsList className="inline-flex whitespace-nowrap gap-1 p-1">
                  <TabsTrigger value="details" className="flex items-center gap-2"><Briefcase className="h-4 w-4"/>Detalles</TabsTrigger>
                  <TabsTrigger value="documents" className="flex items-center gap-2"><FolderOpen className="h-4 w-4"/>Documentos</TabsTrigger>
                  <TabsTrigger value="tasks" className="flex items-center gap-2"><ListChecks className="h-4 w-4"/>Tareas</TabsTrigger>
                  <TabsTrigger value="notes" className="flex items-center gap-2"><MessageSquare className="h-4 w-4"/>Notas</TabsTrigger>
                </TabsList>
                <ScrollBar orientation="horizontal" className="h-2 mt-1" />
              </ScrollArea>
              
              <ScrollArea className="flex-grow mt-4 min-h-0">
                <TabsContent value="details" className="min-h-0"><Card className="border-none shadow-none"><CardHeader className="px-0"><CardTitle className="flex items-center gap-2 text-lg"><Briefcase className="h-4 w-4 text-accent" /> Información del Usuario </CardTitle></CardHeader><CardContent className="space-y-4 text-sm px-0">{isEditingClient ? ( <> <div> <Label htmlFor="edit-client-name" className="mb-1 block font-semibold text-muted-foreground">Nombre <span className="text-destructive">*</span></Label> <Input id="edit-client-name" name="name" value={editableClientData.name || ""} onChange={handleEditableClientChange} disabled={isSubmittingClient} /> </div> <div> <Label htmlFor="edit-client-owner" className="mb-1 block font-semibold text-muted-foreground">Propietario</Label> <Input id="edit-client-owner" name="owner" value={editableClientData.owner || ""} onChange={handleEditableClientChange} disabled={isSubmittingClient} /> </div> <div> <Label htmlFor="edit-client-category" className="mb-1 block font-semibold text-muted-foreground">Categoría</Label> <Input id="edit-client-category" name="category" value={editableClientData.category || ""} onChange={handleEditableClientChange} disabled={isSubmittingClient} /> </div> <div> <Label htmlFor="edit-client-contactEmail" className="mb-1 block font-semibold text-muted-foreground">Email</Label> <Input id="edit-client-contactEmail" name="contactEmail" type="email" value={(editableClientData as any).contactEmail || ""} onChange={handleEditableClientChange} disabled={isSubmittingClient} /> </div> <div> <Label htmlFor="edit-client-contactPhone" className="mb-1 block font-semibold text-muted-foreground">Teléfono</Label> <Input id="edit-client-contactPhone" name="contactPhone" value={(editableClientData as any).contactPhone || ""} onChange={handleEditableClientChange} disabled={isSubmittingClient} /> </div> <div> <Label htmlFor="edit-client-website" className="mb-1 block font-semibold text-muted-foreground">Sitio Web</Label> <Input id="edit-client-website" name="website" value={(editableClientData as any).website || ""} onChange={handleEditableClientChange} disabled={isSubmittingClient} /> </div></> ) : ( <> <DetailItem icon={UserCircle} label="Nombre Completo" value={selectedClient.name} /> <DetailItem icon={UserCircle} label="Propietario Asignado" value={selectedClient.owner} /> <DetailItem icon={Briefcase} label="Categoría Principal" value={selectedClient.category} /> <DetailItem icon={Mail} label="Email de Contacto" value={(selectedClient as any).contactEmail} /> <DetailItem icon={Phone} label="Teléfono de Contacto" value={(selectedClient as any).contactPhone} /> <DetailItem icon={Globe} label="Sitio Web" value={(selectedClient as any).website} />
                <div className="border-t pt-4">
                  <DetailItem icon={Workflow} label="Etapa Actual en Flujo" value={selectedClient.stage} />
                    <div className="mt-2 pl-6">
                      <Label className="text-xs text-muted-foreground">Objetivo Actual</Label>
                       <div className="p-3 rounded-md bg-secondary/50 space-y-2">
                            <p className="font-medium text-sm">{selectedClient.currentObjective}</p>
                            <div className="pt-2 border-t border-border/70 text-right">
                                <Button size="sm">
                                    <Check className="mr-2 h-4 w-4" />Marcar Cumplido
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                </> )}</CardContent></Card></TabsContent>
                <TabsContent value="documents" className="min-h-0">
                  <Card className="border-none shadow-none">
                    <CardHeader className="px-0 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg"><FolderOpen className="h-4 w-4 text-accent" /> Documentos del Usuario </CardTitle>
                            <CardDescription className="text-xs">{(clientDocuments && clientDocuments.length > 0) ? `Mostrando ${clientDocuments.length} documento(s).` : `Este usuario no tiene documentos registrados.`}</CardDescription>
                        </div>
                        {canCreateDocument && (
                            <Button size="sm">
                                <UploadCloud className="mr-2 h-4 w-4" />
                                Subir Documento
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4 px-0">
                      {(clientDocuments && clientDocuments.length > 0) ? (
                        Object.entries(groupedClientDocuments).sort(([typeA], [typeB]) => typeA.localeCompare(typeB)).map(([type, docs]) => (
                          <div key={type}>
                            <h3 className="text-sm font-semibold mb-2 text-muted-foreground border-b pb-1">{type} ({docs.length})</h3>
                            <ul className="space-y-2 pl-1">
                              {docs.sort((a, b) => a.name.localeCompare(b.name)).map(doc => (
                                <li key={doc.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-1.5 bg-secondary/30 rounded-md hover:bg-secondary/70 text-xs overflow-hidden">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <FileTextIcon className="h-3 w-3 text-accent flex-shrink-0" />
                                    <span
                                      className="truncate hover:underline cursor-pointer"
                                      title={`Abrir ${doc.name}`}
                                    >
                                      {doc.name}
                                    </span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-muted-foreground py-6">
                          <FolderOpen className="mx-auto h-8 w-8 mb-2" />
                          <p className="text-sm">No hay documentos para mostrar.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="tasks" className="min-h-0"><Card className="border-none shadow-none"><CardHeader className="px-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"><div className="w-full sm:w-auto"> <CardTitle className="flex items-center gap-2 text-lg"><ListChecks className="h-4 w-4 text-accent" /> Tareas para {selectedClient.name}</CardTitle> <CardDescription className="text-xs mt-0.5 sm:mt-0">{(clientTasks && clientTasks.length > 0) ? `Mostrando ${clientTasks.length} tarea(s).` : `Este usuario no tiene tareas asignadas.`}</CardDescription></div>{ canCreateTask && ( <Button size="sm" disabled={isSubmittingClient} className="w-full mt-2 sm:mt-0 sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" />Añadir Tarea</Button> )}</CardHeader><CardContent className="space-y-3 px-0">{(clientTasks && clientTasks.length > 0) ? ( clientTasks.map(task => ( <div key={task.id} className="p-2.5 border rounded-md text-xs bg-secondary/30"> <p className="font-semibold text-foreground">{task.title}</p> <div className="flex justify-between items-center mt-1 text-muted-foreground"> <span>Vence: {task.dueDate}</span> <span className={`px-2 py-0.5 rounded-full text-xs ${task.status === 'Completada' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700'}`}>{task.status}</span></div></div> )) ) : ( <div className="text-center text-muted-foreground py-6"><ListChecks className="mx-auto h-8 w-8 mb-2" /><p className="text-sm">No hay tareas asignadas a este usuario.</p></div> )}</CardContent></Card></TabsContent>
                <TabsContent value="notes" className="h-full flex flex-col min-h-0">
                  <Card className="border-none shadow-none flex flex-col flex-grow min-h-0">
                    <CardHeader className="px-0 flex flex-col sm:flex-row justify-between items-center flex-shrink-0">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg"><MessageSquare className="h-4 w-4 text-accent" /> Notas</CardTitle>
                        <CardDescription className="text-xs mt-0.5 sm:mt-0">Historial de notas y comentarios sobre el usuario.</CardDescription>
                      </div>
                      {canCreateNote && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full mt-2 sm:mt-0 sm:w-auto"
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />Añadir Nota
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3 px-0 flex-grow overflow-y-auto min-h-0">
                      <div className="space-y-3">
                        {isLoadingNotes && ( <div className="flex items-center justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-accent mr-2" /><p className="text-sm text-muted-foreground">Cargando notas...</p></div> )}
                        {!isLoadingNotes && clientNotes.length === 0 && ( <p className="text-sm text-muted-foreground text-center py-4">No hay notas para este usuario.</p> )}
                        {!isLoadingNotes && clientNotes.map(note => ( 
                          <div key={note.id} className="p-2.5 border rounded-md text-xs bg-secondary/30"> 
                            <p className="whitespace-pre-wrap break-words">{note.content}</p> 
                            <div className="flex justify-between items-center mt-1.5"> 
                              <p className="text-[10px] text-muted-foreground ">{note.createdAt?.toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) || "Fecha no disponible"}</p>
                            </div> 
                          </div> 
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </ScrollArea>
            </Tabs>
            <DialogFooter className={cn( "flex-shrink-0 border-t p-4 sm:p-6 pt-4", isEditingClient ? "sm:justify-end gap-2 flex-wrap" : "flex w-full justify-end items-center" )}>
              {isEditingClient ? (
                <>
                  <Button type="button" variant="default" size="sm" onClick={handleSaveChangesClient} disabled={isSubmittingClient}>
                    {isSubmittingClient ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-accent" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleCancelEditClient} disabled={isSubmittingClient}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <div className="flex w-full justify-end items-center">
                  {canEditClient && (
                    <Tooltip>
                      <TooltipTrigger
                        asChild
                        onClick={() => setIsEditingClient(true)}
                        disabled={isSubmittingClient}
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-7 w-7")}
                        aria-label="Editar Usuario"
                        >
                        <Edit3 className="h-4 w-4" />
                      </TooltipTrigger>
                      <TooltipContent><p>Editar Usuario</p></TooltipContent>
                    </Tooltip>
                  )}
                  {canDeleteClient && (
                    <Tooltip>
                      <TooltipTrigger
                        asChild
                        onClick={() => { if (selectedClient) openDeleteClientConfirmation(selectedClient); }}
                        disabled={isSubmittingClient}
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-7 w-7")}
                        aria-label="Eliminar Usuario"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </TooltipTrigger>
                      <TooltipContent><p>Eliminar Usuario</p></TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Añadir Nuevo Usuario</DialogTitle>
            </DialogHeader>
            {/* Formulario para añadir nuevo cliente */}
        </DialogContent>
    </Dialog>


      <AlertDialog open={isDeletingClient} onOpenChange={setIsDeletingClient}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. ¿Está seguro de que desea eliminar al usuario "{clientToDelete?.name}" y todos sus datos asociados (documentos, tareas, notas)?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setIsDeletingClient(false); setClientToDelete(null); }} disabled={isSubmittingClient}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteClient} disabled={isSubmittingClient} className="bg-destructive hover:bg-destructive/90">
              {isSubmittingClient ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-accent" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </main>
      </div>
    </TooltipProvider>
  );
}
