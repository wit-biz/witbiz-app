
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCRMData, type WorkflowStage, type ServiceWorkflow, type WorkflowAction, type SubService } from "@/contexts/CRMDataContext"; 
import { Edit, Save, Trash2, Plus, X, Loader2, UploadCloud, ChevronsRight, FileText, ListTodo, Workflow as WorkflowIcon, ArrowLeft, PlusCircle, Layers, FolderCog, Redo } from "lucide-react";
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
import { type Task } from '@/lib/types';


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

  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [initialTaskDataForDialog, setInitialTaskDataForDialog] = useState<Partial<Omit<Task, 'id'>>>({});

  const [isPromptNameOpen, setIsPromptNameOpen] = useState(false);
  const [promptNameConfig, setPromptNameConfig] = useState<{
    title: string;
    description: string;
    label: string;
    onSave: (name: string) => void;
    inputPlaceholder?: string;
  } | null>(null);

  const canEditWorkflow = currentUser?.permissions.crm_edit ?? true;

  const handleOpenTaskDialog = (title: string, dueDays = 0) => {
    setInitialTaskDataForDialog({ title: title, dueDays: dueDays });
    setIsAddTaskDialogOpen(true);
  };
  
  const handleAddNewService = () => {
    setPromptNameConfig({
      title: "Añadir Nuevo Servicio",
      description: "Introduzca un nombre para el nuevo servicio. Podrá configurar sus sub-servicios y etapas más tarde.",
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
    const deepCopy = JSON.parse(JSON.stringify(selectedWorkflow));
    setEditableWorkflow(deepCopy);
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
  
  const workflowToDisplay = isEditing ? editableWorkflow : selectedWorkflow;

  // --- Handlers for direct stages ---
  const handleAddDirectStage = () => {
    if (!editableWorkflow) return;
    const newStage: WorkflowStage = { id: `stage-${Date.now()}`, title: "Nueva Etapa Principal", order: (editableWorkflow.stages?.length || 0) + 1, actions: [] };
    setEditableWorkflow(prev => prev ? { ...prev, stages: [...(prev.stages || []), newStage] } : null);
  };

  const handleDeleteDirectStage = (stageId: string) => {
    if (!editableWorkflow) return;
    setEditableWorkflow(prev => prev ? { ...prev, stages: prev.stages?.filter(s => s.id !== stageId) || [] } : null);
  };
  
  const handleUpdateDirectStage = (stageId: string, updates: Partial<WorkflowStage>) => {
     if (!editableWorkflow) return;
     setEditableWorkflow(prev => prev ? { ...prev, stages: prev.stages?.map(s => s.id === stageId ? {...s, ...updates} : s) || [] } : null);
  };

  const handleAddActionToDirectStage = (stageId: string) => {
    if (!editableWorkflow) return;
    const newAction: WorkflowAction = { id: `action-${Date.now()}`, title: "Nueva Tarea...", dueDays: 1, order: 1, subActions: [] };
    setEditableWorkflow(prev => prev ? {
        ...prev,
        stages: prev.stages?.map(s => s.id === stageId ? { ...s, actions: [...s.actions, newAction] } : s) || []
    } : null);
  };

  const handleDeleteActionFromDirectStage = (stageId: string, actionId: string) => {
    if (!editableWorkflow) return;
    setEditableWorkflow(prev => prev ? {
        ...prev,
        stages: prev.stages?.map(s => s.id === stageId ? { ...s, actions: s.actions.filter(a => a.id !== actionId) } : s) || []
    } : null);
  };
  
  const handleUpdateActionInDirectStage = (stageId: string, actionId: string, updates: Partial<WorkflowAction>) => {
    if (!editableWorkflow) return;
    setEditableWorkflow(prev => prev ? {
        ...prev,
        stages: prev.stages?.map(s => s.id === stageId ? { ...s, actions: s.actions.map(a => a.id === actionId ? { ...a, ...updates } : a) } : s) || []
    } : null);
  };

  // --- Handlers for sub-service stages ---
  const handleAddSubService = () => {
    if (!editableWorkflow) return;
    setPromptNameConfig({
        title: "Añadir Sub-Servicio",
        description: `Añadir un nuevo sub-servicio a "${workflowToDisplay?.name}".`,
        label: "Nombre del Sub-Servicio",
        onSave: (name) => {
            const newSubService: SubService = { id: `sub-${Date.now()}`, name, stages: [] };
            setEditableWorkflow(prev => prev ? { ...prev, subServices: [...prev.subServices, newSubService] } : null);
        }
    });
    setIsPromptNameOpen(true);
  };

  const handleDeleteSubService = (subServiceId: string) => {
    if (!editableWorkflow) return;
    setEditableWorkflow(prev => prev ? { ...prev, subServices: prev.subServices.filter(ss => ss.id !== subServiceId) } : null);
  };
  
  const handleUpdateSubService = (subServiceId: string, updates: Partial<SubService>) => {
     if (!editableWorkflow) return;
     setEditableWorkflow(prev => prev ? { ...prev, subServices: prev.subServices.map(ss => ss.id === subServiceId ? {...ss, ...updates} : ss) } : null);
  };

  const handleAddStageToSubService = (subServiceId: string) => {
    if (!editableWorkflow) return;
    const newStage: WorkflowStage = { id: `stage-${Date.now()}`, title: "Nueva Etapa", order: 1, actions: [] };
    setEditableWorkflow(prev => prev ? {
        ...prev,
        subServices: prev.subServices.map(ss => ss.id === subServiceId ? { ...ss, stages: [...ss.stages, newStage] } : ss)
    } : null);
  };

  const handleDeleteStageFromSubService = (subServiceId: string, stageId: string) => {
    if (!editableWorkflow) return;
    setEditableWorkflow(prev => prev ? {
        ...prev,
        subServices: prev.subServices.map(ss => ss.id === subServiceId ? { ...ss, stages: ss.stages.filter(s => s.id !== stageId) } : ss)
    } : null);
  };

  const handleUpdateStageInSubService = (subServiceId: string, stageId: string, updates: Partial<WorkflowStage>) => {
    if (!editableWorkflow) return;
    setEditableWorkflow(prev => prev ? {
        ...prev,
        subServices: prev.subServices.map(ss => ss.id === subServiceId ? { ...ss, stages: ss.stages.map(s => s.id === stageId ? { ...s, ...updates } : s) } : ss)
    } : null);
  };
  
  const handleAddActionToSubServiceStage = (subServiceId: string, stageId: string) => {
    if (!editableWorkflow) return;
    const newAction: WorkflowAction = { id: `action-${Date.now()}`, title: "Nueva Tarea...", dueDays: 1, order: 1, subActions: [] };
    setEditableWorkflow(prev => prev ? {
        ...prev,
        subServices: prev.subServices.map(ss => ss.id === subServiceId ? { ...ss, stages: ss.stages.map(s => s.id === stageId ? { ...s, actions: [...s.actions, newAction] } : s) } : ss)
    } : null);
  };

  const handleDeleteActionFromSubServiceStage = (subServiceId: string, stageId: string, actionId: string) => {
    if (!editableWorkflow) return;
     setEditableWorkflow(prev => prev ? {
        ...prev,
        subServices: prev.subServices.map(ss => ss.id === subServiceId ? { ...ss, stages: ss.stages.map(s => s.id === stageId ? { ...s, actions: s.actions.filter(a => a.id !== actionId) } : s) } : ss)
    } : null);
  };

  const handleUpdateActionInSubServiceStage = (subServiceId: string, stageId: string, actionId: string, updates: Partial<WorkflowAction>) => {
    if (!editableWorkflow) return;
    setEditableWorkflow(prev => prev ? {
        ...prev,
        subServices: prev.subServices.map(ss => ss.id === subServiceId ? { ...ss, stages: ss.stages.map(s => s.id === stageId ? { ...s, actions: s.actions.map(a => a.id === actionId ? { ...a, ...updates } : a) } : s) } : ss)
    } : null);
  };

  // --- Render Functions ---
  
  const renderStages = (
    stages: WorkflowStage[], 
    handlers: {
        deleteStage: (stageId: string) => void;
        updateStage: (stageId: string, updates: Partial<WorkflowStage>) => void;
        addAction: (stageId: string) => void;
        deleteAction: (stageId: string, actionId: string) => void;
        updateAction: (stageId: string, actionId: string, updates: Partial<WorkflowAction>) => void;
    }
  ) => (
    <Accordion type="multiple" className="w-full space-y-4" defaultValue={stages.map(s => s.id)}>
      {stages.map((stage, stageIndex) => (
        <AccordionItem value={stage.id} key={stage.id} className="border rounded-lg bg-card overflow-hidden">
          <div className="flex items-center p-4 pr-2">
            <AccordionTrigger className="p-0 hover:no-underline flex-grow">
              <div className="flex items-center text-left gap-3 w-full">
                <StageNumberIcon index={stageIndex} />
                <div className="flex-grow">
                  {isEditing ? (
                    <Input 
                      value={stage.title}
                      onClick={e => e.stopPropagation()}
                      onChange={(e) => handlers.updateStage(stage.id, { title: e.target.value })}
                      className="font-semibold text-base"
                    />
                  ) : (
                    <h4 className="font-semibold text-base">{stage.title}</h4>
                  )}
                </div>
              </div>
            </AccordionTrigger>
            {isEditing && (
              <div className="pl-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 ml-1" onClick={() => handlers.deleteStage(stage.id)}>
                  <Trash2 className="h-4 w-4 text-destructive"/>
                </Button>
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
                            onChange={(e) => handlers.updateAction(stage.id, action.id, { title: e.target.value })}
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
                                onValueChange={(value) => handlers.updateAction(stage.id, action.id, { dueDays: value[0] })}
                                max={7}
                                step={1}
                                className="w-full"
                              />
                              <span className="text-sm font-medium w-6 text-center">{action.dueDays || 0}</span>
                            </div>
                          </div>
                          <div className="flex items-end h-8">
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handlers.deleteAction(stage.id, action.id)}>
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
              <Button variant="outline" size="sm" onClick={() => handlers.addAction(stage.id)}>
                <Plus className="h-4 w-4 mr-2"/>Añadir Tarea
              </Button>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );

  const renderSubService = (subService: SubService) => (
    <AccordionItem value={subService.id} key={subService.id} asChild>
      <Card className="bg-muted/30">
        <AccordionTrigger className="w-full p-0 [&_svg]:ml-auto [&_svg]:mr-4 hover:no-underline">
          <CardHeader className="flex-1 text-left flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderCog className="h-5 w-5 text-accent"/>
              {isEditing ? (
                  <Input 
                    value={subService.name}
                    onClick={e => e.stopPropagation()}
                    onChange={e => handleUpdateSubService(subService.id, { name: e.target.value })}
                    className="h-8 text-md font-semibold p-1"
                  />
              ) : <CardTitle className="text-md">{subService.name}</CardTitle>}
            </div>
             {isEditing && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDeleteSubService(subService.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive"/>
                </Button>
             )}
          </CardHeader>
        </AccordionTrigger>
        <AccordionContent className="p-4 pt-0">
          {subService.stages && subService.stages.length > 0 ? (
            renderStages(subService.stages, {
                deleteStage: (stageId) => handleDeleteStageFromSubService(subService.id, stageId),
                updateStage: (stageId, updates) => handleUpdateStageInSubService(subService.id, stageId, updates),
                addAction: (stageId) => handleAddActionToSubServiceStage(subService.id, stageId),
                deleteAction: (stageId, actionId) => handleDeleteActionFromSubServiceStage(subService.id, stageId, actionId),
                updateAction: (stageId, actionId, updates) => handleUpdateActionInSubServiceStage(subService.id, stageId, actionId, updates),
            })
          ) : (
             <div className="text-center text-muted-foreground py-6 border border-dashed rounded-md">
                <p className="text-sm">No hay etapas en este sub-servicio.</p>
                {isEditing && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => handleAddStageToSubService(subService.id)}>
                    <Plus className="mr-2 h-4 w-4" />Añadir Etapa
                  </Button>
                )}
            </div>
          )}
          {isEditing && subService.stages.length > 0 && (
             <Button variant="outline" size="sm" className="mt-4" onClick={() => handleAddStageToSubService(subService.id)}>
                <Plus className="mr-2 h-4 w-4" />Añadir Etapa
              </Button>
          )}
        </AccordionContent>
      </Card>
    </AccordionItem>
  );

  // --- Loading / Empty States ---

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

  // --- Main Render ---

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
                      <Button variant="ghost" onClick={handleCancelEditing}><Redo className="mr-2 h-4 w-4"/>Cancelar</Button>
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
      
        <main className="p-4 md:p-8 space-y-6">
          <Card>
              <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
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
                      {canEditWorkflow && !isEditing && (
                         <Button variant="outline" size="sm" onClick={handleAddNewService}><PlusCircle className="mr-2 h-4 w-4"/>Añadir Servicio</Button>
                      )}
                  </div>
              </CardHeader>

              {workflowToDisplay ? (
                <CardContent className="border-t pt-6 space-y-6">
                  {/* Direct Stages Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Layers className="h-5 w-5 text-primary"/>Etapas Principales</h3>
                    {isEditing && (
                      <Button size="sm" variant="outline" onClick={handleAddDirectStage}><Plus className="mr-2 h-4 w-4"/>Añadir Etapa Principal</Button>
                    )}
                    {workflowToDisplay.stages && workflowToDisplay.stages.length > 0 ? (
                       renderStages(workflowToDisplay.stages, {
                           deleteStage: handleDeleteDirectStage,
                           updateStage: handleUpdateDirectStage,
                           addAction: handleAddActionToDirectStage,
                           deleteAction: handleDeleteActionFromDirectStage,
                           updateAction: handleUpdateActionInDirectStage,
                       })
                    ) : (
                      <p className="text-sm text-muted-foreground">{isEditing ? 'Añada una etapa para empezar.' : 'No hay etapas principales definidas.'}</p>
                    )}
                  </div>
                  
                  {/* Sub-Services Section */}
                  <div className="space-y-4">
                     <h3 className="text-lg font-semibold flex items-center gap-2"><FolderCog className="h-5 w-5 text-primary"/>Sub-Servicios</h3>
                     {isEditing && (
                        <Button size="sm" variant="outline" onClick={handleAddSubService}><Plus className="mr-2 h-4 w-4"/> Añadir Sub-Servicio</Button>
                     )}
                     <Accordion type="multiple" className="w-full space-y-4" defaultValue={workflowToDisplay.subServices?.map(s => s.id)}>
                        {workflowToDisplay.subServices && workflowToDisplay.subServices.length > 0 ? (
                          workflowToDisplay.subServices.map(subService => renderSubService(subService))
                        ) : (
                          <p className="text-sm text-muted-foreground">{isEditing ? 'Añada un sub-servicio para crear flujos anidados.' : 'No hay sub-servicios definidos.'}</p>
                        )}
                      </Accordion>
                  </div>
                </CardContent>
              ) : (
                  <CardContent className="border-t">
                      <div className="text-center text-muted-foreground py-16">
                          <p>No ha seleccionado un servicio o no hay servicios creados.</p>
                      </div>
                  </CardContent>
              )}
          </Card>
        </main>

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
                inputPlaceholder={promptNameConfig.inputPlaceholder}
            />
        )}
      </div>
    </TooltipProvider>
  );
}

    