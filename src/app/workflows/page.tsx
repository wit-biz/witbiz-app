

"use client";

import React, { useState, useMemo, useEffect, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCRMData, type WorkflowStage, type ServiceWorkflow, type WorkflowAction, type SubStage, type SubSubStage } from "@/contexts/CRMDataContext"; 
import { Edit, Save, Trash2, Plus, X, Loader2, UploadCloud, ChevronsRight, FileText, ListTodo, Workflow as WorkflowIcon, ArrowLeft, PlusCircle, Layers, FolderCog, Redo, AlertTriangle, GripVertical } from "lucide-react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";


type AnyStage = WorkflowStage | SubStage | SubSubStage;

const StageNumberIcon = ({ path }: { path: string }) => {
    // path is like "stages.0.subStages.1.subSubStages.0"
    const numbers = path.split('.').filter(p => !isNaN(parseInt(p))).map(p => parseInt(p) + 1);
    const displayNumber = numbers.join('.');
    
    const level = numbers.length;
    const levelStyles = {
        1: "text-3xl", // Largest
        2: "text-2xl", // Medium
        3: "text-xl", // Smallest
    };

    return (
        <span className={cn("font-bold text-accent", levelStyles[level as keyof typeof levelStyles])}>
            {displayNumber}
        </span>
    );
};

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
        1: { card: "bg-card", trigger: "text-lg", subStageContainer: "", subStageButton: "secondary", subSubStageButton: "outline" },
        2: { card: "bg-muted/40", trigger: "text-md", subStageContainer: "pl-4", subStageButton: "outline", subSubStageButton: "ghost" },
        3: { card: "bg-muted/20", trigger: "text-base", subStageContainer: "pl-8", subStageButton: "ghost", subSubStageButton: "ghost" }
    }

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
                             <StageNumberIcon path={path} />
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
                        <div className={cn("border-l-2 ml-2 space-y-4", levelStyles[level].subStageContainer)}>
                             <Label className="text-sm font-medium">Sub-Etapas</Label>
                            {stage.subStages && stage.subStages.map((sub, i) => (
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
                                <Button variant={levelStyles[level].subStageButton as any} size="sm" onClick={() => onAddSubStage(path)}>
                                    <Plus className="mr-2 h-4 w-4"/>Añadir Sub-Etapa
                                </Button>
                            )}
                        </div>
                    )}
                    {'subSubStages' in stage && (
                         <div className={cn("border-l-2 ml-2 space-y-4", levelStyles[level].subSubStageContainer)}>
                            <Label className="text-sm font-medium">Sub-Sub-Etapas</Label>
                            {stage.subSubStages && stage.subSubStages.map((sub, i) => (
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
                                <div className="pl-6">
                                    <Button variant={levelStyles[level].subSubStageButton as any} size="sm" onClick={() => onAddSubStage(path)}>
                                        <Plus className="mr-2 h-4 w-4"/>Añadir Sub-Sub-Etapa
                                    </Button>
                                </div>
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


function SortableServiceItem({ service, onSelect, onDelete, isSelected, hasChanges }: { service: ServiceWorkflow, onSelect: (id: string) => void, onDelete: (service: ServiceWorkflow) => void, isSelected: boolean, hasChanges: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: service.id, disabled: hasChanges });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style}>
            <Card className={cn("cursor-pointer", isSelected && "ring-2 ring-primary border-primary", hasChanges && isSelected && "cursor-not-allowed opacity-70")}>
                <div className="flex items-center" onClick={() => !hasChanges && onSelect(service.id)}>
                    <div {...listeners} {...attributes} className={cn("p-3 cursor-grab touch-none", hasChanges && "cursor-not-allowed")}>
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-grow p-3 pr-2">
                        <p className="font-semibold text-sm truncate">{service.name}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 mr-1" onClick={(e) => { e.stopPropagation(); onDelete(service)}}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            </Card>
        </div>
    );
}


export default function WorkflowConfigurationPage() {
  const { 
    currentUser,
    serviceWorkflows: initialWorkflows,
    isLoadingWorkflows,
    addService,
    setServiceWorkflows,
    deleteService,
  } = useCRMData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showNotification } = useGlobalNotification();

  const [orderedWorkflows, setOrderedWorkflows] = useState<ServiceWorkflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [editableWorkflow, setEditableWorkflow] = useState<ServiceWorkflow | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceWorkflow | null>(null);
  
  const [isPromptNameOpen, setIsPromptNameOpen] = useState(false);
  const [promptNameConfig, setPromptNameConfig] = useState<{
    title: string;
    description: string;
    label: string;
    onSave: (name: string) => void;
    inputPlaceholder?: string;
  } | null>(null);
  
  const canEditWorkflow = currentUser?.permissions.crm_edit ?? true;

  useEffect(() => {
    if (initialWorkflows) {
      const sorted = [...initialWorkflows].sort((a,b) => (a.order || 0) - (b.order || 0));
      setOrderedWorkflows(sorted);

      const serviceIdFromUrl = searchParams.get('serviceId');
      if (serviceIdFromUrl && sorted.some(s => s.id === serviceIdFromUrl)) {
        setSelectedWorkflowId(serviceIdFromUrl);
      } else if (!selectedWorkflowId && sorted.length > 0) {
        setSelectedWorkflowId(sorted[0].id);
      }
    }
  }, [initialWorkflows]);

  const selectedWorkflow = useMemo(() => {
    if (!orderedWorkflows) return null;
    return orderedWorkflows.find(wf => wf.id === selectedWorkflowId) || null;
  }, [selectedWorkflowId, orderedWorkflows]);
  
  useEffect(() => {
    if (selectedWorkflow) {
        setEditableWorkflow(JSON.parse(JSON.stringify(selectedWorkflow)));
    } else {
        setEditableWorkflow(null);
    }
  }, [selectedWorkflow]);

  const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
          setOrderedWorkflows((items) => {
              const oldIndex = items.findIndex(item => item.id === active.id);
              const newIndex = items.findIndex(item => item.id === over.id);
              const newOrder = arrayMove(items, oldIndex, newIndex);
              
              const updatedOrderWithFirestore = newOrder.map((wf, index) => ({...wf, order: index}));
              setServiceWorkflows(updatedOrderWithFirestore);
              showNotification('info', 'Orden guardado', 'El nuevo orden de los servicios ha sido guardado.');

              return updatedOrderWithFirestore;
          });
      }
  };

  const handleAddNewService = () => {
    setPromptNameConfig({
      title: "Añadir Nuevo Servicio",
      description: "Introduzca un nombre para el nuevo servicio. Podrá configurar sus flujos más tarde.",
      label: "Nombre del Servicio",
      onSave: async (name) => {
        const newService = await addService(name);
        if (newService) {
          setSelectedWorkflowId(newService.id);
          router.push(`/workflows?serviceId=${newService.id}`);
        }
      },
    });
    setIsPromptNameOpen(true);
  };
  
  const handleSelectService = (id: string) => {
    if (hasChanges) {
        showNotification('warning', 'Cambios sin guardar', 'Guarde o descarte sus cambios antes de seleccionar otro servicio.');
        return;
    }
    setSelectedWorkflowId(id);
    router.push(`/workflows?serviceId=${id}`);
  }


  const handleDiscardChanges = () => {
      if(selectedWorkflow) {
        setEditableWorkflow(JSON.parse(JSON.stringify(selectedWorkflow)));
        showNotification('info', 'Cambios Descartados', 'Se han revertido las modificaciones.');
      }
  }

  const handleSaveChanges = () => {
    if (!editableWorkflow) return;
    const updatedWorkflows = orderedWorkflows.map(wf => wf.id === editableWorkflow.id ? editableWorkflow : wf);
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
                  if (typeof current[finalKey] === 'object' && current[finalKey] !== null && !Array.isArray(current[finalKey])) {
                    current[finalKey] = { ...current[finalKey], ...value };
                  } else {
                     current[finalKey] = value;
                  }
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
      const pathParts = path.split('.');
      const index = parseInt(pathParts.pop()!, 10);
      const parentPath = pathParts.join('.');
      
      setEditableWorkflow(prev => {
          if (!prev) return null;
          const newWorkflow = JSON.parse(JSON.stringify(prev));
          let parent = newWorkflow;
          if (parentPath) {
              parentPath.split('.').forEach(part => {
                  parent = parent[part];
              });
          }
          parent[index] = { ...parent[index], ...updates };
          return newWorkflow;
      });
  };

  const handleDelete = (path: string) => {
    const pathParts = path.split('.');
    const indexToDelete = parseInt(pathParts.pop()!, 10);
    const arrayPath = pathParts.join('.');

    setEditableWorkflow(prev => {
        if (!prev) return null;
        let newWorkflow = JSON.parse(JSON.stringify(prev));

        // Navigate to the array that needs modification
        let parentArray = newWorkflow;
        if(arrayPath) {
            arrayPath.split('.').forEach(part => {
                parentArray = parentArray[part];
            });
        }
        
        // Remove the item from the array
        if(Array.isArray(parentArray)) {
            parentArray.splice(indexToDelete, 1);
        }

        return newWorkflow;
    });
};
  
  const confirmDeleteService = async () => {
    if (serviceToDelete) {
        await deleteService(serviceToDelete.id);
        setServiceToDelete(null);
        if (selectedWorkflowId === serviceToDelete.id) {
            setSelectedWorkflowId(null);
        }
    }
  };


  const handleAddStage = () => {
       const newStage: WorkflowStage = { 
           id: `stage-${Date.now()}`, 
           title: "Nueva Etapa Principal", 
           order: (editableWorkflow?.stages?.length || 0) + 1, 
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

  if (isLoadingWorkflows) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header 
          title="Configuración de Flujos de Trabajo" 
          description="Diseñe las etapas y tareas automáticas para cada servicio."
        >
            <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" asChild>
                    <Link href="/services">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a Servicios
                    </Link>
                </Button>
                {canEditWorkflow && hasChanges && (
                    <>
                        <Button onClick={handleSaveChanges}><Save className="mr-2 h-4 w-4"/>Guardar Cambios</Button>
                        <Button variant="ghost" onClick={handleDiscardChanges}>Descartar</Button>
                    </>
                )}
            </div>
        </Header>
      
        <main className="flex-1 grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 p-4 md:p-8">
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Servicios</CardTitle>
                        <CardDescription>Seleccione o reordene un servicio.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={orderedWorkflows.map(wf => wf.id)} strategy={verticalListSortingStrategy}>
                                {orderedWorkflows.map(service => (
                                    <SortableServiceItem
                                        key={service.id}
                                        service={service}
                                        onSelect={handleSelectService}
                                        onDelete={setServiceToDelete}
                                        isSelected={selectedWorkflowId === service.id}
                                        hasChanges={hasChanges && selectedWorkflowId !== service.id}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                        {canEditWorkflow && (
                            <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleAddNewService}>
                                <PlusCircle className="mr-2 h-4 w-4"/>Añadir Servicio
                            </Button>
                        )}
                    </CardContent>
                </Card>
                 {hasChanges && (
                    <div className="p-3 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                        <p className="text-xs font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4"/>Tiene cambios sin guardar. Guarde o descarte para poder cambiar de servicio.</p>
                    </div>
                )}
            </div>
            
            <Card>
              {editableWorkflow ? (
                <>
                <CardHeader>
                  <CardTitle>{editableWorkflow.name}</CardTitle>
                  <CardDescription>Configure las etapas principales para este servicio.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        {canEditWorkflow && (
                            <Button size="sm" variant="default" onClick={handleAddStage}>
                                <Plus className="mr-2 h-4 w-4"/>Añadir Etapa Principal
                            </Button>
                        )}
                        <Accordion type="multiple" className="w-full space-y-4" defaultValue={editableWorkflow.stages?.map(s => s.id) || []}>
                            {editableWorkflow.stages && editableWorkflow.stages.length > 0 ? (
                                editableWorkflow.stages.map((stage, i) => (
                                    <StageCard
                                        key={stage.id}
                                        stage={stage}
                                        level={1}
                                        index={i}
                                        path={`stages.${i}`}
                                        onUpdate={(path, updates) => handleUpdate(path, updates)}
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
                </>
              ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                      <Layers className="h-12 w-12 mb-4" />
                      <p>Seleccione un servicio para ver su flujo de trabajo.</p>
                  </div>
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
        
        <AlertDialog open={!!serviceToDelete} onOpenChange={() => setServiceToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el servicio "{serviceToDelete?.name}" y todos sus flujos de trabajo asociados.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setServiceToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteService} className="bg-destructive hover:bg-destructive/90">
                        Eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
