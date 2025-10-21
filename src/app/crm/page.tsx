
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Header } from "@/components/header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCRMData, type WorkflowStage, type ServiceWorkflow, type WorkflowStageObjective, type SubObjective, type SubService } from "@/contexts/CRMDataContext"; 
import { Edit, Save, Trash2, Plus, X, Loader2, UploadCloud, ChevronsRight, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { SmartDocumentUploadDialog } from "@/components/shared/SmartDocumentUploadDialog";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useGlobalNotification } from "@/contexts/NotificationContext";
import { useDialogs } from "@/contexts/DialogsContext";


const StageNumberIcon = ({ index }: { index: number }) => {
  return (
    <div className="w-8 flex-shrink-0 text-3xl font-bold text-accent">
      {index + 1}
    </div>
  );
};


export default function CrmConfigurationPage() {
  const { 
    currentUser,
    serviceWorkflows, 
    isLoadingWorkflows,
    addService, 
    updateService, 
    deleteService, 
    isLoadingClients,
    addSubServiceToService,
    updateSubServiceName,
    deleteSubServiceFromService,
    updateStageInSubService, 
    addStageToSubService, 
    deleteStageFromSubService, 
    updateObjectiveInStage, 
    addObjectiveToStage, 
    deleteObjectiveFromStage 
  } = useCRMData();
  const router = useRouter();
  const { showNotification } = useGlobalNotification();
  const { isSmartUploadDialogOpen, setIsSmartUploadDialogOpen } = useDialogs();

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editableServiceName, setEditableServiceName] = useState("");
  const [isSavingService, setIsSavingService] = useState(false);
  const [isAddingService, setIsAddingService] = useState(false);
  
  const [editingSubServiceId, setEditingSubServiceId] = useState<string | null>(null);
  const [editableSubServiceName, setEditableSubServiceName] = useState("");
  
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editableStageData, setEditableStageData] = useState<Partial<WorkflowStage> | null>(null);
  
  const [serviceToDelete, setServiceToDelete] = useState<ServiceWorkflow | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const canEditWorkflow = currentUser?.permissions.crm_edit ?? true;

  useEffect(() => {
    if (!serviceWorkflows) return;
    if (!selectedWorkflowId && serviceWorkflows.length > 0) {
      setSelectedWorkflowId(serviceWorkflows[0].id);
    }
    if (selectedWorkflowId && !serviceWorkflows.some(wf => wf.id === selectedWorkflowId)) {
      setSelectedWorkflowId(serviceWorkflows.length > 0 ? serviceWorkflows[0].id : null);
    }
  }, [serviceWorkflows, selectedWorkflowId]);

  const selectedWorkflow = useMemo(() => {
    if (!serviceWorkflows) return null;
    return serviceWorkflows.find(wf => wf.id === selectedWorkflowId) || null;
  }, [selectedWorkflowId, serviceWorkflows]);
  
  const handleStartEditService = () => {
    if (!selectedWorkflow) return;
    setEditingServiceId(selectedWorkflow.id);
    setEditableServiceName(selectedWorkflow.name);
  };
  
  const handleCancelEditService = () => {
    setEditingServiceId(null);
    setEditableServiceName("");
  };

  const handleSaveServiceName = async () => {
    if (!editableServiceName.trim() || !editingServiceId) return;
    setIsSavingService(true);
    await updateService(editingServiceId, { name: editableServiceName.trim() });
    setIsSavingService(false);
    handleCancelEditService();
  };
  
  const handleStartEditSubService = (subService: SubService) => {
    setEditingSubServiceId(subService.id);
    setEditableSubServiceName(subService.name);
  };

  const handleCancelEditSubService = () => {
    setEditingSubServiceId(null);
    setEditableSubServiceName("");
  };

  const handleSaveSubServiceName = (serviceId: string, subServiceId: string) => {
    if (!editableSubServiceName.trim()) return;
    updateSubServiceName(serviceId, subServiceId, editableSubServiceName);
    handleCancelEditSubService();
  };

  const handleAddNewService = async () => {
    setIsAddingService(true);
    const newService = await addService();
    if (newService) {
      setSelectedWorkflowId(newService.id);
    }
    setIsAddingService(false);
  };

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;
    await deleteService(serviceToDelete.id);
    setServiceToDelete(null);
    setIsDeleteConfirmOpen(false);
  };

  const handleStartEditStage = (stage: WorkflowStage) => {
    setEditingStageId(stage.id);
    setEditableStageData(JSON.parse(JSON.stringify(stage)));
  };

  const handleCancelEditStage = () => {
    setEditingStageId(null);
    setEditableStageData(null);
  };

  const handleSaveStage = (serviceId: string, subServiceId: string | null) => {
    if (!editableStageData || !serviceId || !editingStageId) return;
    updateStageInSubService(serviceId, subServiceId, editingStageId, editableStageData as WorkflowStage);
    handleCancelEditStage();
  };

  const handleStageDataChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editableStageData) return;
    const { name, value } = e.target;
    setEditableStageData({ ...editableStageData, [name]: value });
  }, [editableStageData]);

  const handleObjectiveChange = (objectiveId: string, field: 'description' | 'requiredDocumentForCompletion', value: string) => {
    if (!editableStageData || !editableStageData.objectives) return;
    
    let finalValue = value;
    if (field === 'requiredDocumentForCompletion' && value === 'ninguno') {
        finalValue = '';
    }
    
    const newObjectives = editableStageData.objectives.map((obj) => {
      if (obj.id === objectiveId) {
        return { ...obj, [field]: finalValue };
      }
      return obj;
    });
  
    setEditableStageData({ ...editableStageData, objectives: newObjectives });
  };
  

  const handleSubObjectiveChange = (objectiveId: string, subObjectiveId: string, text: string) => {
    if (!editableStageData || !editableStageData.objectives) return;
    const newObjectives = (editableStageData.objectives || []).map(obj => {
        if (obj.id === objectiveId) {
            const newSubObjectives = (obj.subObjectives || []).map(sub => 
                sub.id === subObjectiveId ? { ...sub, text } : sub
            );
            return { ...obj, subObjectives: newSubObjectives };
        }
        return obj;
    });
    setEditableStageData({ ...editableStageData, objectives: newObjectives });
  };

  const handleAddSubObjective = (objectiveId: string) => {
    if (!editableStageData || !editableStageData.objectives) return;
    const newObjectives = (editableStageData.objectives || []).map(obj => {
        if (obj.id === objectiveId) {
            const currentSubObjectives = obj.subObjectives || [];
            const newSubObjective: SubObjective = {
                id: `sub-${Date.now()}-${Math.random()}`,
                text: ""
            };
            return { ...obj, subObjectives: [...currentSubObjectives, newSubObjective] };
        }
        return obj;
    });
    setEditableStageData({ ...editableStageData, objectives: newObjectives });
  };

  const handleDeleteSubObjective = (objectiveId: string, subObjectiveId: string) => {
    if (!editableStageData || !editableStageData.objectives) return;
    const newObjectives = editableStageData.objectives.map(obj => {
        if (obj.id === objectiveId) {
            const filteredSubObjectives = (obj.subObjectives || []).filter(sub => sub.id !== subObjectiveId);
            return { ...obj, subObjectives: filteredSubObjectives };
        }
        return obj;
    });
    setEditableStageData({ ...editableStageData, objectives: newObjectives });
  };

  const renderStages = (stages: WorkflowStage[], serviceId: string, subServiceId: string | null) => {
    if (!stages) return null;
    return (
      <Accordion type="multiple" className="w-full space-y-4" defaultValue={(stages || []).map(s => s.id)}>
        {(stages || []).map((stage, stageIndex) => {
          const isEditingThisStage = editingStageId === stage.id;
          return (
            <AccordionItem value={stage.id} key={stage.id} className="border rounded-lg bg-card overflow-hidden">
              <div className="flex items-center p-4 pr-2">
                <AccordionTrigger className="p-0 hover:no-underline flex-grow">
                    <div className="flex items-center text-left gap-3">
                        <StageNumberIcon index={stageIndex} />
                        <h3 className="font-semibold text-base">{stage.title}</h3>
                    </div>
                </AccordionTrigger>
                {canEditWorkflow && (
                  <div className="pl-2">
                    {isEditingThisStage ? (
                        <div className="flex gap-2">
                          <Button variant="default" size="sm" onClick={() => handleSaveStage(serviceId, subServiceId)}><Save className="h-4 w-4 mr-2"/>Guardar</Button>
                          <Button variant="ghost" size="sm" onClick={handleCancelEditStage}><X className="h-4 w-4 mr-2"/>Cancelar</Button>
                        </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleStartEditStage(stage)} disabled={!!editingServiceId}><Edit className="h-4 w-4 mr-2"/>Editar</Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-1" onClick={() => deleteStageFromSubService(serviceId, subServiceId, stage.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                  </div>
                )}
              </div>
              <AccordionContent className="border-t p-4">
                {isEditingThisStage && editableStageData ? (
                  <div className="space-y-4">
                    <div><Label>Título de la Etapa</Label><Input name="title" value={editableStageData.title || ''} onChange={handleStageDataChange} /></div>
                    <div className="space-y-3">
                      {(editableStageData.objectives || []).map((objective, objIndex) => {
                          const customDocValue = objective.requiredDocumentForCompletion || '';
                          const isCustomDoc = customDocValue && !["Contrato", "Factura", "Propuesta", "Informe", ""].includes(customDocValue);
                          const selectValue = isCustomDoc ? 'Otro' : customDocValue || 'ninguno';

                          return (
                              <div key={objective.id} className="flex flex-col gap-2 p-3 border rounded-md bg-secondary/30">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 flex-shrink-0 text-lg font-bold text-accent/80">{objIndex + 1}.</div>
                                  <Input value={objective.description} onChange={(e) => handleObjectiveChange(objective.id, 'description', e.target.value)} placeholder="Descripción del Objetivo..." className="font-semibold flex-grow"/>
                                  <Button type="button" size="icon" variant="ghost" onClick={() => deleteObjectiveFromStage(serviceId, subServiceId, stage.id, objective.id)} className="self-center"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                                <div className="pl-8 pt-2 border-t border-border/50">
                                  <Label htmlFor={`doc-req-${objective.id}`} className="text-xs">Documento Requerido (Opcional)</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-grow">
                                            <Select
                                                value={selectValue}
                                                onValueChange={(value) => handleObjectiveChange(objective.id, 'requiredDocumentForCompletion', value)}
                                            >
                                                <SelectTrigger id={`doc-req-${objective.id}`} className="h-8 text-sm"><SelectValue placeholder="Ninguno" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ninguno">Ninguno</SelectItem>
                                                    <SelectItem value="Contrato">Contrato</SelectItem>
                                                    <SelectItem value="Factura">Factura</SelectItem>
                                                    <SelectItem value="Propuesta">Propuesta</SelectItem>
                                                    <SelectItem value="Informe">Informe</SelectItem>
                                                    <SelectItem value="Otro">Otro (especificar)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                              <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setIsSmartUploadDialogOpen(true)}>
                                                <UploadCloud className="h-4 w-4" />
                                              </Button>
                                          </TooltipTrigger>
                                          <TooltipContent><p>Subir documento</p></TooltipContent>
                                      </Tooltip>
                                    </div>
                                    {selectValue === 'Otro' && (
                                        <div className="pl-0 mt-2">
                                          <Input
                                              type="text"
                                              placeholder="Escriba el nombre del documento"
                                              value={isCustomDoc ? customDocValue : ''}
                                              onChange={(e) => handleObjectiveChange(objective.id, 'requiredDocumentForCompletion', e.target.value)}
                                              className="h-8 text-sm" autoFocus
                                          />
                                        </div>
                                    )}
                                  <p className="text-[10px] text-muted-foreground mt-1">Si se define, el objetivo se completará automáticamente al subir el documento.</p>
                                </div>
                              </div>
                          )
                        })}
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={() => addObjectiveToStage(serviceId, subServiceId, stage.id)}><Plus className="h-4 w-4 mr-2"/>Añadir Objetivo</Button>
                    </div>
                ) : (
                  <div>
                    {stage.objectives.length > 0 ? (
                      <div className="space-y-2">
                        {stage.objectives.map((objective, objectiveIndex) => (
                          <div key={objective.id}>
                            <div className="flex items-baseline gap-2"><div className="w-5 flex-shrink-0 text-right font-semibold">{objectiveIndex + 1}.</div><p className="font-semibold flex-grow">{objective.description}</p></div>
                          </div>
                        ))}
                      </div>
                    ) : (<p className="text-sm text-muted-foreground pl-2">No hay objetivos definidos.</p>)}
                  </div>
                )}
              </AccordionContent>
             </AccordionItem>
           );
        })}
      </Accordion>
    );
  };

  if (isLoadingWorkflows) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header 
                title="Configuración del CRM" 
                description="Seleccione un servicio para gestionar sus etapas y objetivos."
            />
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        </div>
    )
  }

  return (
    <TooltipProvider>
      <Header 
        title="Configuración del CRM" 
        description="Seleccione un servicio para gestionar sus etapas y objetivos."
        children={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsSmartUploadDialogOpen(true)}>
              <UploadCloud className="mr-2 h-4 w-4"/>
              Subir Documento
            </Button>
            {canEditWorkflow && (
              <Button onClick={handleAddNewService} disabled={isAddingService || !canEditWorkflow}>
                {isAddingService ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Plus className="mr-2 h-4 w-4"/>}
                Añadir Nuevo Servicio
              </Button>
            )}
          </div>
        }
      />
      
      <div className="p-4 md:p-8 space-y-6">
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-grow w-full sm:w-auto">
                        <Label htmlFor="service-selector">Servicio Activo</Label>
                        {editingServiceId && selectedWorkflow ? (
                            <div className="flex items-center gap-2 mt-1">
                                <Input 
                                    value={editableServiceName}
                                    onChange={(e) => setEditableServiceName(e.target.value)}
                                    disabled={isSavingService}
                                    className="h-9"
                                />
                                <Button size="icon" className="h-9 w-9" onClick={handleSaveServiceName} disabled={isSavingService}>
                                    {isSavingService ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
                                </Button>
                                <Button size="icon" className="h-9 w-9" variant="ghost" onClick={handleCancelEditService} disabled={isSavingService}>
                                    <X className="h-4 w-4"/>
                                </Button>
                            </div>
                        ) : (
                            <Select value={selectedWorkflowId || ""} onValueChange={(id) => setSelectedWorkflowId(id)} disabled={!serviceWorkflows || !serviceWorkflows.length}>
                                <SelectTrigger id="service-selector" className="mt-1">
                                    <SelectValue placeholder="Seleccione un servicio..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {serviceWorkflows && serviceWorkflows.map(service => (
                                        <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                     {!editingServiceId && selectedWorkflow && canEditWorkflow && (
                        <div className="flex items-center gap-2 self-start sm:self-end pt-0 sm:pt-5">
                            <Button variant="outline" size="sm" onClick={handleStartEditService} disabled={!!editingServiceId || !canEditWorkflow}>
                                <Edit className="mr-2 h-4 w-4" /> Editar Nombre
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => { setServiceToDelete(selectedWorkflow); setIsDeleteConfirmOpen(true); }} disabled={!!editingServiceId || !canEditWorkflow}>
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="border-t pt-4">
            {selectedWorkflow ? (
              <div className="space-y-4">
                {/* COMPLEX VIEW: More than one sub-service */}
                {selectedWorkflow.subServices && selectedWorkflow.subServices.length > 1 ? (
                  <Accordion type="multiple" className="w-full space-y-4" defaultValue={(selectedWorkflow.subServices || []).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).map(sub => sub.id)}>
                    {(selectedWorkflow.subServices || []).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).map((subService) => (
                      <AccordionItem value={subService.id} key={subService.id} className="border rounded-lg bg-card overflow-hidden">
                        <div className="flex items-center p-4 pr-2 bg-secondary/30">
                          <AccordionTrigger className="p-0 hover:no-underline flex-grow">
                            <div className="flex items-center text-left gap-3">
                              <ChevronsRight className="h-6 w-6 text-muted-foreground" />
                              {editingSubServiceId === subService.id ? (
                                <div className="flex items-center gap-2">
                                  <Input value={editableSubServiceName} onChange={(e) => setEditableSubServiceName(e.target.value)} className="h-8" onClick={(e) => e.stopPropagation()} />
                                  <Button size="icon" className="h-8 w-8" onClick={(e) => {e.stopPropagation(); handleSaveSubServiceName(selectedWorkflow.id, subService.id);}}><Save className="h-4 w-4"/></Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => {e.stopPropagation(); handleCancelEditSubService();}}><X className="h-4 w-4"/></Button>
                                </div>
                              ) : ( <h3 className="font-semibold text-lg">{subService.name}</h3> )}
                            </div>
                          </AccordionTrigger>
                          {canEditWorkflow && (
                            <div className="pl-2">
                              <Button variant="outline" size="sm" onClick={() => handleStartEditSubService(subService)} disabled={!!editingSubServiceId || !canEditWorkflow}><Edit className="h-4 w-4 mr-2"/>Editar</Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 ml-1" onClick={() => deleteSubServiceFromService(selectedWorkflow.id, subService.id)} disabled={!canEditWorkflow}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </div>
                          )}
                        </div>
                        <AccordionContent className="p-4 space-y-3">
                          {renderStages(subService.stages, selectedWorkflow.id, subService.id)}
                          {canEditWorkflow && (
                            <div className="mt-4">
                              <Button variant="outline" onClick={() => addStageToSubService(selectedWorkflow.id, subService.id)} disabled={!canEditWorkflow}><Plus className="h-4 w-4 mr-2"/>Añadir Etapa a este Sub-Servicio</Button>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="space-y-4">
                    {renderStages(selectedWorkflow.subServices?.[0]?.stages ?? [], selectedWorkflow.id, selectedWorkflow.subServices?.[0]?.id ?? null)}
                    {canEditWorkflow && (
                       <div className="mt-4">
                        <Button variant="outline" onClick={() => addStageToSubService(selectedWorkflow.id, selectedWorkflow.subServices?.[0]?.id ?? null)} disabled={!canEditWorkflow}><Plus className="h-4 w-4 mr-2"/>Añadir Nueva Etapa</Button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Global actions for the service */}
                {canEditWorkflow && selectedWorkflow.subServices && selectedWorkflow.subServices.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <Button variant="outline" onClick={() => addSubServiceToService(selectedWorkflow.id)} disabled={!canEditWorkflow}><Plus className="h-4 w-4 mr-2"/>Añadir Sub-Servicio</Button>
                  </div>
                )}
              </div>
            ) : (
                <div className="text-center text-muted-foreground py-10 border border-dashed rounded-lg">
                    <p>No hay servicios creados o seleccionados.</p>
                    <p className="text-sm">Empiece por añadir un nuevo servicio usando el botón de arriba.</p>
                </div>
            )}
            </CardContent>
        </Card>
      </div>

       <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. ¿Está seguro de que desea eliminar el servicio "{serviceToDelete?.name}" y todos sus sub-servicios, etapas y objetivos asociados?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteConfirmOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteService} className="bg-destructive hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <SmartDocumentUploadDialog
            isOpen={isSmartUploadDialogOpen}
            onOpenChange={setIsSmartUploadDialogOpen}
            onClientAdded={(client) => {
                router.push(`/contacts?openClient=${client.id}`);
            }}
        />
    </TooltipProvider>
  );
}
    

    
