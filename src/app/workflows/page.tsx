
"use client";

import React, { useState, useMemo, useEffect, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCRMData } from "@/contexts/CRMDataContext";
import type { WorkflowStage, ServiceWorkflow, ServicePackage, WorkflowAction, SubStage, SubSubStage, Commission, RevenueDistribution } from "@/lib/types";
import { Edit, Save, Trash2, Plus, X, Loader2, UploadCloud, ChevronsRight, FileText, ListTodo, Workflow as WorkflowIcon, ArrowLeft, PlusCircle, Layers, FolderCog, Redo, AlertTriangle, GripVertical, ChevronsUpDown, Package } from "lucide-react";
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
import { RevenueDistributionEditor } from "@/components/services/RevenueDistributionEditor";

type AnyStage = WorkflowStage | SubStage | SubSubStage;

// Professional solid color palette
const stageColorPalette = [
  { solid: 'bg-slate-700 dark:bg-slate-600', text: 'text-white', border: 'border-slate-700 dark:border-slate-500' },
  { solid: 'bg-blue-700 dark:bg-blue-600', text: 'text-white', border: 'border-blue-700 dark:border-blue-500' },
  { solid: 'bg-emerald-700 dark:bg-emerald-600', text: 'text-white', border: 'border-emerald-700 dark:border-emerald-500' },
  { solid: 'bg-violet-700 dark:bg-violet-600', text: 'text-white', border: 'border-violet-700 dark:border-violet-500' },
  { solid: 'bg-amber-600 dark:bg-amber-500', text: 'text-white', border: 'border-amber-600 dark:border-amber-500' },
  { solid: 'bg-rose-700 dark:bg-rose-600', text: 'text-white', border: 'border-rose-700 dark:border-rose-500' },
];

const StageNumberIcon = ({ path }: { path: string }) => {
    const numbers = path.split('.').filter(p => !isNaN(parseInt(p))).map(p => parseInt(p) + 1);
    const displayNumber = numbers.join('.');
    const firstNumber = numbers[0] || 1;
    const color = stageColorPalette[(firstNumber - 1) % stageColorPalette.length];
    
    const level = numbers.length;
    const sizeStyles = {
        1: "w-11 h-11 text-lg",
        2: "w-9 h-9 text-sm",
        3: "w-7 h-7 text-xs",
    };

    // Solid style for level 1, outlined for sub-levels
    if (level === 1) {
        return (
            <div className={cn(
                "rounded-full flex items-center justify-center font-semibold shadow-md",
                sizeStyles[1],
                color.solid, color.text
            )}>
                {displayNumber}
            </div>
        );
    }
    
    return (
        <div className={cn(
            "rounded-full flex items-center justify-center font-medium border-2 bg-background shadow-sm",
            sizeStyles[level as keyof typeof sizeStyles],
            color.border
        )}>
            {displayNumber}
        </div>
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
    const canEditWorkflow = true; 
    const [addTaskDialogState, setAddTaskDialogState] = useState<{isOpen: boolean, path: string | null}>({isOpen: false, path: null});

    // Get color based on stage number from path
    const stageNumber = parseInt(path.split('.').filter(p => !isNaN(parseInt(p)))[0] || '0');
    const stageColor = stageColorPalette[stageNumber % stageColorPalette.length];
    
    const levelStyles = {
        1: { card: `border-l-4 ${stageColor.border} bg-card shadow-sm`, trigger: "text-lg", subStageContainer: "", subSubStageContainer: "" },
        2: { card: "bg-muted/30 border-l-2 border-muted-foreground/30", trigger: "text-md", subStageContainer: "pl-4", subSubStageContainer: "pl-4" },
        3: { card: "bg-muted/20 border-l-2 border-dashed border-muted-foreground/20", trigger: "text-base", subStageContainer: "pl-6", subSubStageContainer: "pl-6" }
    }

    const handleUpdateAction = (actionId: string, updates: Partial<WorkflowAction>) => {
        const newActions = stage.actions.map((a: WorkflowAction) => a.id === actionId ? { ...a, ...updates } : a);
        onUpdate(path, { actions: newActions });
    };
    
    const handleDeleteAction = (actionId: string) => {
        const newActions = stage.actions.filter((a: WorkflowAction) => a.id !== actionId);
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
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Tareas Automáticas</Label>
                        {stage.actions && stage.actions.length > 0 ? (
                            <div className="space-y-3">
                            {stage.actions.map((action: WorkflowAction) => (
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
                   
                    {'subStages' in stage && (
                        <div className={cn("border-l-2 ml-2 space-y-4", levelStyles[level].subStageContainer)}>
                             <div className="space-y-1">
                                <Label className="text-sm font-medium">📋 Etapas dentro de esta Fase</Label>
                                <p className="text-xs text-muted-foreground">Divide esta fase en etapas más específicas</p>
                             </div>
                            {((stage as any).subStages as SubStage[] | undefined)?.map((sub: SubStage, i: number) => (
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
                                    <Plus className="mr-2 h-4 w-4"/>+ Etapa
                                </Button>
                            )}
                        </div>
                    )}
                    {'subSubStages' in stage && (
                         <div className={cn("border-l-2 ml-2 space-y-4", levelStyles[level].subSubStageContainer)}>
                            <div className="space-y-1">
                                <Label className="text-sm font-medium">📌 Pasos de esta Etapa</Label>
                                <p className="text-xs text-muted-foreground">Detalla los pasos específicos a seguir</p>
                            </div>
                            {((stage as any).subSubStages as SubSubStage[] | undefined)?.map((sub: SubSubStage, i: number) => (
                                <StageCard
                                    key={sub.id}
                                    stage={sub}
                                    level={3}
                                    index={i}
                                    path={`${path}.subSubStages.${i}`}
                                    onUpdate={onUpdate}
                                    onDelete={onDelete}
                                    onAddSubStage={onAddSubStage}
                                    onAddTask={onAddTask}
                                />
                            ))}
                             {canEditWorkflow && (
                                <div className="pl-6">
                                    <Button variant={'default'} size="sm" onClick={() => onAddSubStage(path)} className="bg-primary hover:bg-primary/90">
                                        <Plus className="mr-2 h-4 w-4"/>+ Paso
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
            clients={[]}
            onTaskAdd={handleAddTaskToStage}
            isWorkflowMode={true}
        />
        </>
    );
};


function SortableServiceItem({ service, onSelect, onDelete }: { service: ServiceWorkflow, onSelect: () => void, onDelete: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: service.id });
    
    const style = {
        transform: CSS.Translate.toString(transform),
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
    servicePackages,
    isLoadingPackages,
    addServicePackage,
    updateServicePackage,
    deleteServicePackage,
  } = useCRMData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showNotification } = useGlobalNotification();

  const [orderedWorkflows, setOrderedWorkflows] = useState<ServiceWorkflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [editableWorkflow, setEditableWorkflow] = useState<ServiceWorkflow | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceWorkflow | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  
  // Package management state
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [newPackageName, setNewPackageName] = useState('');
  const [newPackageDescription, setNewPackageDescription] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [packageToDelete, setPackageToDelete] = useState<ServicePackage | null>(null);
  
  const [isPromptNameOpen, setIsPromptNameOpen] = useState(false);
  const [promptNameConfig, setPromptNameConfig] = useState<{
    title: string;
    description: string;
    label: string;
    onSave: (name: string) => void;
    inputPlaceholder?: string;
  } | null>(null);
  
  const canEditWorkflow = true;

  const fromPage = searchParams.get('from') || 'services';
  const backLink = fromPage === 'crm' ? '/crm' : '/services';
  const backLabel = fromPage === 'crm' ? 'Volver a CRM' : 'Volver a Servicios';

 useEffect(() => {
    if (initialWorkflows) {
      const sorted = [...initialWorkflows].sort((a,b) => (a.order || 0) - (b.order || 0));
      setOrderedWorkflows(sorted);

      const serviceIdFromUrl = searchParams.get('serviceId');
      
      if (selectedWorkflowId && !sorted.some(s => s.id === selectedWorkflowId)) {
        // If the selected workflow was deleted, select the first available one
        const firstActiveId = sorted.find(s => s.status !== 'Archivado')?.id;
        setSelectedWorkflowId(firstActiveId || null);
        if(firstActiveId) {
            router.replace(`/workflows?serviceId=${firstActiveId}&from=${fromPage}`, { scroll: false });
        } else {
            router.replace(`/workflows?from=${fromPage}`, { scroll: false });
        }
      } else if (serviceIdFromUrl && sorted.some(s => s.id === serviceIdFromUrl)) {
        setSelectedWorkflowId(serviceIdFromUrl);
      } else if (!selectedWorkflowId) {
        const firstActiveId = sorted.find(s => s.status !== 'Archivado')?.id;
        if (firstActiveId) {
            setSelectedWorkflowId(firstActiveId);
            router.replace(`/workflows?serviceId=${firstActiveId}&from=${fromPage}`, { scroll: false });
        }
      }
    }
  }, [initialWorkflows, fromPage, router, selectedWorkflowId, searchParams]);


  const activeWorkflows = useMemo(() => {
    return orderedWorkflows.filter(s => s.status !== 'Archivado');
  }, [orderedWorkflows]);


  const selectedWorkflow = useMemo(() => {
    if (!orderedWorkflows) return null;
    return orderedWorkflows.find(wf => wf.id === selectedWorkflowId) || null;
  }, [selectedWorkflowId, orderedWorkflows]);
  
  useEffect(() => {
    if (selectedWorkflow) {
        // Deep clone and ensure all nested arrays are properly initialized
        const workflow = JSON.parse(JSON.stringify(selectedWorkflow));
        workflow.stages = (workflow.stages || []).map((stage: WorkflowStage) => ({
            ...stage,
            actions: stage.actions || [],
            subStages: (stage.subStages || []).map((subStage: SubStage) => ({
                ...subStage,
                actions: subStage.actions || [],
                subSubStages: (subStage.subSubStages || []).map((subSubStage: SubSubStage) => ({
                    ...subSubStage,
                    actions: subSubStage.actions || [],
                })),
            })),
        }));
        setEditableWorkflow(workflow);
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
          const reorderedItems = arrayMove(activeWorkflows, activeWorkflows.findIndex(item => item.id === active.id), activeWorkflows.findIndex(item => item.id === over.id));
          const updatedOrderWithFirestore = reorderedItems.map((wf, index) => ({...wf, order: index}));
          
          setServiceWorkflows(updatedOrderWithFirestore);
          setOrderedWorkflows(updatedOrderWithFirestore);
          
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
        }
        setIsSelectorOpen(false);
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
    
    Promise.resolve(setServiceWorkflows(updatedWorkflows)).then(() => {
      showNotification('success', 'Flujo Guardado', 'Los cambios en el flujo de trabajo han sido guardados.');
    });
  }, [editableWorkflow, orderedWorkflows, setServiceWorkflows, showNotification]);
  


  const updateNestedState = (path: string, value: any, operation: 'update' | 'add' | 'delete') => {
      setEditableWorkflow((prev: ServiceWorkflow | null) => {
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
      
      setEditableWorkflow((prev: ServiceWorkflow | null) => {
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

    setEditableWorkflow((prev: ServiceWorkflow | null) => {
        if (!prev) return null;
        let newWorkflow = JSON.parse(JSON.stringify(prev));

        let parentArray = newWorkflow;
        if(arrayPath) {
            arrayPath.split('.').forEach(part => {
                parentArray = parentArray[part];
            });
        }
        
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
    }
  };


  const handleAddStage = () => {
       const newStage: WorkflowStage = { 
           id: `stage-${Date.now()}`, 
           title: "Nueva Fase", 
           order: (editableWorkflow?.stages?.length || 0) + 1, 
           actions: [],
           subStages: [],
        };
       updateNestedState('stages', newStage, 'add');
  };

  const handleAddSubStage = (path: string) => {
      const parts = path.split('.');
      const parentIsStage = parts.length === 2;

      if (parentIsStage) {
          const newSubStage: SubStage = {
              id: `subStage-${Date.now()}`,
              title: "Nueva Etapa",
              order: 1,
              actions: [],
              subSubStages: []
          };
          updateNestedState(`${path}.subStages`, newSubStage, 'add');
      } else { 
          const newSubSubStage: SubSubStage = {
              id: `subSubStage-${Date.now()}`,
              title: "Nuevo Paso",
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
        order: 1,
        subActions: [],
      };
      updateNestedState(`${path}.actions`, newTask, 'add');
  };

  // Package handlers
  const activePackages = useMemo(() => {
    return (servicePackages || []).filter(p => p.status !== 'Archivado');
  }, [servicePackages]);

  const handleOpenPackageDialog = (pkg?: ServicePackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setNewPackageName(pkg.name);
      setNewPackageDescription(pkg.description || '');
      setSelectedServiceIds(pkg.serviceIds || []);
    } else {
      setEditingPackage(null);
      setNewPackageName('');
      setNewPackageDescription('');
      setSelectedServiceIds([]);
    }
    setIsPackageDialogOpen(true);
  };

  const handleSavePackage = async () => {
    if (!newPackageName.trim()) {
      showNotification('error', 'Error', 'El nombre del paquete es requerido');
      return;
    }
    if (selectedServiceIds.length < 2) {
      showNotification('error', 'Error', 'Un paquete debe incluir al menos 2 servicios');
      return;
    }

    if (editingPackage) {
      await updateServicePackage(editingPackage.id, {
        name: newPackageName.trim(),
        description: newPackageDescription.trim(),
        serviceIds: selectedServiceIds,
      });
      showNotification('success', 'Paquete Actualizado', `El paquete "${newPackageName}" ha sido actualizado.`);
    } else {
      await addServicePackage({
        name: newPackageName.trim(),
        description: newPackageDescription.trim(),
        serviceIds: selectedServiceIds,
      });
    }
    setIsPackageDialogOpen(false);
  };

  const handleToggleServiceInPackage = (serviceId: string) => {
    setSelectedServiceIds(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const confirmDeletePackage = async () => {
    if (packageToDelete) {
      await deleteServicePackage(packageToDelete.id);
      setPackageToDelete(null);
    }
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
                                disabled={hasChanges}
                            >
                                <span className="truncate">{selectedWorkflow?.name || "Seleccione un servicio..."}</span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <div className="p-2 space-y-1">
                                    <SortableContext items={activeWorkflows.map(wf => wf.id)} strategy={verticalListSortingStrategy}>
                                        {activeWorkflows.map(service => (
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

            {/* Service Packages Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Paquetes de Servicios
                            </CardTitle>
                            <CardDescription>Combine múltiples servicios en paquetes para contabilidad unificada.</CardDescription>
                        </div>
                        <Button onClick={() => handleOpenPackageDialog()} size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Crear Paquete
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {activePackages.length > 0 ? (
                        <div className="space-y-3">
                            {activePackages.map(pkg => {
                                const includedServices = pkg.serviceIds
                                    .map(id => activeWorkflows.find(s => s.id === id)?.name)
                                    .filter(Boolean);
                                return (
                                    <div key={pkg.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium">{pkg.name}</p>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {includedServices.join(' + ')}
                                            </p>
                                            {pkg.description && (
                                                <p className="text-xs text-muted-foreground mt-1">{pkg.description}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenPackageDialog(pkg)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setPackageToDelete(pkg)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-6">
                            No hay paquetes creados. Cree uno para combinar servicios.
                        </p>
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
                                        key={editableWorkflow.id}
                                        service={editableWorkflow}
                                        onUpdate={(updates) => setEditableWorkflow((prev: ServiceWorkflow | null) => prev ? { ...prev, ...updates } : null)}
                                        canEdit={canEditWorkflow}
                                    />
                                    <div className="space-y-4">
                                        <ServiceCommissionsEditor
                                            key={`${editableWorkflow.id}-commissions`}
                                            initialCommissions={editableWorkflow.commissions || []}
                                            onUpdate={(commissions) => setEditableWorkflow((prev: ServiceWorkflow | null) => prev ? { ...prev, commissions } : null)}
                                            canEdit={canEditWorkflow}
                                        />
                                        <ServiceDocumentsEditor serviceId={editableWorkflow.id} canEdit={canEditWorkflow} />
                                    </div>
                                </div>
                            </AccordionContent>
                        </Card>
                    </AccordionItem>

                    <AccordionItem value="revenue" asChild>
                        <Card>
                            <AccordionTrigger className="w-full p-0 [&_svg]:ml-auto [&_svg]:mr-4">
                                <CardHeader className="flex-1 text-left">
                                    <CardTitle>💰 Proveedores y Distribución de Ingresos</CardTitle>
                                    <CardDescription>Vincula proveedores y configura cómo se reparte el ingreso.</CardDescription>
                                </CardHeader>
                            </AccordionTrigger>
                            <AccordionContent className="p-6 pt-0">
                                <RevenueDistributionEditor
                                    key={`${editableWorkflow.id}-revenue`}
                                    distribution={editableWorkflow.revenueDistribution}
                                    linkedSupplierIds={editableWorkflow.linkedSupplierIds}
                                    primarySupplierId={editableWorkflow.primarySupplierId}
                                    onUpdateDistribution={(distribution) => 
                                        setEditableWorkflow((prev: ServiceWorkflow | null) => 
                                            prev ? { ...prev, revenueDistribution: distribution } : null
                                        )
                                    }
                                    onUpdateSuppliers={(linkedIds, primaryId) => 
                                        setEditableWorkflow((prev: ServiceWorkflow | null) => 
                                            prev ? { ...prev, linkedSupplierIds: linkedIds, primarySupplierId: primaryId } : null
                                        )
                                    }
                                    canEdit={canEditWorkflow}
                                />
                            </AccordionContent>
                        </Card>
                    </AccordionItem>

                    <AccordionItem value="stages" asChild>
                        <Card>
                            <AccordionTrigger className="w-full p-0 [&_svg]:ml-auto [&_svg]:mr-4">
                                <CardHeader className="flex-1 text-left">
                                  <CardTitle>📈 Fases del Flujo de Trabajo</CardTitle>
                                  <CardDescription>Organice el proceso en fases, etapas y pasos con sus tareas automáticas.</CardDescription>
                                </CardHeader>
                            </AccordionTrigger>
                            <AccordionContent className="p-6 pt-0 space-y-6">
                                {/* Help Guide */}
                                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">💡 Cómo organizar tu flujo:</p>
                                    <div className="grid sm:grid-cols-3 gap-3 text-xs text-blue-700 dark:text-blue-300">
                                        <div className="flex items-start gap-2">
                                            <span className="font-bold text-lg">1️⃣</span>
                                            <div>
                                                <p className="font-semibold">Fase</p>
                                                <p>Etapa principal del proceso (ej: Prospección, Onboarding)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="font-bold text-lg">1.1</span>
                                            <div>
                                                <p className="font-semibold">Etapa</p>
                                                <p>Subdivisión de la fase (ej: Contacto inicial, Documentación)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="text-xs bg-muted rounded-full w-5 h-5 flex items-center justify-center">1</span>
                                            <div>
                                                <p className="font-semibold">Paso</p>
                                                <p>Acción específica (ej: Verificar RFC, Subir contrato)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {canEditWorkflow && (
                                        <Button size="sm" variant="default" onClick={handleAddStage} className="bg-primary hover:bg-primary/90">
                                            <Plus className="mr-2 h-4 w-4"/>+ Nueva Fase
                                        </Button>
                                    )}
                                    <Accordion type="multiple" className="w-full space-y-4" defaultValue={editableWorkflow.stages?.map((s: WorkflowStage) => s.id) || []}>
                                        {editableWorkflow.stages && editableWorkflow.stages.length > 0 ? (
                                            editableWorkflow.stages.map((stage: WorkflowStage, i: number) => (
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
                                            <div className="text-center py-8 space-y-2">
                                                <p className="text-sm text-muted-foreground">{canEditWorkflow ? '¡Comienza creando tu primera fase!' : 'No hay fases definidas.'}</p>
                                                {canEditWorkflow && <p className="text-xs text-muted-foreground">Haz clic en "+ Nueva Fase" para empezar a diseñar tu flujo de trabajo.</p>}
                                            </div>
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
                        Esta acción enviará el servicio "{serviceToDelete?.name}" a la papelera. Podrá restaurarlo más tarde.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setServiceToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteService} className="bg-destructive hover:bg-destructive/90">
                        Enviar a la papelera
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Package Delete Confirmation */}
        <AlertDialog open={!!packageToDelete} onOpenChange={() => setPackageToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar paquete?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción eliminará el paquete "{packageToDelete?.name}". Los servicios individuales no serán afectados.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setPackageToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeletePackage} className="bg-destructive hover:bg-destructive/90">
                        Eliminar Paquete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Package Create/Edit Dialog */}
        <AlertDialog open={isPackageDialogOpen} onOpenChange={setIsPackageDialogOpen}>
            <AlertDialogContent className="max-w-lg">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {editingPackage ? 'Editar Paquete' : 'Crear Paquete de Servicios'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Combine múltiples servicios en un paquete para contabilidad y facturación unificada.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="packageName">Nombre del Paquete</Label>
                        <Input
                            id="packageName"
                            placeholder="Ej: Terminales + Banca Digital"
                            value={newPackageName}
                            onChange={(e) => setNewPackageName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="packageDescription">Descripción (opcional)</Label>
                        <Textarea
                            id="packageDescription"
                            placeholder="Descripción del paquete..."
                            value={newPackageDescription}
                            onChange={(e) => setNewPackageDescription(e.target.value)}
                            rows={2}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Servicios Incluidos ({selectedServiceIds.length} seleccionados)</Label>
                        <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                            {activeWorkflows.map(service => (
                                <div
                                    key={service.id}
                                    className={cn(
                                        "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                                        selectedServiceIds.includes(service.id) 
                                            ? "bg-primary/10 border border-primary" 
                                            : "hover:bg-muted"
                                    )}
                                    onClick={() => handleToggleServiceInPackage(service.id)}
                                >
                                    <div className={cn(
                                        "h-4 w-4 rounded border flex items-center justify-center",
                                        selectedServiceIds.includes(service.id) 
                                            ? "bg-primary border-primary text-primary-foreground" 
                                            : "border-muted-foreground"
                                    )}>
                                        {selectedServiceIds.includes(service.id) && (
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-sm">{service.name}</span>
                                </div>
                            ))}
                        </div>
                        {selectedServiceIds.length < 2 && (
                            <p className="text-xs text-amber-600">Seleccione al menos 2 servicios para crear un paquete.</p>
                        )}
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleSavePackage}
                        disabled={!newPackageName.trim() || selectedServiceIds.length < 2}
                    >
                        {editingPackage ? 'Guardar Cambios' : 'Crear Paquete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
