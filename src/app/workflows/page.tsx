
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

export default function WorkflowConfigurationPage() {
  const { 
    currentUser,
    serviceWorkflows,
    isLoadingWorkflows,
    addService,
    updateService, 
    deleteService, 
    setServiceWorkflows,
  } = useCRMData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showNotification } = useGlobalNotification();
  const { addTask } = useCRMData();

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editableWorkflow, setEditableWorkflow] = useState<ServiceWorkflow | null>(null);

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
  
  const handleStartEditing = () => {
    if (!selectedWorkflow) return;
    setEditableWorkflow(JSON.parse(JSON.stringify(selectedWorkflow))); // Deep copy
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditableWorkflow(null);
  };

  const handleSaveChanges = () => {
    if (!editableWorkflow) return;
    setServiceWorkflows(prev => prev.map(wf => wf.id === editableWorkflow.id ? editableWorkflow : wf));
    setIsEditing(false);
    setEditableWorkflow(null);
    showNotification('success', 'Flujo Guardado', 'Los cambios en el flujo de trabajo han sido guardados.');
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

  const handleStageChange = (stageId: string, updates: Partial<WorkflowStage>) => {
    if (!editableWorkflow) return;
    const newSubServices = editableWorkflow.subServices.map(sub => ({
      ...sub,
      stages: sub.stages.map(s => s.id === stageId ? { ...s, ...updates } : s),
    }));
    setEditableWorkflow({ ...editableWorkflow, subServices: newSubServices });
  };
  
  const handleAddStageToSubService = (subServiceId: string) => {
    if (!editableWorkflow) return;
    const newStage: WorkflowStage = {
      id: `stage-${Date.now()}`,
      title: "Nueva Etapa",
      order: 100,
      actions: [],
    };
    const newSubServices = editableWorkflow.subServices.map(sub => {
      if (sub.id === subServiceId) {
        return { ...sub, stages: [...sub.stages, newStage] };
      }
      return sub;
    });
    setEditableWorkflow({ ...editableWorkflow, subServices: newSubServices });
  };
  
  const handleDeleteStage = (stageId: string) => {
    if (!editableWorkflow) return;
    const newSubServices = editableWorkflow.subServices.map(sub => ({
      ...sub,
      stages: sub.stages.filter(s => s.id !== stageId),
    }));
    setEditableWorkflow({ ...editableWorkflow, subServices: newSubServices });
  };

  const handleActionChange = (stageId: string, actionId: string, updates: Partial<WorkflowAction>) => {
    if (!editableWorkflow) return;
    const newSubServices = editableWorkflow.subServices.map(sub => ({
      ...sub,
      stages: sub.stages.map(s => {
        if (s.id === stageId) {
          return { ...s, actions: s.actions.map(a => a.id === actionId ? { ...a, ...updates } : a) };
        }
        return s;
      }),
    }));
    setEditableWorkflow({ ...editableWorkflow, subServices: newSubServices });
  };

  const handleAddActionToStage = (stageId: string) => {
    if (!editableWorkflow) return;
    const newAction: WorkflowAction = {
      id: `action-${Date.now()}`,
      title: "Nueva tarea...",
      dueDays: 1,
      order: 100,
      subActions: [],
    };
    const newSubServices = editableWorkflow.subServices.map(sub => ({
      ...sub,
      stages: sub.stages.map(s => {
        if (s.id === stageId) {
          return { ...s, actions: [...s.actions, newAction] };
        }
        return s;
      }),
    }));
    setEditableWorkflow({ ...editableWorkflow, subServices: newSubServices });
  };
  
  const handleDeleteAction = (stageId: string, actionId: string) => {
    if (!editableWorkflow) return;
    const newSubServices = editableWorkflow.subServices.map(sub => ({
      ...sub,
      stages: sub.stages.map(s => {
        if (s.id === stageId) {
          return { ...s, actions: s.actions.filter(a => a.id !== actionId) };
        }
        return s;
      }),
    }));
    setEditableWorkflow({ ...editableWorkflow, subServices: newSubServices });
  };
  
  const renderStages = (stages: WorkflowStage[], subServiceId: string) => {
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
                             {isEditing ? (
                                <Input 
                                    value={stage.title}
                                    onChange={(e) => handleStageChange(stage.id, { title: e.target.value })}
                                    className="font-semibold text-base"
                                    disabled={!isEditing}
                                />
                             ) : (
                                <h4 className="font-semibold text-base">{stage.title}</h4>
                             )}
                        </div>
                    </div>
                </AccordionTrigger>
                {isEditing && (
                  <div className="pl-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-1" onClick={() => handleDeleteStage(stage.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                  </div>
                )}
              </div>
              <AccordionContent className="border-t p-4 space-y-4">
                  {stage.actions && stage.actions.length > 0 && (
                      <div className="space-y-4">
                          {stage.actions.map((action) => (
                              <div key={action.id} className="flex flex-col sm:flex-row items-center gap-2 group">
                                  {isEditing ? (
                                    <>
                                       <div className="flex-grow w-full">
                                          <Label className="text-xs text-muted-foreground">Título de la Tarea</Label>
                                          <Input 
                                              value={action.title}
                                              onChange={(e) => handleActionChange(stage.id, action.id, { title: e.target.value })}
                                              placeholder="Descripción de la tarea..."
                                              className="h-8"
                                          />
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                          <div className="w-full sm:w-48">
                                            <Label className="text-xs text-muted-foreground">Días para Vencer</Label>
                                            <div className="flex items-center gap-2">
                                              <Slider
                                                  value={[action.dueDays || 0]}
                                                  onValueChange={(value) => handleActionChange(stage.id, action.id, { dueDays: value[0] })}
                                                  max={7}
                                                  step={1}
                                                  className="w-full"
                                              />
                                              <span className="text-sm font-medium w-6 text-center">{action.dueDays || 0}</span>
                                            </div>
                                          </div>
                                          <div className="flex items-end h-8">
                                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleDeleteAction(stage.id, action.id)}>
                                                  <Trash2 className="h-4 w-4 text-destructive"/>
                                              </Button>
                                          </div>
                                        </div>
                                    </>
                                  ) : (
                                    <div className="flex justify-between items-center w-full bg-secondary/30 p-2 rounded-md">
                                        <p className="text-sm">{action.title} <span className="text-muted-foreground text-xs">({action.dueDays} días)</span></p>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="default" size="icon" className="h-7 w-7" onClick={() => handleOpenTaskDialog(action.title, action.dueDays)}>
                                                    <ListTodo className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Crear tarea desde esta acción</p></TooltipContent>
                                        </Tooltip>
                                    </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  )}
                  {isEditing && (
                       <Button variant="outline" size="sm" onClick={() => handleAddActionToStage(stage.id)}>
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
  
  const workflowToDisplay = isEditing ? editableWorkflow : selectedWorkflow;
  
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
      <div className="flex flex-col min-h-screen">
      <Header 
        title="Configuración de Flujos de Trabajo" 
        description="Gestione las etapas y acciones de sus servicios."
      >
        <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" asChild>
                <Link href="/crm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al CRM
                </Link>
            </Button>
            {isEditing ? (
                <>
                    <Button onClick={handleSaveChanges}><Save className="mr-2 h-4 w-4"/>Guardar Cambios</Button>
                    <Button variant="ghost" onClick={handleCancelEditing}>Cancelar</Button>
                </>
            ) : (
                canEditWorkflow && (
                    <Button onClick={handleStartEditing} disabled={!selectedWorkflow}>
                        <Edit className="mr-2 h-4 w-4" />
                        Configurar Flujo
                    </Button>
                )
            )}
          </div>
      </Header>
      
      <div className="p-4 md:p-8 space-y-6">
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-grow w-full sm:w-auto">
                        <Label htmlFor="service-selector">Servicio Activo</Label>
                        <Select value={selectedWorkflowId || ""} onValueChange={(id) => setSelectedWorkflowId(id)} disabled={!serviceWorkflows || !serviceWorkflows.length || isEditing}>
                            <SelectTrigger id="service-selector" className="mt-1">
                                <SelectValue placeholder="Seleccione un servicio para configurar..." />
                            </SelectTrigger>
                            <SelectContent>
                                {serviceWorkflows && serviceWorkflows.map(service => (
                                    <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="border-t pt-4">
            {workflowToDisplay ? (
              <div className="space-y-4">
                {workflowToDisplay.subServices && workflowToDisplay.subServices.length > 0 ? (
                    renderStages(workflowToDisplay.subServices[0]?.stages ?? [], workflowToDisplay.subServices[0]?.id)
                ) : (
                  <div className="text-center text-muted-foreground py-10 border border-dashed rounded-lg">
                    <p>Este servicio no tiene etapas.</p>
                    {isEditing && workflowToDisplay.subServices[0] && (
                        <Button variant="outline" className="mt-4" onClick={() => handleAddStageToSubService(workflowToDisplay.subServices[0].id)}>
                            <Plus className="h-4 w-4 mr-2"/>Añadir Primera Etapa
                        </Button>
                    )}
                  </div>
                )}

                {isEditing && workflowToDisplay.subServices[0] && (
                  <div className="mt-4 pt-4 border-t">
                    <Button variant="outline" onClick={() => handleAddStageToSubService(workflowToDisplay.subServices[0].id)}>
                      <Plus className="h-4 w-4 mr-2"/>Añadir Nueva Etapa
                    </Button>
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
      </div>
    </TooltipProvider>
  );
}

    