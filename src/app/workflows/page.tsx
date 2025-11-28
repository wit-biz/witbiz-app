
"use client";

import React, { useState, useMemo, useEffect, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCRMData, type WorkflowStage, type ServiceWorkflow, type WorkflowAction, type SubStage, type SubSubStage, type Commission } from "@/contexts/CRMDataContext"; 
import { Edit, Save, Trash2, Plus, X, Loader2, UploadCloud, ChevronsRight, FileText, ListTodo, Workflow as WorkflowIcon, ArrowLeft, PlusCircle, Layers, FolderCog, Redo, AlertTriangle, GripVertical, ChevronsUpDown } from "lucide-react";
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ServiceDetailsEditor } from "@/components/services/DetailsEditor";
import { ServiceDocumentsEditor } from "@/components/services/DocumentsEditor";
import { ServiceCommissionsEditor } from "@/components/services/CommissionsEditor";


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
        1: { card: "bg-card", trigger: "text-lg", subStageContainer: "", subStageButton: "default", subSubStageButton: "default" },
        2: { card: "bg-muted/40", trigger: "text-md", subStageContainer: "pl-4", subStageButton: "default", subSubStageButton: "default" },
        3: { card: "bg-muted/20", trigger: "text-base", subStageContainer: "pl-8", subStageButton: "default", subSubStageButton: "default" }
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
                                        <div className="space-y-3 pt-2 border-t">
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id={`req-doc-${action.id}`}
                                                    checked={action.requiredDocumentForCompletion}
                                                    onCheckedChange={(checked) => handleUpdateAction(action.id, { requiredDocumentForCompletion: checked, requiresInput: checked ? false : action.requiresInput })}
                                                />
                                                <Label htmlFor={`req-doc-${action.id}`} className="text-sm">Requiere documento(s)</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id={`req-input-${action.id}`}
                                                    checked={action.requiresInput}
                                                    onCheckedChange={(checked) => handleUpdateAction(action.id, { requiresInput: checked, requiredDocumentForCompletion: checked ? false : action.requiredDocumentForCompletion })}
                                                />
                                                <Label htmlFor={`req-input-${action.id}`} className="text-sm">Requiere nota</Label>
                                            </div>
                                        </div>
                                     )}
                                </div>
                            ))}
                            </div>
                        ) : <p className="text-xs text-muted-foreground">No hay tareas definidas.</p>}
                         {canEditWorkflow && (
                          <Button variant="outline" size="sm" onClick={() => setAddTaskDialogState({isOpen: true, path: path})} className="bg-blue-600 hover:bg-blue-700 text-white border-blue-700">
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
                                <Button variant={'default'} size="sm" onClick={() => onAddSubStage(path)} className="bg-primary hover:bg-primary/90">
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
                                    <Button variant={'default'} size="sm" onClick={() => onAddSubStage(path)} className="bg-primary hover:bg-primary/90">
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


function SortableServiceItem({ service, onSelect, onDelete }: { service: ServiceWorkflow, onSelect: () => void, onDelete: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: service.id });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center justify-between p-2 rounded-md hover:bg-muted" onClick={onSelect}>
            <div className="flex items-center flex-grow gap-2 min-w-0">
                <Button variant="ghost" size="icon" {...listeners} {...attributes} onClick={e => e.stopPropagation()} className="cursor-grab touch-none h-8 w-8">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
                <p className="font-medium text-sm truncate">{service.name}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => {e.stopPropagation(); onDelete();}}>
                <Trash2 className="h-4 w-4"/>
            </Button>
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
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  
  const [isPromptNameOpen, setIsPromptNameOpen] = useState(false);
  const [promptNameConfig, setPromptNameConfig] = useState<{
    title: string;
    description: string;
    label: string;
    onSave: (name: string) => void;
    inputPlaceholder?: string;
  } | null>(null);
  
  const canEditWorkflow = currentUser?.permissions.crm_edit ?? true;

  const fromPage = searchParams.get('from') || 'services';
  const backLink = fromPage === 'crm' ? '/crm' : '/services';
  const backLabel = fromPage === 'crm' ? 'Volver a CRM' : 'Volver a Servicios';

  useEffect(() => {
    if (initialWorkflows) {
      const sorted = [...initialWorkflows].sort((a,b) => (a.order || 0) - (b.order || 0));
      setOrderedWorkflows(sorted);

      const serviceIdFromUrl = searchParams.get('serviceId');
      if (serviceIdFromUrl && sorted.some(s => s.id === serviceIdFromUrl)) {
        setSelectedWorkflowId(serviceIdFromUrl);
      } else if (!selectedWorkflowId && sorted.length > 0) {
        const firstId = sorted[0].id;
        setSelectedWorkflowId(firstId);
        router.replace(`/workflows?serviceId=${firstId}&from=${fromPage}`, { scroll: false });
      }
    }
  }, [initialWorkflows, searchParams, router, selectedWorkflowId, fromPage]);

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

  const hasChanges = useMemo(() => {
    if (!selectedWorkflow || !editableWorkflow) return false;
    return JSON.stringify(selectedWorkflow) !== JSON.stringify(editableWorkflow);
  }, [selectedWorkflow, editableWorkflow]);

  const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
          const reorderedItems = arrayMove(orderedWorkflows, orderedWorkflows.findIndex(item => item.id === active.id), orderedWorkflows.findIndex(item => item.id === over.id));
          const updatedOrderWithFirestore = reorderedItems.map((wf, index) => ({...wf, order: index}));
          
          setServiceWorkflows(updatedOrderWithFirestore);
          setOrderedWorkflows(updatedOrderWithFirestore); // Update local state immediately for smoother UI
          
          showNotification('info', 'Orden guardado', 'El nuevo orden de los servicios ha sido guardado.');
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
          router.push(`/workflows?serviceId=${newService.id}&from=${fromPage}`);
          setIsSelectorOpen(false);
        }
      },
    });
    setIsPromptNameOpen(true);
  };
  
  const handleSelectService = useCallback((id: string) => {
    setSelectedWorkflowId(id);
    router.push(`/workflows?serviceId=${id}&from=${fromPage}`);
    setIsSelectorOpen(false);
  }, [router, fromPage]);


  const handleDiscardChanges = useCallback(() => {
      if(selectedWorkflow) {
        Promise.resolve(setEditableWorkflow(JSON.parse(JSON.stringify(selectedWorkflow)))).then(() => {
          showNotification('info', 'Cambios Descartados', 'Se han revertido las modificaciones.');
        });
      }
  }, [selectedWorkflow, showNotification]);

  const handleSaveChanges = useCallback(() => {
    if (!editableWorkflow) return;
    const updatedWorkflows = orderedWorkflows.map(wf => wf.id === editableWorkflow.id ? editableWorkflow : wf);
    
    // Using a promise to ensure state updates before notification
    Promise.resolve(setServiceWorkflows(updatedWorkflows)).then(() => {
      showNotification('success', 'Flujo Guardado', 'Los cambios en el flujo de trabajo han sido guardados.');
    });
  }, [editableWorkflow, orderedWorkflows, setServiceWorkflows, showNotification]);
  


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
            router.push('/workflows');
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
          title="Configuración de Servicios y Flujos" 
          description="Diseñe las etapas y tareas automáticas para cada servicio."
        >
            <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" asChild>
                    <Link href={backLink}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {backLabel}
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
      
        <main className="flex-1 p-4 md:p-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Selector de Servicio</CardTitle>
                    <CardDescription>Seleccione un servicio para configurar o reordenar la lista.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Popover open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isSelectorOpen}
                                className="w-full max-w-sm justify-between"
                            >
                                <span className="truncate">{selectedWorkflow?.name || "Seleccione un servicio..."}</span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <div className="p-2 space-y-1">
                                    <SortableContext items={orderedWorkflows.map(wf => wf.id)} strategy={verticalListSortingStrategy}>
                                        {orderedWorkflows.map(service => (
                                            <SortableServiceItem
                                                key={service.id}
                                                service={service}
                                                onSelect={() => handleSelectService(service.id)}
                                                onDelete={() => setServiceToDelete(service)}
                                            />
                                        ))}
                                    </SortableContext>
                                </div>
                            </DndContext>
                            {canEditWorkflow && (
                                <>
                                <div className="border-t p-2">
                                    <Button variant="outline" size="sm" className="w-full" onClick={handleAddNewService}>
                                        <PlusCircle className="mr-2 h-4 w-4"/>Añadir Nuevo Servicio
                                    </Button>
                                </div>
                                </>
                            )}
                        </PopoverContent>
                    </Popover>
                    {hasChanges && (
                        <div className="mt-4 p-3 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                            <p className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4"/>Tiene cambios sin guardar. Guarde o descarte para poder cambiar de servicio.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            {editableWorkflow ? (
                <Accordion type="multiple" defaultValue={["details", "stages"]} className="w-full space-y-4">
                    <AccordionItem value="details" asChild>
                        <Card>
                            <AccordionTrigger className="w-full p-0 [&_svg]:ml-auto [&_svg]:mr-4">
                                <CardHeader className="flex-1 text-left">
                                    <CardTitle>Detalles y Documentos del Servicio</CardTitle>
                                    <CardDescription>Edite la información general, comisiones y recursos descargables.</CardDescription>
                                </CardHeader>
                            </AccordionTrigger>
                            <AccordionContent className="p-6 pt-0">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <ServiceDetailsEditor
                                        key={editableWorkflow.id} // Re-mount when service changes
                                        service={editableWorkflow}
                                        onUpdate={(updates) => setEditableWorkflow(prev => prev ? { ...prev, ...updates } : null)}
                                        canEdit={canEditWorkflow}
                                    />
                                    <div className="space-y-4">
                                        <ServiceCommissionsEditor
                                            key={`${editableWorkflow.id}-commissions`} // Re-mount when service changes
                                            initialCommissions={editableWorkflow.commissions || []}
                                            onUpdate={(commissions) => setEditableWorkflow(prev => prev ? { ...prev, commissions } : null)}
                                            canEdit={canEditWorkflow}
                                        />
                                        <ServiceDocumentsEditor serviceId={editableWorkflow.id} canEdit={canEditWorkflow} />
                                    </div>
                                </div>
                            </AccordionContent>
                        </Card>
                    </AccordionItem>

                    <AccordionItem value="stages" asChild>
                        <Card>
                            <AccordionTrigger className="w-full p-0 [&_svg]:ml-auto [&_svg]:mr-4">
                                <CardHeader className="flex-1 text-left">
                                  <CardTitle>Etapas del Flujo de Trabajo</CardTitle>
                                  <CardDescription>Configure las etapas principales para este servicio.</CardDescription>
                                </CardHeader>
                            </AccordionTrigger>
                            <AccordionContent className="p-6 pt-0 space-y-6">
                                <div className="space-y-4">
                                    {canEditWorkflow && (
                                        <Button size="sm" variant="default" onClick={handleAddStage} className="bg-primary hover:bg-primary/90">
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
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                </Accordion>
            ) : (
              <Card>
                  <CardContent className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-12">
                      <Layers className="h-12 w-12 mb-4" />
                      <p>Seleccione un servicio para ver su flujo de trabajo.</p>
                  </CardContent>
              </Card>
            )}

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
