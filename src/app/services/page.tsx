
"use client";

import React, { useState } from "react";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Briefcase, Workflow, Edit, Save, Trash2, FileText, UploadCloud, Plus } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCRMData } from "@/contexts/CRMDataContext";
import { useDialogs } from "@/contexts/DialogsContext";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type Document, type ClientRequirement, type ServiceWorkflow } from "@/lib/types";
import { PromptNameDialog } from "@/components/shared/PromptNameDialog";
import { Input } from "@/components/ui/input";

function ServiceDocuments({ serviceId }: { serviceId: string }) {
  const { getDocumentsByServiceId, deleteDocument } = useCRMData();
  const { setIsSmartUploadDialogOpen } = useDialogs(); // Use shared dialog state
  const documents = getDocumentsByServiceId(serviceId);

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm">Documentos del Servicio</h4>
      {documents.length > 0 ? (
        <ul className="space-y-2">
          {documents.map(doc => (
            <li key={doc.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded-md">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <p className="font-medium truncate text-sm" title={doc.name}>{doc.name}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteDocument(doc.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">No hay documentos para este servicio.</p>
      )}
      <Button variant="outline" size="sm" onClick={() => setIsSmartUploadDialogOpen(true)}>
          <UploadCloud className="mr-2 h-4 w-4" />
          Subir Documento
      </Button>
    </div>
  );
}


export default function ServicesPage() {
  const { serviceWorkflows, isLoadingWorkflows, addService, updateService, currentUser } = useCRMData();
  const { setIsSmartUploadDialogOpen } = useDialogs();

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editableFields, setEditableFields] = useState<{ description: string; clientRequirements: ClientRequirement[] }>({ description: '', clientRequirements: [] });
  const [isPromptNameOpen, setIsPromptNameOpen] = useState(false);

  const canEditWorkflow = currentUser?.permissions.crm_edit ?? true;

  const handleStartEdit = (service: ServiceWorkflow) => {
    setEditingServiceId(service.id);
    setEditableFields({
      description: service.description || '',
      clientRequirements: service.clientRequirements ? JSON.parse(JSON.stringify(service.clientRequirements)) : [], // Deep copy
    });
  };

  const handleCancelEdit = () => {
    setEditingServiceId(null);
  };

  const handleSave = async (serviceId: string) => {
    await updateService(serviceId, {
      description: editableFields.description,
      clientRequirements: editableFields.clientRequirements,
    });
    setEditingServiceId(null);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditableFields(prev => ({ ...prev, [name]: value }));
  };

  const handleRequirementChange = (index: number, value: string) => {
    const newRequirements = [...editableFields.clientRequirements];
    newRequirements[index].text = value;
    setEditableFields(prev => ({ ...prev, clientRequirements: newRequirements }));
  };

  const handleAddRequirement = () => {
    const newRequirement: ClientRequirement = { id: `req-${Date.now()}`, text: '' };
    setEditableFields(prev => ({
      ...prev,
      clientRequirements: [...prev.clientRequirements, newRequirement]
    }));
  };

  const handleRemoveRequirement = (index: number) => {
    const newRequirements = editableFields.clientRequirements.filter((_, i) => i !== index);
    setEditableFields(prev => ({ ...prev, clientRequirements: newRequirements }));
  };


  if (isLoadingWorkflows) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header
          title="Servicios"
          description="Gestione los servicios que ofrece su empresa."
        >
          {canEditWorkflow && (
            <Button disabled>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Nuevo Servicio
            </Button>
          )}
        </Header>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header
          title="Servicios"
          description="Gestione los servicios y la documentación asociada."
        >
          {canEditWorkflow && (
            <Button onClick={() => setIsPromptNameOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Nuevo Servicio
            </Button>
          )}
        </Header>
        <main className="flex-1 p-4 md:p-8">
          {serviceWorkflows && serviceWorkflows.length > 0 ? (
            <Accordion type="single" collapsible className="w-full space-y-4">
              {serviceWorkflows.map((service) => {
                const isEditing = editingServiceId === service.id;
                return (
                  <AccordionItem value={service.id} key={service.id} asChild>
                     <Card>
                        <AccordionTrigger className="w-full p-0 [&_svg]:ml-auto [&_svg]:mr-4">
                            <CardHeader className="flex-1 text-left">
                                <CardTitle className="text-lg">
                                    {service.name}
                                </CardTitle>
                            </CardHeader>
                        </AccordionTrigger>
                        <AccordionContent className="p-6 pt-0">
                            <div className="space-y-6">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="description">Descripción del Servicio</Label>
                                            <Textarea id="description" name="description" value={editableFields.description} onChange={handleDescriptionChange} placeholder="Describa en qué consiste el servicio..." />
                                        </div>
                                        
                                        <ServiceDocuments serviceId={service.id} />
                                        
                                        <div>
                                          <Label>Requisitos del Cliente</Label>
                                          <div className="space-y-2">
                                            {editableFields.clientRequirements.map((req, index) => (
                                              <div key={req.id} className="flex items-center gap-2">
                                                <Input
                                                  value={req.text}
                                                  onChange={(e) => handleRequirementChange(index, e.target.value)}
                                                  placeholder={`Requisito ${index + 1}`}
                                                />
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveRequirement(index)}>
                                                  <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                              </div>
                                            ))}
                                            <Button variant="outline" size="sm" onClick={handleAddRequirement}>
                                              <Plus className="h-4 w-4 mr-2" />
                                              Añadir Requisito
                                            </Button>
                                          </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <h4 className="font-semibold text-sm">Descripción</h4>
                                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{service.description || 'No hay descripción.'}</p>
                                        </div>

                                        <ServiceDocuments serviceId={service.id} />

                                        <div>
                                            <h4 className="font-semibold text-sm">Requisitos del Cliente</h4>
                                            {service.clientRequirements && service.clientRequirements.length > 0 ? (
                                                <ul className="list-disc list-inside space-y-1 mt-1 text-sm text-muted-foreground">
                                                    {service.clientRequirements.map(req => <li key={req.id}>{req.text}</li>)}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-muted-foreground mt-1">No hay requisitos especificados.</p>
                                            )}
                                        </div>
                                    </>
                                )}

                                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                                    {isEditing ? (
                                        <>
                                            <Button onClick={() => handleSave(service.id)}><Save className="mr-2 h-4 w-4"/>Guardar</Button>
                                            <Button variant="outline" onClick={handleCancelEdit}>Cancelar</Button>
                                        </>
                                    ) : (
                                        <Button variant="outline" onClick={() => handleStartEdit(service)}><Edit className="mr-2 h-4 w-4"/>Editar Descripción y Requisitos</Button>
                                    )}
                                    <Button asChild>
                                        <Link href={`/workflows?serviceId=${service.id}`}>
                                            <Workflow className="mr-2 h-4 w-4" />
                                            Configurar Flujo de Trabajo
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </AccordionContent>
                    </Card>
                  </AccordionItem>
                )
              })}
            </Accordion>
          ) : (
            <div className="col-span-full text-center text-muted-foreground py-16 border border-dashed rounded-lg">
              <Briefcase className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold">No hay servicios configurados</h3>
              <p className="text-sm mt-1">
                Empiece por añadir un nuevo servicio para poder configurar su flujo de trabajo.
              </p>
            </div>
          )}
        </main>
      </div>
      <PromptNameDialog
        isOpen={isPromptNameOpen}
        onOpenChange={setIsPromptNameOpen}
        title="Añadir Nuevo Servicio"
        description="Introduzca un nombre para el nuevo servicio. Podrá configurar los detalles más tarde."
        label="Nombre del Servicio"
        onSave={async (name) => {
            await addService(name);
        }}
      />
    </>
  );
}
