
"use client";

import React, { useState, useCallback } from "react";
import { type Client, type Document, type Task, type WorkflowAction } from "@/lib/types";
import { useCRMData } from "@/contexts/CRMDataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Edit, Trash2, Plus, Download, FileText, UploadCloud, Info, Users, Target, ListTodo, CheckCircle2 } from "lucide-react";
import { AddEditClientDialog } from "./AddEditClientDialog";
import { useToast } from "@/hooks/use-toast";
import { SmartDocumentUploadDialog } from "./SmartDocumentUploadDialog";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatDateString } from "@/lib/utils";

interface ClientDetailViewProps {
  client: Client | null;
  onClose: () => void;
}

const DetailItem = ({ label, value, href }: { label: string; value?: string; href?: string }) => {
    if (!value) return null;
    return (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">{value}</a>
            ) : (
                <p className="text-sm font-medium">{value}</p>
            )}
        </div>
    );
};

export function ClientDetailView({ client, onClose }: ClientDetailViewProps) {
    const { getDocumentsByClientId, getTasksByClientId, getActionById } = useCRMData();
    const { toast } = useToast();
    
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    
    if (!client) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-background">
                <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground">Seleccione un Cliente</h3>
                <p className="text-sm text-muted-foreground">Cargando detalles del cliente...</p>
            </div>
        );
    }
    
    const clientDocuments = getDocumentsByClientId(client.id);
    const clientTasks = getTasksByClientId(client.id);
    const pendingTasks = clientTasks.filter(task => task.status === 'Pendiente');
    const currentStageAction = client?.currentActionId ? getActionById(client.currentActionId) : null;

    const handleDownload = (doc: Document) => {
        toast({
            title: "Descarga Simulada",
            description: `Se ha iniciado la descarga de "${doc.name}".`
        });
    };
    
    return (
        <>
            <div className="relative bg-background max-h-[80vh] overflow-y-auto p-1">
                <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-7 w-7" onClick={onClose}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Cerrar</span>
                </Button>
                
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{client.name}</DialogTitle>
                    <DialogDescription>{client.category}</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}><Edit className="mr-2 h-4 w-4"/>Editar</Button>
                        <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)}><UploadCloud className="mr-2 h-4 w-4"/>Subir Documento</Button>
                    </div>

                    <Card>
                        <CardHeader><CardTitle>Información del Cliente</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailItem label="Contacto Principal" value={client.owner} />
                            <DetailItem label="Email de Contacto" value={client.contactEmail} href={`mailto:${client.contactEmail}`} />
                            <DetailItem label="Teléfono" value={client.contactPhone} href={`tel:${client.contactPhone}`} />
                            <DetailItem label="Sitio Web" value={client.website} href={client.website} />
                        </CardContent>
                    </Card>

                    {currentStageAction && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Estado Actual en el Flujo</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start gap-2">
                                    <Target className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                                    <DetailItem label="Acción Actual" value={currentStageAction.description} />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Tareas Pendientes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {pendingTasks.length > 0 ? (
                                <ul className="space-y-2">
                                    {pendingTasks.map(task => (
                                        <li key={task.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/30">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <ListTodo className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                                <div className="truncate">
                                                    <p className="text-sm font-medium truncate" title={task.title}>{task.title}</p>
                                                    <p className="text-xs text-muted-foreground">Vence: {formatDateString(task.dueDate)}</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center text-muted-foreground py-6">
                                    <CheckCircle2 className="mx-auto h-8 w-8 text-green-500 mb-2" />
                                    <p className="text-sm">No hay tareas pendientes para este cliente.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Documentos Adjuntos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {clientDocuments.length > 0 ? (
                                <ul className="space-y-2">
                                    {clientDocuments.map(doc => (
                                        <li key={doc.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/30">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                                <div className="truncate">
                                                    <p className="text-sm font-medium truncate" title={doc.name}>{doc.name}</p>
                                                    <p className="text-xs text-muted-foreground">{doc.type}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)}>
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center text-muted-foreground py-6">
                                    <Info className="mx-auto h-8 w-8 mb-2" />
                                    <p className="text-sm">No hay documentos para este cliente.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <AddEditClientDialog 
                client={client}
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
            />
            
            <SmartDocumentUploadDialog
                isOpen={isUploadDialogOpen}
                onOpenChange={setIsUploadDialogOpen}
                preselectedClientId={client.id}
            />
        </>
    );
}
