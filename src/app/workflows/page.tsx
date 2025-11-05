
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCRMData, type WorkflowStage, type ServiceWorkflow, type WorkflowAction, type SubObjective, type SubService, type Task } from "@/contexts/CRMDataContext"; 
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
    addSubServiceToWorkflow,
    deleteSubService,
    updateSubService,
    addActionToStage,
    deleteActionFromStage,
    updateActionInStage,
    addStageToSubService,
    updateStageInSubService,
    deleteStageFromSubService,
  } = useCRMData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showNotification } = useGlobalNotification();
  const { addTask } = useCRMData();

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editableWorkflow, setEditableWorkflow] = useState<ServiceWorkflow | null>(null);
  const [originalWorkflow, setOriginalWorkflow] = useState<ServiceWorkflow | null>(null);

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
    setOriginalWorkflow(deepCopy);
    setEditableWorkflow(deepCopy);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditableWorkflow(null);
    setOriginalWorkflow(null);
  };

  const handleSaveChanges = () => {
    if (!editableWorkflow) return;
    setServiceWorkflows(prev => prev.map(wf => wf.id === editableWorkflow.id ? editableWorkflow : wf));
    setIsEditing(false);
    setEditableWorkflow(null);
    setOriginalWorkflow(null);
    showNotification('success', 'Flujo Guardado', 'Los cambios en el flujo de trabajo han sido guardados.');
  };
  
  const workflowToDisplay = isEditing ? editableWorkflow : selectedWorkflow;

  // --- Render Functions ---
  
  const renderSubService = (subService: SubService) => (
    <AccordionItem value={subService.id} key={subService.id} asChild>
      <Card className="bg-muted/30">
        <AccordionTrigger className="w-full p-0 [&_svg]:ml-auto [&_svg]:mr-4 hover:no-underline">
          <CardHeader className="flex-1 text-left flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderCog className="h-5 w-5 text-accent"/>
              <CardTitle className="text-md">
                {isEditing ? (
                  <Input 
                    value={subService.name}
                    onClick={e => e.stopPropagation()}
                    onChange={e => updateSubService(editableWorkflow!.id, subService.id, { name: e.target.value }, setEditableWorkflow)}
                    className="h-8"
                  />
                ) : subService.name}
              </CardTitle>
            </div>
          </CardHeader>
        </AccordionTrigger>
        <AccordionContent className="p-4 pt-0">
          {subService.stages && subService.stages.length > 0 ? (
            renderStages(subService.stages, subService.id)
          ) : (
             <div className="text-center text-muted-foreground py-6 border border-dashed rounded-md">
                <p className="text-sm">No hay etapas en este sub-servicio.</p>
                {isEditing && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => addStageToSubService(editableWorkflow!.id, subService.id, setEditableWorkflow)}>
                    <Plus className="mr-2 h-4 w-4" />Añadir Etapa
                  </Button>
                )}
            </div>
          )}
          {isEditing && subService.stages.length > 0 && (
             <Button variant="outline" size="sm" className="mt-4" onClick={() => addStageToSubService(editableWorkflow!.id, subService.id, setEditableWorkflow)}>
                <Plus className="mr-2 h-4 w-4" />Añadir Etapa
              </Button>
          )}
        </AccordionContent>
      </Card>
    </AccordionItem>
  );

  const renderStages = (stages: WorkflowStage[], subServiceId: string) => (
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
                      onChange={(e) => updateStageInSubService(editableWorkflow!.id, subServiceId, stage.id, { title: e.target.value }, setEditableWorkflow)}
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
                <Button variant="ghost" size="icon" className="h-8 w-8 ml-1" onClick={() => deleteStageFromSubService(editableWorkflow!.id, subServiceId, stage.id, setEditableWorkflow)}>
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
                            onChange={(e) => updateActionInStage(editableWorkflow!.id, subServiceId, stage.id, action.id, { title: e.target.value }, setEditableWorkflow)}
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
                                onValueChange={(value) => updateActionInStage(editableWorkflow!.id, subServiceId, stage.id, action.id, { dueDays: value[0] }, setEditableWorkflow)}
                                max={7}
                                step={1}
                                className="w-full"
                              />
                              <span className="text-sm font-medium w-6 text-center">{action.dueDays || 0}</span>
                            </div>
                          </div>
                          <div className="flex items-end h-8">
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => deleteActionFromStage(editableWorkflow!.id, subServiceId, stage.id, action.id, setEditableWorkflow)}>
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
              <Button variant="outline" size="sm" onClick={() => addActionToStage(editableWorkflow!.id, subServiceId, stage.id, setEditableWorkflow)}>
                <Plus className="h-4 w-4 mr-2"/>Añadir Tarea
              </Button>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
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
                <CardContent className="border-t pt-6 space-y-4">
                  {isEditing && (
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Gestión de Sub-Servicios</h3>
                      <Button size="sm" onClick={() => {
                        setPromptNameConfig({
                          title: "Añadir Sub-Servicio",
                          description: `Añadir un nuevo sub-servicio a "${workflowToDisplay.name}".`,
                          label: "Nombre del Sub-Servicio",
                          onSave: (name) => addSubServiceToWorkflow(workflowToDisplay.id, name, setEditableWorkflow),
                        });
                        setIsPromptNameOpen(true);
                      }}>
                        <Plus className="mr-2 h-4 w-4"/> Añadir Sub-Servicio
                      </Button>
                    </div>
                  )}

                  <Accordion type="multiple" className="w-full space-y-4" defaultValue={workflowToDisplay.subServices.map(s => s.id)}>
                    {workflowToDisplay.subServices && workflowToDisplay.subServices.length > 0 ? (
                      workflowToDisplay.subServices.map(subService => renderSubService(subService))
                    ) : (
                      <div className="text-center text-muted-foreground py-10 border border-dashed rounded-lg">
                          <p>Este servicio no tiene sub-servicios definidos.</p>
                      </div>
                    )}
                  </Accordion>
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
