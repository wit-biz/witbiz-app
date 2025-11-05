
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCRMData, type WorkflowStage, type ServiceWorkflow, type WorkflowAction, type SubObjective, type SubService, type Task } from "@/contexts/CRMDataContext"; 
import { Edit, Save, Trash2, Plus, X, Loader2, UploadCloud, ChevronsRight, FileText, ListTodo, Workflow as WorkflowIcon, ArrowLeft, PlusCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useDialogs } from "@/contexts/DialogsContext";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useGlobalNotification } from "@/contexts/NotificationContext";
import { AddTaskDialog } from "@/components/shared/AddTaskDialog";
import { PromptNameDialog } from "@/components/shared/PromptNameDialog";
import { Slider } from "@/components/ui/slider";


const StageNumberIcon = ({ index }: { index: number }) => {
  return (
    <div className="w-8 flex-shrink-0 text-3xl font-bold text-accent">
      {index + 1}
    </div>
  );
};

const AutoSaveIndicator = ({ isSaving }: { isSaving: boolean }) => {
    if (!isSaving) return null;
    return (
        <div className="flex items-center text-xs text-muted-foreground transition-opacity duration-300">
            <Save className="h-3 w-3 mr-1 animate-pulse" />
            <span>Guardado</span>
        </div>
    );
};


export default function WorkflowConfigurationPage() {
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
    addActionToStage, 
    updateActionInStage, 
    deleteActionFromStage,
    addTask
  } = useCRMData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showNotification } = useGlobalNotification();
  const { isSmartUploadDialogOpen, setIsSmartUploadDialogOpen } = useDialogs();

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editableServiceName, setEditableServiceName] = useState("");
  const [isSavingService, setIsSavingService] = useState(false);
  
  const [editingSubServiceId, setEditingSubServiceId] = useState<string | null>(null);
  const [editableSubServiceName, setEditableSubServiceName] = useState("");
  
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editableStageData, setEditableStageData] = useState<Partial<WorkflowStage> | null>(null);
  
  const [serviceToDelete, setServiceToDelete] = useState<ServiceWorkflow | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [initialTaskDataForDialog, setInitialTaskDataForDialog] = useState<Partial<Omit<Task, 'id'>>>({});

  const [isPromptNameOpen, setIsPromptNameOpen] = useState(false);
  const [promptNameConfig, setPromptNameConfig] = useState<{
    title: string;
    description: string;
    label: string;
    onSave: (name: string) => void;
  } | null>(null);

  const [savingField, setSavingField] = useState<string | null>(null);


  const canEditWorkflow = currentUser?.permissions.crm_edit ?? true;

  const handleOpenTaskDialog = (title: string, dueDays = 0) => {
    setInitialTaskDataForDialog({ title: title, dueDays: dueDays });
    setIsAddTaskDialogOpen(true);
  };
  
  const handleAddService = () => {
    setPromptNameConfig({
      title: "Añadir Nuevo Servicio",
      description: "Introduzca un nombre para el nuevo servicio. Podrá configurar los detalles más tarde.",
      label: "Nombre del Servicio",
      onSave: async (name) => {
        const newService = await addService(name);
        if (newService) {
          setSelectedWorkflowId(newService.id);
        }
      },
    });
    setIsPromptNameOpen(true);
  };

  const handleAddSubService = (serviceId: string) => {
    setPromptNameConfig({
      title: "Añadir Nuevo Sub-Servicio",
      description: "Introduzca un nombre para el nuevo sub-servicio.",
      label: "Nombre del Sub-Servicio",
      onSave: (name) => addSubServiceToService(serviceId, name),
    });
    setIsPromptNameOpen(true);
  };

  const handleAddStage = (serviceId: string, subServiceId: string | null) => {
    setPromptNameConfig({
      title: "Añadir Nueva Etapa",
      description: "Introduzca un nombre para la nueva etapa del flujo.",
      label: "Nombre de la Etapa",
      onSave: (name) => addStageToSubService(serviceId, subServiceId, name),
    });
    setIsPromptNameOpen(true);
  };
  
  const triggerSaveIndicator = (fieldId: string) => {
    setSavingField(fieldId);
    setTimeout(() => {
        setSavingField(null);
    }, 1500);
  };
  
  const debouncedUpdate = useCallback(
    (updateFunction: () => void, fieldId: string) => {
        updateFunction();
        triggerSaveIndicator(fieldId);
    },
    []
  );

  useEffect(() => {
    const serviceIdFromUrl = searchParams.get('serviceId');
    if (serviceIdFromUrl && serviceWorkflows.some(s => s.id === serviceIdFromUrl)) {
      setSelectedWorkflowId(serviceIdFromUrl);
    } else if (!selectedWorkflowId && serviceWorkflows.length > 0) {
      setSelectedWorkflowId(serviceWorkflows[0].id);
    }
  }, [searchParams, serviceWorkflows, selectedWorkflowId]);

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

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;
    const currentServices = [...serviceWorkflows];
    const index = currentServices.findIndex(s => s.id === serviceToDelete.id);
    
    await deleteService(serviceToDelete.id);
    
    setServiceToDelete(null);
    setIsDeleteConfirmOpen(false);

    setTimeout(() => {
        const remainingServices = currentServices.filter(s => s.id !== serviceToDelete.id);
        if (selectedWorkflowId === serviceToDelete.id) {
            if (remainingServices.length > 0) {
                const nextIndex = Math.max(0, index -1);
                const nextService = remainingServices[nextIndex] || remainingServices[0];
                setSelectedWorkflowId(nextService?.id || null);
            } else {
                setSelectedWorkflowId(null);
            }
        }
    }, 0);
};

  const handleStageTitleChange = (serviceId: string, subServiceId: string | null, stageId: string, newTitle: string) => {
    updateStageInSubService(serviceId, subServiceId, stageId, { title: newTitle });
    triggerSaveIndicator(`stage-title-${stageId}`);
  }

  const handleActionChange = (stage: WorkflowStage, actionId: string, updates: Partial<WorkflowAction>) => {
    if(selectedWorkflow) {
        const subService = selectedWorkflow.subServices.find(ss => ss.stages.some(s => s.id === stage.id));
        updateActionInStage(selectedWorkflow.id, subService?.id ?? null, stage.id, actionId, updates);
        const fieldKey = 'title' in updates ? 'title' : 'dueDays';
        triggerSaveIndicator(`action-${actionId}-${fieldKey}`);
    }
  };

  const handleAddNewActionToStage = (stageId: string) => {
    if (selectedWorkflow) {
      const subService = selectedWorkflow.subServices.find(ss => ss.stages.some(s => s.id === stageId));
      addActionToStage(selectedWorkflow.id, subService?.id ?? null, stageId);
    }
  };
  
  const renderStages = (stages: WorkflowStage[], serviceId: string, subServiceId: string | null) => {
    if (!stages) return null;
    return (
      <Accordion type="multiple" className="w-full space-y-4" defaultValue={(stages || []).map(s => s.id)}>
        {(stages || []).map((stage, stageIndex) => {
          return (
            <AccordionItem value={stage.id} key={stage.id} className="border rounded-lg bg-card overflow-hidden">
              <div className="flex items-center p-4 pr-2">
                <AccordionTrigger className="p-0 hover:no-underline flex-grow">
                    <div className="flex items-center text-left gap-3 w-full">
                        <StageNumberIcon index={stageIndex} />
                         <div className="flex-grow">
                             <Input 
                                value={stage.title}
                                onChange={(e) => handleStageTitleChange(serviceId, subServiceId, stage.id, e.target.value)}
                                className="font-semibold text-base border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                                disabled={!canEditWorkflow}
                            />
                            <AutoSaveIndicator isSaving={savingField === `stage-title-${stage.id}`} />
                        </div>
                    </div>
                </AccordionTrigger>
                {canEditWorkflow && (
                  <div className="pl-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-1" onClick={() => deleteStageFromSubService(serviceId, subServiceId, stage.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                  </div>
                )}
              </div>
              <AccordionContent className="border-t p-4 space-y-4">
                  {stage.actions && stage.actions.length > 0 && (
                      <div className="space-y-4">
                          {stage.actions.map((action) => (
                              <div key={action.id} className="flex flex-col sm:flex-row items-center gap-2 group">
                                  <div className="flex-grow w-full">
                                    <Label className="text-xs text-muted-foreground">Título de la Tarea</Label>
                                    <Input 
                                        value={action.title}
                                        onChange={(e) => handleActionChange(stage, action.id, { title: e.target.value })}
                                        placeholder="Descripción de la tarea..."
                                        className="h-8"
                                        disabled={!canEditWorkflow}
                                    />
                                    <AutoSaveIndicator isSaving={savingField === `action-${action.id}-title`} />
                                  </div>
                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <div className="w-full sm:w-48">
                                      <Label className="text-xs text-muted-foreground">Días para Vencer</Label>
                                      <div className="flex items-center gap-2">
                                        <Slider
                                            value={[action.dueDays || 0]}
                                            onValueChange={(value) => handleActionChange(stage, action.id, { dueDays: value[0] })}
                                            max={7}
                                            step={1}
                                            className="w-full"
                                            disabled={!canEditWorkflow}
                                        />
                                        <span className="text-sm font-medium w-6 text-center">{action.dueDays || 0}</span>
                                      </div>
                                      <AutoSaveIndicator isSaving={savingField === `action-${action.id}-dueDays`} />
                                    </div>
                                    <div className="flex items-end h-8">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="default" size="icon" className="h-8 w-8 shrink-0 bg-primary/80 text-primary-foreground hover:bg-primary" onClick={() => handleOpenTaskDialog(action.title, action.dueDays)}>
                                                    <ListTodo className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Crear tarea desde esta acción</p></TooltipContent>
                                        </Tooltip>
                                        {canEditWorkflow && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => deleteActionFromStage(serviceId, subServiceId, stage.id, action.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive"/>
                                            </Button>
                                        )}
                                    </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
                  {canEditWorkflow && (
                       <Button variant="outline" size="sm" onClick={() => handleAddNewActionToStage(stage.id)}>
                          <Plus className="h-4 w-4 mr-2"/>Añadir Tarea
                      </Button>
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
                title="Configuración de Flujos de Trabajo" 
                description="Gestione las etapas y acciones de sus servicios."
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
        title="Configuración de Flujos de Trabajo" 
        description="Gestione las etapas y acciones de sus servicios."
        children={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" asChild>
                <Link href="/crm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al CRM
                </Link>
            </Button>
            <Button onClick={handleAddService}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Servicio
            </Button>
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
                                    <SelectValue placeholder="Seleccione un servicio para configurar..." />
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
                          {canEditWorkflow && !editingSubServiceId && (
                            <div className="pl-2 flex items-center">
                              <Button variant="outline" size="sm" onClick={() => handleStartEditSubService(subService)} disabled={!!editingSubServiceId || !canEditWorkflow}><Edit className="h-4 w-4 mr-2"/>Editar</Button>
                               <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="default" size="icon" className="h-8 w-8 ml-1 bg-primary/80 text-primary-foreground hover:bg-primary" onClick={(e) => { e.stopPropagation(); handleOpenTaskDialog(subService.name);}}><ListTodo className="h-4 w-4"/></Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Crear tarea desde este sub-servicio</p></TooltipContent>
                                </Tooltip>
                              <Button variant="ghost" size="icon" className="h-8 w-8 ml-1" onClick={() => deleteSubServiceFromService(selectedWorkflow.id, subService.id)} disabled={!canEditWorkflow}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </div>
                          )}
                        </div>
                        <AccordionContent className="p-4 space-y-3">
                          {renderStages(subService.stages, selectedWorkflow.id, subService.id)}
                          {canEditWorkflow && (
                            <div className="mt-4">
                              <Button variant="outline" onClick={() => handleAddStage(selectedWorkflow.id, subService.id)} disabled={!canEditWorkflow}><Plus className="h-4 w-4 mr-2"/>Añadir Etapa a este Sub-Servicio</Button>
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
                        <Button variant="outline" onClick={() => handleAddStage(selectedWorkflow.id, selectedWorkflow.subServices?.[0]?.id ?? null)} disabled={!canEditWorkflow}><Plus className="h-4 w-4 mr-2"/>Añadir Nueva Etapa</Button>
                      </div>
                    )}
                  </div>
                )}
                
                {canEditWorkflow && selectedWorkflow.subServices && (
                  <div className="mt-6 pt-6 border-t">
                    <Button variant="outline" onClick={() => handleAddSubService(selectedWorkflow.id)} disabled={!canEditWorkflow}><Plus className="h-4 w-4 mr-2"/>Añadir Sub-Servicio</Button>
                  </div>
                )}
              </div>
            ) : (
                <div className="text-center text-muted-foreground py-10 border border-dashed rounded-lg">
                    <p>No ha seleccionado un servicio o no hay servicios creados.</p>
                    <p className="text-sm">Haga clic en "Añadir Servicio" para empezar.</p>
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
                Esta acción no se puede deshacer. ¿Está seguro de que desea eliminar el servicio "{serviceToDelete?.name}" y todos sus sub-servicios, etapas y acciones asociados?
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

        <AddTaskDialog
            isOpen={isAddTaskDialogOpen}
            onOpenChange={setIsAddTaskDialogOpen}
            initialTaskData={initialTaskDataForDialog}
            onTaskAdd={async (taskData) => {
                const newTask = await addTask(taskData);
                if(newTask) {
                    showNotification('success', 'Tarea Creada', `La tarea "${newTask.title}" ha sido creada.`);
                    return true;
                }
                return false;
            }}
        />

        {promptNameConfig && (
            <PromptNameDialog
                isOpen={isPromptNameOpen}
                onOpenChange={setIsPromptNameOpen}
                title={promptNameConfig.title}
                description={promptNameConfig.description}
                label={promptNameConfig.label}
                onSave={promptNameConfig.onSave}
            />
        )}
    </TooltipProvider>
  );
}
