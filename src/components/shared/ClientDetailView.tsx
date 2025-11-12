

"use client";

import React, { useState, useMemo } from "react";
import { type Client, type Document, type Task, type WorkflowAction, type WorkflowStage, type SubStage, type SubSubStage, type Commission, type SubmittedRequirement } from "@/lib/types";
import { useCRMData } from "@/contexts/CRMDataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus, Download, FileText, UploadCloud, Info, Users, Target, ListTodo, CheckCircle2, Briefcase, UserCheck, Smartphone, CalendarDays, Percent, Tag, FileCheck2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SmartDocumentUploadDialog } from "./SmartDocumentUploadDialog";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatDateString } from "@/lib/utils";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { serverTimestamp } from "firebase/firestore";


type AnyStage = WorkflowStage | SubStage | SubSubStage;

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
    const { getDocumentsByClientId, serviceWorkflows, getTasksByClientId, promoters: allPromoters, updateClient } = useCRMData();
    const { toast } = useToast();
    
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

    const subscribedServices = useMemo(() => {
        if (!client.subscribedServiceIds || !serviceWorkflows) return [];
        return client.subscribedServiceIds
            .map(id => serviceWorkflows.find(s => s.id === id))
            .filter(Boolean) as typeof serviceWorkflows;
    }, [client, serviceWorkflows]);

    const promoterDetails = useMemo(() => {
        if (!client.promoters || !allPromoters) return [];
        return client.promoters.map(ref => {
            const promoter = allPromoters.find(p => p.id === ref.promoterId);
            return {
                ...ref,
                name: promoter?.name || 'Promotor Desconocido'
            }
        });
    }, [client.promoters, allPromoters]);

    const getCommissionRate = (serviceId: string, commission: Commission): number => {
        const customRate = client.customCommissions?.find(cc => cc.serviceId === serviceId && cc.commissionId === commission.id);
        return customRate ? customRate.rate : commission.rate;
    };


    const clientDocuments = getDocumentsByClientId(client.id);
    const clientTasks = getTasksByClientId(client.id);

    const pendingTasks = useMemo(() => {
        return clientTasks.filter(task => task.status === 'Pendiente');
    }, [clientTasks]);
    
    const allUniqueRequirements = useMemo(() => {
        const requirements = new Set<string>();
        subscribedServices.forEach(service => {
            service.clientRequirements?.forEach(req => requirements.add(req.text));
        });
        return Array.from(requirements);
    }, [subscribedServices]);

    const pendingRequirements = useMemo(() => {
        const submittedTexts = new Set(client.submittedRequirements?.map(sr => sr.text) || []);
        return allUniqueRequirements.filter(reqText => !submittedTexts.has(reqText));
    }, [allUniqueRequirements, client.submittedRequirements]);

     const handleRequirementToggle = async (requirementText: string, isSubmitted: boolean) => {
        const currentSubmitted = client.submittedRequirements || [];
        let updatedSubmitted: SubmittedRequirement[];

        if (isSubmitted) {
            // Add to submitted list
            updatedSubmitted = [...currentSubmitted, { text: requirementText, submittedAt: new Date() }];
        } else {
            // Remove from submitted list
            updatedSubmitted = currentSubmitted.filter(sr => sr.text !== requirementText);
        }

        const success = await updateClient(client.id, { submittedRequirements: updatedSubmitted });

        if (!success) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo actualizar el requisito."
            });
        }
    };

    const currentStage = useMemo((): AnyStage | null => {
        if (!client.currentWorkflowStageId || !serviceWorkflows) return null;
        for (const service of serviceWorkflows) {
            for (const stage1 of service.stages || []) {
                if (stage1.id === client.currentWorkflowStageId) return stage1;
                for (const stage2 of stage1.subStages || []) {
                    if (stage2.id === client.currentWorkflowStageId) return stage2;
                    for (const stage3 of stage2.subSubStages || []) {
                        if (stage3.id === client.currentWorkflowStageId) return stage3;
                    }
                }
            }
        }
        return null;
    }, [client.currentWorkflowStageId, serviceWorkflows]);
    
    const handleDownload = (doc: Document) => {
        toast({
            title: "Descarga Simulada",
            description: `Se ha iniciado la descarga de "${doc.name}".`
        });
    };
    
    return (
        <>
            <div className="relative bg-background max-h-[80vh] overflow-y-auto p-1">
                
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{client.name}</DialogTitle>
                    <DialogDescription>{client.category}</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)}><UploadCloud className="mr-2 h-4 w-4"/>Subir Documento</Button>
                    </div>

                    <Card>
                        <CardHeader><CardTitle>Información del Cliente</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailItem label="Contacto Principal" value={client.owner} />
                            <DetailItem label="Email de Contacto" value={client.contactEmail} href={`mailto:${client.contactEmail}`} />
                            <DetailItem label="Teléfono" value={client.contactPhone} href={`tel:${client.contactPhone}`} />
                            <DetailItem label="Sitio Web" value={client.website} href={client.website} />
                             {client.createdAt && (
                                <div className="flex items-start gap-3">
                                    <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground">Fecha de Inicio</span>
                                        <p className="text-sm font-medium">{formatDateString(client.createdAt.toDate())}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader><CardTitle>Requisitos Pendientes</CardTitle></CardHeader>
                        <CardContent>
                            {allUniqueRequirements.length > 0 ? (
                                <div className="space-y-2">
                                    {allUniqueRequirements.map(reqText => {
                                        const isSubmitted = client.submittedRequirements?.some(sr => sr.text === reqText) ?? false;
                                        return (
                                            <div key={reqText} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`req-${reqText}`}
                                                    checked={isSubmitted}
                                                    onCheckedChange={(checked) => handleRequirementToggle(reqText, !!checked)}
                                                />
                                                <Label
                                                    htmlFor={`req-${reqText}`}
                                                    className={`text-sm ${isSubmitted ? 'line-through text-muted-foreground' : ''}`}
                                                >
                                                    {reqText}
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No hay requisitos definidos para los servicios de este cliente.</p>
                            )}
                        </CardContent>
                    </Card>


                    <Card>
                        <CardHeader><CardTitle>Servicios y Comisiones</CardTitle></CardHeader>
                        <CardContent>
                            {subscribedServices.length > 0 ? (
                                <ul className="space-y-4">
                                    {subscribedServices.map(service => (
                                        <li key={service.id}>
                                            <div className="flex items-center gap-2 text-sm font-semibold">
                                                <Briefcase className="h-4 w-4 text-accent" />
                                                <span>{service.name}</span>
                                            </div>
                                            {service.commissions && service.commissions.length > 0 && (
                                                <ul className="pl-6 pt-2 space-y-1">
                                                    {service.commissions.map(commission => {
                                                         const rate = getCommissionRate(service.id, commission);
                                                         const isCustom = client.customCommissions?.some(cc => cc.serviceId === service.id && cc.commissionId === commission.id);
                                                         return (
                                                            <li key={commission.id} className="flex items-center text-xs">
                                                                <Percent className="h-3 w-3 mr-2 text-muted-foreground" />
                                                                <span className="text-muted-foreground">{commission.name}:</span>
                                                                <span className="font-medium ml-1.5">{rate}%</span>
                                                                {isCustom && <Tag className="h-3 w-3 ml-2 text-primary" title="Tasa personalizada"/>}
                                                            </li>
                                                         )
                                                    })}
                                                </ul>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">No hay servicios contratados.</p>
                            )}
                        </CardContent>
                    </Card>

                    {client.posTerminals && client.posTerminals.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>Terminales Punto de Venta (TPV)</CardTitle></CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {client.posTerminals.map((terminal) => (
                                        <li key={terminal.id} className="flex items-center gap-2 text-sm font-medium">
                                            <Smartphone className="h-4 w-4 text-accent" />
                                            <span>Número de Serie: {terminal.serialNumber}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                     <Card>
                        <CardHeader><CardTitle>Promotores Referidos</CardTitle></CardHeader>
                        <CardContent>
                             {promoterDetails && promoterDetails.length > 0 ? (
                                <ul className="space-y-2">
                                    {promoterDetails.map(ref => (
                                        <li key={ref.promoterId} className="flex items-center justify-between text-sm font-medium">
                                            <span className="flex items-center gap-2">
                                                <UserCheck className="h-4 w-4 text-accent" />
                                                {ref.name}
                                            </span>
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                {ref.percentage}
                                                <Percent className="h-3 w-3" />
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">No hay promotores referidos.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Tareas pendientes</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {currentStage && (
                                <div className="flex items-start gap-2">
                                    <Target className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Etapa Actual</p>
                                        <p className="text-sm font-medium">{currentStage.title}</p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="flex items-center gap-2 text-sm font-semibold mb-2">
                                    <ListTodo className="h-4 w-4 text-accent"/>
                                    Tareas Pendientes
                                </h4>
                                {pendingTasks.length > 0 ? (
                                    <ul className="space-y-3 pl-6">
                                        {pendingTasks.map(task => {
                                            const serviceName = serviceWorkflows.find(s => s.id === task.serviceId)?.name;
                                            return (
                                                 <li key={task.id} className="flex flex-col text-sm">
                                                    <span className="font-medium text-foreground">{task.title}</span>
                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                        {serviceName && <span>Servicio: {serviceName} | </span>}
                                                        <span>Vence: {formatDateString(task.dueDate)}</span>
                                                    </div>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground pl-6">No hay tareas pendientes para este cliente.</p>
                                )}
                            </div>
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
            
            <SmartDocumentUploadDialog
                isOpen={isUploadDialogOpen}
                onOpenChange={setIsUploadDialogOpen}
                preselectedClientId={client.id}
            />
        </>
    );
}
    

