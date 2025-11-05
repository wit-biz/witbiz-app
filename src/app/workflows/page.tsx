

"use client";

import React, { useState, useMemo, useEffect, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCRMData, type WorkflowStage, type ServiceWorkflow, type WorkflowAction, type SubStage, type SubSubStage } from "@/contexts/CRMDataContext"; 
import { Edit, Save, Trash2, Plus, X, Loader2, UploadCloud, ChevronsRight, FileText, ListTodo, Workflow as WorkflowIcon, ArrowLeft, PlusCircle, Layers, FolderCog, Redo, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useGlobalNotification } from "@/contexts/NotificationContext";
import { PromptNameDialog } from "@/components/shared/PromptNameDialog";
import { Slider } from "@/components/ui/slider";
import { AddTaskDialog } from "@/components/shared/AddTaskDialog";
import { Switch } from "@/components/ui/switch";

type AnyStage = WorkflowStage | SubStage | SubSubStage;

const StageCard = ({ 
    stage, 
    level,
    index,
    path,
    onUpdate,
    onDelete,
    onAddSubStage,
    onAddTask
} : {
    stage: AnyStage,
    level: 1 | 2 | 3,
    index: number,
    path: string,
    onUpdate: (path: string, updates: Partial<AnyStage>) => void,
    onDelete: (path: string) => void,
    onAddSubStage: (path: string) => void,
    onAddTask: (path: string, task: Omit<WorkflowAction, 'id'>) => void
}) => {
    
    const { currentUser } = useCRMData();
    const canEditWorkflow = currentUser?.permissions.crm_edit ?? true;
    const [addTaskDialogState, setAddTaskDialogState] = useState<{isOpen: boolean, path: string | null}>({isOpen: false, path: null});

    const levelStyles = {
        1: { card: "bg-card", trigger: "text-lg", icon: Layers },
        2: { card: "bg-muted/40", trigger: "text-md", icon: FolderCog },
        3: { card: "bg-muted/20", trigger: "text-base", icon: ListTodo }
    }
    const Icon = levelStyles[level].icon;

    const handleUpdateAction = (actionId: string, updates: Partial<WorkflowAction>) => {
        const newActions = stage.actions.map(a => a.id === actionId ? { ...a, ...updates } : a);
        onUpdate(path, { actions: newActions });
    };
    
    const handleDeleteAction = (actionId: string) => {
        const newActions = stage.actions.filter(a => a.id !== actionId);
        onUpdate(path, { actions: newActions });
    };
    
    const handleAddTaskToStage = (taskData: Omit<WorkflowAction, 'id'>) => {
         onAddTask(path, taskData);
    };

    return (
        <>
        <AccordionItem value={stage.id} className="border-none">
            <Card className={levelStyles[level].card}>
                <div className="flex items-center p-2 pr-1">
                     <AccordionTrigger className="p-2 hover:no-underline flex-grow text-left">
                        <div className="flex items-center gap-3">
                             <Icon className="h-5 w-5 text-accent"/>
                             {canEditWorkflow ? (
                                <Input 
                                    value={stage.title}
                                    onClick={e => e.stopPropagation()}
                                    onChange={e => onUpdate(path, { title: e.target.value })}
                                    className={cn("font-semibold h-8 p-1", levelStyles[level].trigger)}
                                />
                             ) : (
                                <h4 className={cn("font-semibold", levelStyles[level].trigger)}>{stage.title}</h4>
                             )}
                        </div>
                    </AccordionTrigger>
                    {canEditWorkflow && (
                        <div className="pl-2">
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(path)}>
                                <Trash2 className="h-4 w-4 text-destructive"/>
                            </Button>
                        </div>
                    )}
                </div>
                <AccordionContent className="border-t p-4 space-y-4">
                    {/* ACCIONES / TAREAS */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Tareas Automáticas</Label>
                        {stage.actions && stage.actions.length > 0 ? (
                            <div className="space-y-3">
                            {stage.actions.map(action => (
                                <div key={action.id} className="flex flex-col gap-3 p-3 rounded-md border bg-background">
                                    <div className="flex items-center justify-between">
                                        <Input 
                                          value={action.title}
                                          onChange={(e) => handleUpdateAction(action.id, { title: e.target.value })}
                                          placeholder="Descripción de la tarea..."
                                          className="text-sm font-medium"
                                          disabled={!canEditWorkflow}
                                        />
                                        {canEditWorkflow && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleDeleteAction(action.id)}>
                                              <Trash2 className="h-4 w-4 text-destructive"/>
                                            </Button>
                                        )}
                                    </div>
                                     {canEditWorkflow && (
                                        <>
                                        <div className="w-full">
                                            <Label className="text-xs text-muted-foreground">Días para Vencer</Label>
                                            <div className="flex items-center gap-2 pt-1">
                                                <Slider
                                                    value={[action.dueDays || 0]}
                                                    onValueChange={(value) => handleUpdateAction(action.id, { dueDays: value[0] })}
                                                    max={30}
                                                    step={1}
                                                    className="w-full"
                                                />
                                                <span className="text-sm font-medium w-6 text-center">{action.dueDays || 0}</span>
                                            </div>
                                        </div>
                                         <div className="flex items-center space-x-2">
                                            <Switch
                                                id={`req-doc-${action.id}`}
                                                checked={action.requiredDocumentForCompletion}
                                                onCheckedChange={(checked) => handleUpdateAction(action.id, { requiredDocumentForCompletion: checked, requiredDocuments: checked ? (action.requiredDocuments || [{ id: `doc-req-${Date.now()}`, description: '' }]) : [] })}
                                            />
                                            <Label htmlFor={`req-doc-${action.id}`} className="text-sm">
                                                Requiere documento(s) para completar
                                            </Label>
                                        </div>
                                        </>
                                     )}
                                </div>
                            ))}
                            </div>
                        ) : <p className="text-xs text-muted-foreground">No hay tareas definidas.</p>}
                         {canEditWorkflow && (
                          <Button variant="outline" size="sm" onClick={() => setAddTaskDialogState({isOpen: true, path: path})}>
                            <Plus className="h-4 w-4 mr-2"/>Añadir Tarea
                          </Button>
                        )}
                    </div>
                   
                    {/* SUB-ETAPAS / SUB-SUB-ETAPAS */}
                    {'subStages' in stage && (
                        <div className="pl-4 border-l-2 ml-2 space-y-4">
                             <Label className="text-sm font-medium">Sub-Etapas</Label>
                            {stage.subStages.map((sub, i) => (
                                <StageCard
                                    key={sub.id}
                                    stage={sub}
                                    level={2}
                                    index={i}
                                    path={`${path}.subStages.${i}`}
                                    onUpdate={onUpdate}
                                    onDelete={onDelete}
                                    onAddSubStage={onAddSubStage}
                                    onAddTask={onAddTask}
                                />
                            ))}
                             {canEditWorkflow && (
                                <Button variant="secondary" size="sm" onClick={() => onAddSubStage(path)}>
                                    <Plus className="mr-2 h-4 w-4"/>Añadir Sub-Etapa
                                </Button>
                            )}
                        </div>
                    )}
                    {'subSubStages' in stage && (
                         <div className="pl-6 border-l-2 ml-2 space-y-4">
                            <Label className="text-sm font-medium">Sub-Sub-Etapas</Label>
                            {stage.subSubStages.map((sub, i) => (
                                <StageCard
                                    key={sub.id}
                                    stage={sub}
                                    level={3}
                                    index={i}
                                    path={`${path}.subSubStages.${i}`}
                                    onUpdate={onUpdate}
                                    onDelete={onDelete}
                                    onAddSubStage={onAddSubStage} // This won't be called from level 3
                                    onAddTask={onAddTask}
                                />
                            ))}
                             {canEditWorkflow && (
                                <Button variant="outline" size="sm" onClick={() => onAddSubStage(path)}>
                                    <Plus className="mr-2 h-4 w-4"/>Añadir Sub-Sub-Etapa
                                </Button>
                            )}
                        </div>
                    )}
                </AccordionContent>
            </Card>
        </AccordionItem>

        <AddTaskDialog
            isOpen={addTaskDialogState.isOpen}
            onOpenChange={(isOpen) => setAddTaskDialogState({ isOpen, path: null })}
            clients={[]} // Not needed in workflow mode
            onTaskAdd={handleAddTaskToStage}
            isWorkflowMode={true}
        />
        </>
    );
};


export default function WorkflowConfigurationPage() {
  const { 
    currentUser,
    serviceWorkflows,
    isLoadingWorkflows,
    addService,
    setServiceWorkflows,
  } = useCRMData();
  const searchParams = useSearchParams();
  const { showNotification } = useGlobalNotification();

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [editableWorkflow, setEditableWorkflow] = useState<ServiceWorkflow | null>(null);
  
  const [isPromptNameOpen, setIsPromptNameOpen] = useState(false);
  const [promptNameConfig, setPromptNameConfig] = useState<{
    title: string;
    description: string;
    label: string;
    onSave: (name: string) => void;
    inputPlaceholder?: string;
  } | null>(null);
  
  const canEditWorkflow = currentUser?.permissions.crm_edit ?? true;
  
  const handleAddNewService = () => {
    setPromptNameConfig({
      title: "Añadir Nuevo Servicio",
      description: "Introduzca un nombre para el nuevo servicio. Podrá configurar sus flujos más tarde.",
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
    if (!serviceWorkflows) return;
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
  
  useEffect(() => {
    if (selectedWorkflow) {
        setEditableWorkflow(JSON.parse(JSON.stringify(selectedWorkflow)));
    } else {
        setEditableWorkflow(null);
    }
  }, [selectedWorkflow]);


  const handleDiscardChanges = () => {
      if(selectedWorkflow) {
        setEditableWorkflow(JSON.parse(JSON.stringify(selectedWorkflow)));
        showNotification('info', 'Cambios Descartados', 'Se han revertido las modificaciones.');
      }
  }

  const handleSaveChanges = () => {
    if (!editableWorkflow) return;
    const updatedWorkflows = serviceWorkflows.map(wf => wf.id === editableWorkflow.id ? editableWorkflow : wf);
    setServiceWorkflows(updatedWorkflows);
    showNotification('success', 'Flujo Guardado', 'Los cambios en el flujo de trabajo han sido guardados.');
  };
  
  const hasChanges = useMemo(() => {
    if (!selectedWorkflow || !editableWorkflow) return false;
    return JSON.stringify(selectedWorkflow) !== JSON.stringify(editableWorkflow);
  }, [selectedWorkflow, editableWorkflow]);


  const updateNestedState = (path: string, value: any, operation: 'update' | 'add' | 'delete') => {
      setEditableWorkflow(prev => {
          if (!prev) return null;
          const newWorkflow = JSON.parse(JSON.stringify(prev));
          const parts = path.split('.').filter(p => p !== '');

          let current: any = newWorkflow;
          for (let i = 0; i < parts.length -1; i++) {
              current = current[parts[i]];
          }
          
          const finalKey = parts[parts.length - 1];

          switch(operation) {
              case 'update':
                  current[finalKey] = { ...current[finalKey], ...value };
                  break;
              case 'add':
                  if (!Array.isArray(current[finalKey])) current[finalKey] = [];
                  current[finalKey].push(value);
                  break;
              case 'delete':
                 if (Array.isArray(current)) {
                    current.splice(Number(finalKey), 1);
                 } else {
                     delete current[finalKey];
                 }
                 break;
          }
          return newWorkflow;
      });
  };
  
  const handleUpdate = (path: string, updates: Partial<AnyStage>) => {
      updateNestedState(path, updates, 'update');
  };

  const handleDelete = (path: string) => {
      updateNestedState(path, null, 'delete');
  };

  const handleAddStage = () => {
       const newStage: WorkflowStage = { 
           id: `stage-${Date.now()}`, 
           title: "Nueva Etapa Principal", 
           order: (editableWorkflow?.stages.length || 0) + 1, 
           actions: [],
           subStages: [],
        };
       updateNestedState('stages', newStage, 'add');
  };

  const handleAddSubStage = (path: string) => {
      const parts = path.split('.');
      const parentIsStage = parts.length === 2; // e.g., "stages.0"

      if (parentIsStage) {
          const newSubStage: SubStage = {
              id: `subStage-${Date.now()}`,
              title: "Nueva Sub-Etapa",
              order: 1,
              actions: [],
              subSubStages: []
          };
          updateNestedState(`${path}.subStages`, newSubStage, 'add');
      } else { // Parent is a SubStage
          const newSubSubStage: SubSubStage = {
              id: `subSubStage-${Date.now()}`,
              title: "Nueva Sub-Sub-Etapa",
              order: 1,
              actions: []
          };
          updateNestedState(`${path}.subSubStages`, newSubSubStage, 'add');
      }
  };
  
  const handleAddTask = (path: string, task: Omit<WorkflowAction, 'id'>) => {
      const newTask: WorkflowAction = {
        ...task,
        id: `action-${Date.now()}`,
        order: 1, // Simplified
        subActions: [],
      };
      updateNestedState(`${path}.actions`, newTask, 'add');
  };

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
    <>
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
               <Button onClick={handleSaveChanges} disabled={!hasChanges}>
                  <Save className="mr-2 h-4 w-4"/>
                  Guardar Cambios
              </Button>
              <Button variant="ghost" onClick={handleDiscardChanges} disabled={!hasChanges}>Descartar</Button>
            </div>
        </Header>
      
        <main className="p-4 md:p-8 space-y-6">
          <Card>
              <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                      <div className="flex-grow w-full sm:w-auto">
                          <Label htmlFor="service-selector">Servicio Activo</Label>
                          <Select value={selectedWorkflowId || ""} onValueChange={(id) => setSelectedWorkflowId(id)} disabled={!serviceWorkflows || serviceWorkflows.length === 0 || hasChanges}>
                              <SelectTrigger id="service-selector" className="mt-1">
                                  <SelectValue placeholder="Seleccione un servicio para configurar..." />
                              </SelectTrigger>
                              <SelectContent>
                                  {serviceWorkflows && serviceWorkflows.map(service => (
                                      <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                          {hasChanges && (
                            <p className="text-xs text-destructive mt-2 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/>Tiene cambios sin guardar. Guarde o descarte para cambiar de servicio.</p>
                          )}
                      </div>
                      {canEditWorkflow && (
                         <Button variant="outline" size="sm" onClick={handleAddNewService}><PlusCircle className="mr-2 h-4 w-4"/>Añadir Servicio</Button>
                      )}
                  </div>
              </CardHeader>

              {editableWorkflow ? (
                <CardContent className="border-t pt-6 space-y-6">
                    <div className="space-y-4">
                        {canEditWorkflow && (
                            <Button size="sm" onClick={handleAddStage}>
                                <Plus className="mr-2 h-4 w-4"/>Añadir Etapa Principal
                            </Button>
                        )}
                        <Accordion type="multiple" className="w-full space-y-4" defaultValue={editableWorkflow.stages.map(s => s.id)}>
                            {editableWorkflow.stages && editableWorkflow.stages.length > 0 ? (
                                editableWorkflow.stages.map((stage, i) => (
                                    <StageCard
                                        key={stage.id}
                                        stage={stage}
                                        level={1}
                                        index={i}
                                        path={`stages.${i}`}
                                        onUpdate={handleUpdate}
                                        onDelete={handleDelete}
                                        onAddSubStage={handleAddSubStage}
                                        onAddTask={handleAddTask}
                                    />
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">{canEditWorkflow ? 'Añada una etapa para empezar.' : 'No hay etapas principales definidas.'}</p>
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
    </>
  );
}
